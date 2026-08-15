from typing import Dict, List, Any

def best_responses(payoff_matrix: Dict[str, Any]) -> Dict[str, Any]:
    row_player = payoff_matrix["row_player"]
    col_player = payoff_matrix["column_player"]
    row_strats = payoff_matrix["row_strategies"]
    col_strats = payoff_matrix["column_strategies"]
    cells = payoff_matrix["cells"]

    # Build utility map
    util_map = {}
    for cell in cells:
        oid = cell["outcome_id"]
        if oid == "CC":
            util_map[(row_strats[0], col_strats[0])] = cell["utilities"]
        elif oid == "CM":
            util_map[(row_strats[0], col_strats[1])] = cell["utilities"]
        elif oid == "MC":
            util_map[(row_strats[1], col_strats[0])] = cell["utilities"]
        elif oid == "MM":
            util_map[(row_strats[1], col_strats[1])] = cell["utilities"]

    eps = 1e-9
    p1_br = {}
    p2_br = {}

    # P1 (Row Player) best responses: for each column strategy, find best row strategy
    for col_s in col_strats:
        max_u = -float('inf')
        best_r = []
        for row_s in row_strats:
            u = util_map.get((row_s, col_s))
            if u is None:
                continue
            p1_u = u[0]
            if p1_u > max_u + eps:
                max_u = p1_u
                best_r = [row_s]
            elif abs(p1_u - max_u) <= eps:
                best_r.append(row_s)
        p1_br[col_s] = best_r

    # P2 (Column Player) best responses: for each row strategy, find best column strategy
    for row_s in row_strats:
        max_u = -float('inf')
        best_c = []
        for col_s in col_strats:
            u = util_map.get((row_s, col_s))
            if u is None:
                continue
            p2_u = u[1]
            if p2_u > max_u + eps:
                max_u = p2_u
                best_c = [col_s]
            elif abs(p2_u - max_u) <= eps:
                best_c.append(col_s)
        p2_br[row_s] = best_c

    return {
        row_player: p1_br,
        col_player: p2_br
    }

def pure_nash(payoff_matrix: Dict[str, Any]) -> List[str]:
    br = best_responses(payoff_matrix)
    row_player = payoff_matrix["row_player"]
    col_player = payoff_matrix["column_player"]
    row_strats = payoff_matrix["row_strategies"]
    col_strats = payoff_matrix["column_strategies"]

    p1_br = br[row_player]
    p2_br = br[col_player]

    nash = []
    # An outcome is Nash if the row_strat is in P1's best responses to col_strat
    # AND the col_strat is in P2's best responses to row_strat
    for cell in payoff_matrix["cells"]:
        oid = cell["outcome_id"]
        # Map oid to strategies
        if oid == "CC":
            r_s, c_s = row_strats[0], col_strats[0]
        elif oid == "CM":
            r_s, c_s = row_strats[0], col_strats[1]
        elif oid == "MC":
            r_s, c_s = row_strats[1], col_strats[0]
        elif oid == "MM":
            r_s, c_s = row_strats[1], col_strats[1]
        else:
            continue

        if r_s in p1_br.get(c_s, []) and c_s in p2_br.get(r_s, []):
            nash.append(oid)

    return nash

def detect_prisoners_dilemma(payoff_matrix: Dict[str, Any]) -> Dict[str, Any]:
    row_strats = payoff_matrix["row_strategies"]
    col_strats = payoff_matrix["column_strategies"]
    cells = payoff_matrix["cells"]

    # We need the 4 standard outcomes
    util_map = {}
    for cell in cells:
        util_map[cell["outcome_id"]] = cell["utilities"]

    cc = util_map.get("CC")
    cm = util_map.get("CM")
    mc = util_map.get("MC")
    mm = util_map.get("MM")

    if not (cc and cm and mc and mm):
        return {
            "detected": False,
            "type": None,
            "failed_conditions": ["Matrix does not contain all standard outcomes CC, CM, MC, MM"]
        }

    # Asymmetric Prisoner's Dilemma check:
    # T_i > R_i > P_i > S_i
    # For Player 1 (Row):
    # Temptation: MC (P1 def, P2 coop) -> mc[0]
    # Reward: CC (both coop) -> cc[0]
    # Punishment: MM (both def) -> mm[0]
    # Sucker: CM (P1 coop, P2 def) -> cm[0]
    #
    # For Player 2 (Col):
    # Temptation: CM (P1 coop, P2 def) -> cm[1]
    # Reward: CC (both coop) -> cc[1]
    # Punishment: MM (both def) -> mm[1]
    # Sucker: MC (P1 def, P2 coop) -> mc[1]

    T1, R1, P1_val, S1 = mc[0], cc[0], mm[0], cm[0]
    T2, R2, P2_val, S2 = cm[1], cc[1], mm[1], mc[1]

    failed = []
    eps = 1e-9

    # Player 1 inequalities
    if not (T1 > R1 + eps):
        failed.append(f"P1 Temptation MC ({T1:.2f}) is not greater than Reward CC ({R1:.2f})")
    if not (R1 > P1_val + eps):
        failed.append(f"P1 Reward CC ({R1:.2f}) is not greater than Punishment MM ({P1_val:.2f})")
    if not (P1_val > S1 + eps):
        failed.append(f"P1 Punishment MM ({P1_val:.2f}) is not greater than Sucker CM ({S1:.2f})")

    # Player 2 inequalities
    if not (T2 > R2 + eps):
        failed.append(f"P2 Temptation CM ({T2:.2f}) is not greater than Reward CC ({R2:.2f})")
    if not (R2 > P2_val + eps):
        failed.append(f"P2 Reward CC ({R2:.2f}) is not greater than Punishment MM ({P2_val:.2f})")
    if not (P2_val > S2 + eps):
        failed.append(f"P2 Punishment MM ({P2_val:.2f}) is not greater than Sucker MC ({S2:.2f})")

    # Loop checking: does CC Pareto dominate MM?
    # R1 > P1 and R2 > P2, which is already checked above, but let's make sure.
    if not (cc[0] > mm[0] + eps and cc[1] > mm[1] + eps):
        failed.append("CC does not strictly Pareto-dominate MM")

    detected = len(failed) == 0

    return {
        "detected": detected,
        "type": "ASYMMETRIC" if detected else None,
        "failed_conditions": failed
    }
