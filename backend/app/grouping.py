def group_children(levels: dict[str, int], min_size: int = 3, max_groups: int = 4) -> list[dict]:
    """levels: child -> level score 0..4. Returns groups [{'level':[..], 'children':[..]}]."""
    by = {}
    for child, lv in levels.items():
        by.setdefault(lv, []).append(child)
    groups = [{"levels": [lv], "children": sorted(ch)} for lv, ch in sorted(by.items())]
    def center(g): return sum(g["levels"]) / len(g["levels"])
    # merge groups smaller than min_size into nearest neighbour
    changed = True
    while changed and len(groups) > 1:
        changed = False
        small = [g for g in groups if len(g["children"]) < min_size]
        if not small: break
        g = min(small, key=lambda x: len(x["children"]))
        others = [o for o in groups if o is not g]
        near = min(others, key=lambda o: abs(center(o) - center(g)))
        near["levels"] += g["levels"]; near["children"] += g["children"]
        groups.remove(g); changed = True
    # too many groups: merge the closest pair, preferring small ones
    while len(groups) > max_groups:
        groups.sort(key=center)
        i = min(range(len(groups)-1),
                key=lambda k: (abs(center(groups[k+1]) - center(groups[k])),
                               len(groups[k]["children"]) + len(groups[k+1]["children"])))
        a, b = groups[i], groups[i+1]
        a["levels"] += b["levels"]; a["children"] += b["children"]; groups.pop(i+1)
    groups.sort(key=center)
    return groups
