"""Marking is done by CODE, not by the LLM. The LLM only reads handwriting into JSON."""
def mark(problem: tuple[int, str, int], child_answer: int | None) -> dict:
    a, op, b = problem
    truth = a - b if op == "-" else a + b if op == "+" else None
    if child_answer is None:
        return {"correct": None, "error": "unreadable", "truth": truth}
    if child_answer == truth:
        return {"correct": True, "error": None, "truth": truth}
    err = "other"
    if op == "-" and a >= 10 and b >= 10:
        # column-wise smaller-from-larger bug, e.g. 52-27 -> 35
        col = abs(a % 10 - b % 10) + 10 * abs(a // 10 - b // 10)
        if child_answer == col: err = "smaller_from_larger"
        elif truth is not None and child_answer == truth + 10: err = "borrowed_but_forgot_to_reduce_tens"
        elif child_answer == a + b: err = "added_instead_of_subtracted"
    return {"correct": False, "error": err, "truth": truth}

def level_from_results(results: dict[str, bool]) -> int:
    """results: skill -> passed. Ladder: 0 beginner,1 one-digit,2 two-digit,3 subtraction,4 division."""
    lvl = 0
    for i, skill in enumerate(["num1", "num2", "subtraction", "division"], 1):
        if results.get(skill): lvl = i
        else: break
    return lvl
