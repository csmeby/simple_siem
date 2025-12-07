from fastapi import APIRouter
from ..rules.rules_loader import get_rules

router = APIRouter()

@router.get("/")
def list_rules():
    """
    Returns the list of loaded rules.
    """
    return get_rules()
