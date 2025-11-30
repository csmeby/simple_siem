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
        if hasattr(event, field):
            value = getattr(event, field)
        else:
            value = event.fields.get(field)

        if expected != "*" and value != expected:
            return False
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