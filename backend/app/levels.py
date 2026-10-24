from .level import LADDER           # ["beginner","letter","word","paragraph","story"]
LEVEL_SCORE = {name: i for i, name in enumerate(LADDER)}
SCORE_LEVEL = {i: name for name, i in LEVEL_SCORE.items()}
def valid_level(x: str) -> bool: return x in LEVEL_SCORE
