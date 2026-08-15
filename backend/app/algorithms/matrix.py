from typing import List, Dict, Any

def find_dominance(payoff_matrix: Dict[str, Any]) -> List[Dict[str, Any]]:
    row_player = payoff_matrix["row_player"]
    col_player = payoff_matrix["column_player"]
    row_strats = payoff_matrix["row_strategies"]
    col_strats = payoff_matrix["column_strategies"]
    cells = payoff_matrix["cells"]

    # Helper to lookup utility: returns (p1_val, p2_val)
    # We map strategy names or outcomes. Let's build a map from (row_strat, col_strat) -> utilities
    # Note: the contract states cells have "outcome_id" and "utilities"
    # An outcome_id like CC corresponds to row_strats[0] and col_strats[0]
    # To be general, let's map cell coordinates
    # Let's map (row_strat, col_strat) to utilities:
    util_map = {}
    for cell in cells:
        oid = cell["outcome_id"]
        # oid is e.g. "CC", "CM", "MC", "MM" or arbitrary.
        # Let's match by outcome_id matching actions
        # In build_bimatrix, outcomes has:
        # id = "CC" / "CM" / "MC" / "MM"
        # Let's determine which row/col strategy this represents
        # Row strategy is name[0] ('C' -> row_strats[0], 'M' -> row_strats[1])
        # Col strategy is name[1] ('C' -> col_strats[0], 'M' -> col_strats[1])
        # To be robust, let's parse the strategies.
        # Since it is a 2x2 game, we can map:
        if oid == "CC":
            util_map[(row_strats[0], col_strats[0])] = cell["utilities"]
        elif oid == "CM":
            util_map[(row_strats[0], col_strats[1])] = cell["utilities"]
        elif oid == "MC":
            util_map[(row_strats[1], col_strats[0])] = cell["utilities"]
        elif oid == "MM":
            util_map[(row_strats[1], col_strats[1])] = cell["utilities"]

    dominated_strategies = []
    eps = 1e-9

    # 1. Check Row Player (P1) dominance
    # For every pair of row strategies, check if one dominates the other
    for r1 in row_strats:
        for r2 in row_strats:
            if r1 == r2:
                continue
            # Check if r1 is dominated by r2
            is_strict = True
            is_weak = True
            has_strict_diff = False
            
            for c in col_strats:
                u1 = util_map.get((r1, c))
                u2 = util_map.get((r2, c))
                if u1 is None or u2 is None:
                    is_strict = is_weak = False
                    break
                
                # Check strict dominance: r2 utility > r1 utility
                if u2[0] <= u1[0] + eps:
                    is_strict = False
                
                # Check weak dominance: r2 utility >= r1 utility
                if u2[0] < u1[0] - eps:
                    is_weak = False
                elif u2[0] > u1[0] + eps:
                    has_strict_diff = True
            
            if is_strict:
                dominated_strategies.append({
                    "player_id": row_player,
                    "strategy": r1,
                    "dominated_by": r2,
                    "kind": "STRICT"
                })
            elif is_weak and has_strict_diff:
                dominated_strategies.append({
                    "player_id": row_player,
                    "strategy": r1,
                    "dominated_by": r2,
                    "kind": "WEAK"
                })

    # 2. Check Column Player (P2) dominance
    # For every pair of column strategies, check if one dominates the other
    for c1 in col_strats:
        for c2 in col_strats:
            if c1 == c2:
                continue
            # Check if c1 is dominated by c2
            is_strict = True
            is_weak = True
            has_strict_diff = False
            
            for r in row_strats:
                u1 = util_map.get((r, c1))
                u2 = util_map.get((r, c2))
                if u1 is None or u2 is None:
                    is_strict = is_weak = False
                    break
                
                # Column player utilities are at index 1
                if u2[1] <= u1[1] + eps:
                    is_strict = False
                
                if u2[1] < u1[1] - eps:
                    is_weak = False
                elif u2[1] > u1[1] + eps:
                    has_strict_diff = True
            
            if is_strict:
                dominated_strategies.append({
                    "player_id": col_player,
                    "strategy": c1,
                    "dominated_by": c2,
                    "kind": "STRICT"
                })
            elif is_weak and has_strict_diff:
                dominated_strategies.append({
                    "player_id": col_player,
                    "strategy": c1,
                    "dominated_by": c2,
                    "kind": "WEAK"
                })

    return dominated_strategies
