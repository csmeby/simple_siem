from datetime import datetime, timedelta
from collections import defaultdict

from ..models import Alert, Event
from .rules_loader import get_rules

# In-memory state: {rule_id: {key: [timestamps...]}}
_state = defaultdict(lambda: defaultdict(list))

def process_event(db, event: Event):
    rules = get_rules()

    for rule in rules:
        if not rule.get("enabled", True):
            continue

        if not matches_conditions(event, rule.get("conditions", {})):
            continue

        window = rule.get("window", {"minutes": 5})
        threshold = rule.get("threshold", {"count": 10})

        # For now, fixed key_field, or default to "src_ip"
        key_field = rule.get("key_field", "src_ip")
        key = event.fields.get(key_field, "unknown")
        
        # Fallback for known top-level fields if not in fields dict
        if key == "unknown" and hasattr(event, key_field):
            key = getattr(event, key_field)

        now = event.timestamp or datetime.utcnow()
        window_delta = timedelta(minutes=window.get("minutes", 5))

        times = _state[rule["id"]][key]
        times.append(now)

        cutoff = now - window_delta
        _state[rule["id"]][key] = [t for t in times if t >= cutoff]

        if len(_state[rule["id"]][key]) >= threshold.get("count", 10):
            create_alert(db, rule, key, event)
            # Optional: reset the counter for this key to avoid repeated spam
            _state[rule["id"]][key] = []

def matches_conditions(event: Event, conditions: dict) -> bool:
    for field, expected in conditions.items():
        value = get_event_value(event, field)

        # Handle operators (if expected is a dict)
        if isinstance(expected, dict):
            if not match_operators(value, expected):
                return False
        # Handle simple equality
        elif expected != "*" and value != expected:
            return False
            
    return True

def get_event_value(event: Event, field: str):
    # Virtual fields
    if field == "timestamp_hour":
        return event.timestamp.hour

    # Standard fields
    if hasattr(event, field):
        return getattr(event, field)
    # Custom fields
    return event.fields.get(field)

def match_operators(value, operators: dict) -> bool:
    if value is None:
        return False
        
    for op, params in operators.items():
        if op == "starts_with":
            if isinstance(params, list):
                if not any(str(value).startswith(p) for p in params):
                    return False
            elif not str(value).startswith(params):
                return False
        elif op == "in":
            if value not in params:
                return False
        elif op == "range":
            # range: [min, max]
            if not (params[0] <= value <= params[1]):
                return False
        # Add more operators as needed
    return True

def create_alert(db, rule, key, event: Event):
    alert = Alert(
        rule_id=rule["id"],
        severity=rule.get("severity", "medium").upper(),
        title=rule.get("name", "Rule triggered"),
        description=f"Rule {rule['id']} triggered for key {key}",
        events=[event.id],
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)