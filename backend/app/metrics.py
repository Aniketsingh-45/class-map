from collections import Counter
def agreement(a: list, b: list) -> float:
    return sum(x == y for x, y in zip(a, b)) / len(a)

def cohen_kappa(a: list, b: list) -> float:
    n = len(a); po = agreement(a, b)
    ca, cb = Counter(a), Counter(b)
    pe = sum(ca[k] * cb[k] for k in set(a) | set(b)) / (n * n)
    return 1.0 if pe == 1 else (po - pe) / (1 - pe)
