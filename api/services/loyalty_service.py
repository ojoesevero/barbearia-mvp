"""Serviço de regras de negócio do Programa de Fidelidade."""

from typing import Dict


def calculate_loyalty_tier(total_points_earned: int) -> str:
    """Determina o nível de fidelidade do cliente com base no histórico de pontos."""
    if total_points_earned >= 500:
        return "VIP"
    if total_points_earned >= 250:
        return "Ouro"
    if total_points_earned >= 100:
        return "Prata"
    return "Bronze"


def evaluate_reward_redemption(
    current_balance: int, points_cost: int, current_stamps: int
) -> Dict[str, object]:
    """Valida e calcula o novo saldo após resgate de recompensa de fidelidade."""
    if current_balance < points_cost:
        return {
            "eligible": False,
            "missing_points": points_cost - current_balance,
            "new_balance": current_balance,
            "message": f"Faltam {points_cost - current_balance} pontos para resgatar esta recompensa.",
        }

    new_balance = current_balance - points_cost
    return {
        "eligible": True,
        "missing_points": 0,
        "new_balance": new_balance,
        "stamps_count": current_stamps,
        "message": "Recompensa resgatada com sucesso! Apresente o voucher ao seu barbeiro.",
    }
