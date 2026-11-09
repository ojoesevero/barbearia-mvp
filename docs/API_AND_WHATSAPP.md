# 🔌 API Python (FastAPI) & Integração WhatsApp

O backend em Python está localizado em `api/` e roda como **Vercel Serverless Function** sob o prefixo `/api/py/*`.

---

## 1. Endpoints Disponíveis

### `GET /api/py/health`
Verifica a saúde do runtime Python e se as credenciais do Supabase e do provedor de WhatsApp estão ativas.

### `GET /api/py/availability`
Retorna os horários livres e ocupados de um barbeiro para uma data específica.
- **Query Params:**
  - `barber_id` (UUID do barbeiro)
  - `target_date` (`YYYY-MM-DD`)

### `POST /api/py/clients`
Realiza o cadastro básico do cliente (ou atualiza pelo número de telefone) e garante a criação do seu cartão de fidelidade.

### `POST /api/py/appointments`
Cria um novo agendamento e dispara automaticamente a mensagem de confirmação para o WhatsApp do cliente.

### `POST /api/py/notifications/whatsapp`
Dispara notificações ativas via **Evolution API** ou **Z-API**. Suporta os seguintes templates (`template_type`):
- `confirmation`: Confirmação imediata de horário agendado.
- `reminder_24h`: Lembrete enviado 24h antes do atendimento.
- `cancellation`: Aviso de cancelamento ou reagendamento.
- `loyalty_reward`: Voucher de recompensa do plano de fidelidade.
- `chat_reply`: Espelhamento de mensagem enviada pelo barbeiro no chat web.

### `POST /api/py/loyalty/redeem`
Valida o saldo de pontos do cliente, deduz o custo da recompensa escolhida e retorna o voucher.

---

## 2. Configuração do Provedor WhatsApp (Evolution API / Z-API)

No arquivo `.env.local` (ou nas variáveis de ambiente da Vercel), configure:

```env
WHATSAPP_PROVIDER=evolution
WHATSAPP_API_URL=https://sua-instancia.evolution-api.com
WHATSAPP_API_KEY=sua-api-key
WHATSAPP_INSTANCE_NAME=barbearia-mvp
```

> **Modo Sandbox Automático:** Caso `WHATSAPP_API_URL` não esteja definida durante o desenvolvimento, o serviço `api/services/whatsapp_service.py` opera automaticamente em modo `simulated`, retornando o texto formatado exato que seria entregue ao cliente para visualização na interface web.
