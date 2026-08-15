from typing import List, Dict, Tuple, Any

def maximin_minimax(matrix: List[List[float]]) -> Dict[str, Any]:
    # Check that matrix is valid
    if not matrix or not matrix[0]:
        raise ValueError("Matrix cannot be empty")
    
    num_rows = len(matrix)
    num_cols = len(matrix[0])
    
    # Row minimums
    row_mins = [min(row) for row in matrix]
    # Maximin is the max of row mins
    maximin_value = max(row_mins)
    
    # Column maximums
    col_maxs = []
    for col_idx in range(num_cols):
        col_vals = [matrix[row_idx][col_idx] for row_idx in range(num_rows)]
        col_maxs.append(max(col_vals))
    # Minimax is the min of col maxs
    minimax_value = min(col_maxs)
    
    return {
        "row_minimums": row_mins,
        "column_maximums": col_maxs,
        "row_maximin": maximin_value,
        "column_minimax": minimax_value
    }

def find_saddles(matrix: List[List[float]]) -> List[Tuple[int, int]]:
    if not matrix or not matrix[0]:
        raise ValueError("Matrix cannot be empty")
        
    num_rows = len(matrix)
    num_cols = len(matrix[0])
    
    saddles = []
    eps = 1e-9
    
    for r in range(num_rows):
        row_min = min(matrix[r])
        for c in range(num_cols):
            # Check if matrix[r][c] is col max
            col_vals = [matrix[row_idx][c] for row_idx in range(num_rows)]
            col_max = max(col_vals)
            
            # Saddle point check: is equal to row min and col max
            if abs(matrix[r][c] - row_min) <= eps and abs(matrix[r][c] - col_max) <= eps:
                saddles.append((r, c))
                
    return saddles

def solve_mixed_2x2(matrix: List[List[float]]) -> Dict[str, Any]:
    # Ensure matrix is exactly 2x2
    if len(matrix) != 2 or len(matrix[0]) != 2:
        raise ValueError("Mixed strategy calculation is restricted to 2x2 matrices")
        
    # Check if saddle point exists. If so, mixed strategy calculation is rejected
    saddles = find_saddles(matrix)
    if len(saddles) > 0:
        raise ValueError("Saddle point exists. Pure strategy is optimal; mixed strategy is degenerate/not needed")
        
    a11 = matrix[0][0]
    a12 = matrix[0][1]
    a21 = matrix[1][0]
    a22 = matrix[1][1]
    
    denom = a11 - a21 - a12 + a22
    eps = 1e-9
    
    if abs(denom) <= eps:
        raise ValueError("Denominator is zero. No unique mixed strategy equilibrium exists")
        
    p = (a22 - a21) / denom
    q = (a22 - a12) / denom
    
    # Check bounds
    if not (-eps <= p <= 1.0 + eps) or not (-eps <= q <= 1.0 + eps):
        raise ValueError(f"Calculated probabilities are out of bounds: p={p}, q={q}")
        
    p = max(0.0, min(p, 1.0))
    q = max(0.0, min(q, 1.0))
    
    # Expected value of game
    v = p * a11 + (1.0 - p) * a21
    
    return {
        "row_probabilities": [p, 1.0 - p],
        "column_probabilities": [q, 1.0 - q],
        "game_value": v
    }
