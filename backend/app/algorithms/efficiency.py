from typing import List, Dict, Any

def pareto_front(outcomes: List[Dict[str, Any]]) -> List[str]:
    pareto_set = []
    eps = 1e-9

    for i, o1 in enumerate(outcomes):
        id1 = o1["id"]
        u1 = o1["utilities"]
        is_dominated = False

        for j, o2 in enumerate(outcomes):
            if i == j:
                continue
            u2 = o2["utilities"]
            # Check if o2 Pareto-dominates o1:
            # u2[0] >= u1[0] and u2[1] >= u1[1] and (u2[0] > u1[0] or u2[1] > u1[1])
            cond_geq = (u2[0] >= u1[0] - eps) and (u2[1] >= u1[1] - eps)
            cond_str = (u2[0] > u1[0] + eps) or (u2[1] > u1[1] + eps)
            
            if cond_geq and cond_str:
                is_dominated = True
                break
        
        if not is_dominated:
            pareto_set.append(id1)

    return pareto_set
