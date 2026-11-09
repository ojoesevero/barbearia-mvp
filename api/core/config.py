"""Configurações centralizadas da aplicação Python (FastAPI)."""

import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    """Variáveis de ambiente e parâmetros operacionais do sistema."""

    supabase_url: str = (
        os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
        .rstrip("/")
        .removesuffix("/rest/v1")
    )
    supabase_key: str = os.getenv(
        "SUPABASE_SERVICE_ROLE_KEY",
        os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""),
    )
    whatsapp_provider: str = os.getenv("WHATSAPP_PROVIDER", "evolution")
    whatsapp_api_url: str = os.getenv("WHATSAPP_API_URL", "")
    whatsapp_api_key: str = os.getenv("WHATSAPP_API_KEY", "")
    whatsapp_instance: str = os.getenv("WHATSAPP_INSTANCE_NAME", "barbearia-mvp")
    whatsapp_webhook_secret: str = os.getenv("WHATSAPP_WEBHOOK_SECRET", "")
    loyalty_points_per_real: int = int(os.getenv("LOYALTY_POINTS_PER_REAL", "1"))
    loyalty_reward_threshold: int = int(os.getenv("LOYALTY_REWARD_THRESHOLD", "100"))

    @property
    def is_supabase_configured(self) -> bool:
        return bool(
            self.supabase_url
            and self.supabase_key
            and "seu-projeto" not in self.supabase_url
        )

    @property
    def is_whatsapp_configured(self) -> bool:
        return bool(self.whatsapp_api_url and self.whatsapp_api_key)


settings = Settings()

