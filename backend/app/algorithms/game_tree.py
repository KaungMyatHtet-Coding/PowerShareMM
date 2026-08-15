from typing import Dict, Any, List, Tuple

def backward_induction(node: Dict[str, Any]) -> Dict[str, Any]:
    """
    Performs backward induction on a sequential game tree.
    Returns a dictionary containing:
      - payoffs: list of floats representing the expected utilities at this node.
      - path: list of str representing the optimal sequence of node IDs from this node.
      - decisions: list of choices, highlighting which choice is selected/optimal and which are pruned.
    """
    player_id = node.get("player_id")
    node_id = node.get("id", "")

    if player_id == "TERMINAL":
        payoffs = node.get("payoffs", [0.0, 0.0])
        return {
            "node_id": node_id,
            "player_id": player_id,
            "payoffs": payoffs,
            "path": [node_id],
            "choices": [],
            "selected_action": None
        }

    player_idx = 0 if player_id == "P1" else 1
    choices = node.get("choices", [])
    if not choices:
        raise ValueError(f"Non-terminal node {node_id} has no choices")

    evaluated_choices = []
    best_value = -float('inf')
    best_choice = None
    eps = 1e-9

    for choice in choices:
        action = choice["action"]
        child_node = choice["child"]

        # Recursively evaluate the child node
        child_result = backward_induction(child_node)
        payoffs = child_result["payoffs"]

        player_utility = payoffs[player_idx]

        evaluated_choices.append({
            "action": action,
            "child_id": child_node.get("id", ""),
            "payoffs": payoffs,
            "child_result": child_result
        })

        if player_utility > best_value + eps:
            best_value = player_utility
            best_choice = action

    # Mark choices as selected or pruned
    final_choices = []
    selected_child_result = None
    for ec in evaluated_choices:
        is_selected = (ec["action"] == best_choice)
        final_choices.append({
            "action": ec["action"],
            "child_id": ec["child_id"],
            "payoffs": ec["payoffs"],
            "status": "SELECTED" if is_selected else "PRUNED"
        })
        if is_selected:
            selected_child_result = ec["child_result"]

    return {
        "node_id": node_id,
        "player_id": player_id,
        "payoffs": selected_child_result["payoffs"],
        "path": [node_id] + selected_child_result["path"],
        "choices": final_choices,
        "selected_action": best_choice
    }
