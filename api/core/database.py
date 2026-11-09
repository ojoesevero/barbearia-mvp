"""Cliente de conexão com o Supabase e dados de fallback para modo demonstração."""

from typing import Any, Optional
from api.core.config import settings

_supabase_client: Optional[Any] = None


def get_supabase_client() -> Optional[Any]:
    """Retorna instância singleton do cliente Supabase se configurado."""
    global _supabase_client
    if not settings.is_supabase_configured:
        return None
    if _supabase_client is None:
        try:
            from supabase import create_client

            _supabase_client = create_client(
                settings.supabase_url, settings.supabase_key
            )
        except Exception:
            return None
    return _supabase_client
