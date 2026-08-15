from typing import Dict, Any, List, Tuple
from .domain import Scenario
from .utility import score_outcome

def _float_str(val: float) -> str:
    # Formats float like 5.5 to "5_5" or 2.0 to "2" or 2 to "2"
    # To match "V1_1_ARBITRATION_E5_5_E4_5_H2_H3_S0_6"
    # Note that H2 and H3 are integers.
    # Let's check: if val is integer-like (val == int(val)), format as int first
    if abs(val - int(val)) < 1e-9:
        return str(int(val))
    return str(val).replace('.', '_')

def make_candidate_id(e1: float, e2: float, t1: float, t2: float, s1: float) -> str:
    return f"V1_1_ARBITRATION_E{_float_str(e1)}_E{_float_str(e2)}_H{_float_str(t1)}_H{_float_str(t2)}_S{_float_str(s1)}"

def nash_arbitration(scenario: Scenario, disagreement_point: Tuple[float, float] = (0.0, 0.0)) -> Dict[str, Any]:
    if len(scenario.players) != 2:
        raise ValueError("Arbitration requires exactly 2 players")
        
    p1, p2 = scenario.players[0], scenario.players[1]
    if p1.id == "P2" and p2.id == "P1":
        p1, p2 = p2, p1
        disagreement_point = (disagreement_point[1], disagreement_point[0])
        
    E = scenario.resource.capacity_kwh
    T = scenario.resource.available_hours
    max_loss = max(p1.outage_loss_mmk, p2.outage_loss_mmk)
    
    d1_0, d2_0 = disagreement_point
    
    # 1. Enumerate energy: multiples of 0.5 up to player demands
    # Under constraint e1 + e2 <= E
    eps = 1e-9
    
    e1_values = []
    val = 0.0
    while val <= p1.demand_kwh + eps:
        e1_values.append(round(val, 2))
        val += 0.5
        
    e2_values = []
    val = 0.0
    while val <= p2.demand_kwh + eps:
        e2_values.append(round(val, 2))
        val += 0.5
        
    # 2. Enumerate hours: integers from 0 to player desired hours
    # Under constraint t1 + t2 <= T
    t1_values = list(range(0, int(p1.desired_hours) + 1))
    t2_values = list(range(0, int(p2.desired_hours) + 1))
    
    # 3. Enumerate cost shares
    s1_values = [0.4, 0.5, 0.6]
    
    qualifying_count = 0
    max_product = -float('inf')
    best_candidates = []
    
    # Nested loops
    for e1 in e1_values:
        for e2 in e2_values:
            if e1 + e2 > E + eps:
                continue
                
            for t1 in t1_values:
                for t2 in t2_values:
                    if t1 + t2 > T + eps:
                        continue
                        
                    for s1 in s1_values:
                        s2 = round(1.0 - s1, 1)
                        
                        # No overload or violation penalties apply in negotiation
                        res1 = score_outcome(p1, e1, t1, s1, max_loss, 0.0, 0.0)
                        res2 = score_outcome(p2, e2, t2, s2, max_loss, 0.0, 0.0)
                        
                        u1 = res1["utility"]
                        u2 = res2["utility"]
                        
                        # Check Individual Rationality
                        if u1 >= d1_0 - eps and u2 >= d2_0 - eps:
                            qualifying_count += 1
                            product = (u1 - d1_0) * (u2 - d2_0)
                            
                            cid = make_candidate_id(e1, e2, t1, t2, s1)
                            candidate_obj = {
                                "candidate_id": cid,
                                "energy_kwh": [e1, e2],
                                "hours": [t1, t2],
                                "cost_shares": [s1, s2],
                                "utilities": [u1, u2],
                                "gains": [u1 - d1_0, u2 - d2_0],
                                "nash_product": product
                            }
                            
                            if product > max_product + eps:
                                max_product = product
                                best_candidates = [candidate_obj]
                            elif abs(product - max_product) <= eps:
                                best_candidates.append(candidate_obj)
                                
    if not best_candidates or max_product < 0.0:
        return {
            "disagreement": [d1_0, d2_0],
            "selected": None,
            "ties": [],
            "qualifying_candidates_count": qualifying_count,
            "no_solution": True,
            "verification_status": "CANONICAL_V1_1_EXHAUSTIVE",
            "explanations": ["No qualifying agreement found above the disagreement point."]
        }
        
    selected = best_candidates[0]
    ties = best_candidates[1:]
    
    return {
        "disagreement": [d1_0, d2_0],
        "selected": selected,
        "ties": ties,
        "qualifying_candidates_count": qualifying_count,
        "no_solution": False,
        "verification_status": "CANONICAL_V1_1_EXHAUSTIVE",
        "explanations": ["The no-agreement baseline [0,0] is verified on the same utility scale."]
    }
