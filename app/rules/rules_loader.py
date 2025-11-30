import yaml
from pathlib import Path

_RULES_CACHE = None

def load_rules_from_files():
    rules_dir = Path(__file__).parent / "rules"
    print(rules_dir)
    rules = []
    for file in rules_dir.glob("*.yaml"):
        with open(file, "r", encoding="utf-8") as f:
            rule = yaml.safe_load(f)
            if rule:
                rules.append(rule)
    print(f"[RULES_LOADER] Loaded {len(rules)} rule(s) from {rules_dir}")
    for r in rules:
        print(f"[RULES_LOADER] Rule loaded: {r.get('id')} - {r.get('name')}")
    return rules

def get_rules():
    global _RULES_CACHE
    if _RULES_CACHE is None:
        _RULES_CACHE = load_rules_from_files()
    return _RULES_CACHE