import {
  Barber,
  BarberAppointmentItem,
  BarbershopService,
  ChatMessage,
  LoyaltyReward,
  LoyaltyTransaction,
} from "@/types/barbershop";

export function getNextWorkingDateISO(): string {
  const d = new Date();
  // Se for domingo (0), avança para segunda-feira
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const INITIAL_SERVICES: BarbershopService[] = [
  {
    id: "d1111111-1111-1111-1111-111111111111",
    name: "Corte Degradê / Clássico",
    category: "Cabelo",
    description:
      "Corte personalizado com lavagem, finalização com pomada matte e acabamento na navalha.",
    price: 55.0,
    duration_minutes: 40,
    loyalty_points: 20,
  },
  {
    id: "d2222222-2222-2222-2222-222222222222",
    name: "Barba Terapia (Toalha Quente)",
    category: "Barba",
    description:
      "Modelagem completa de barba com vapor de ozônio, toalha quente e óleo essencial.",
    price: 45.0,
    duration_minutes: 30,
    loyalty_points: 15,
  },
  {
    id: "d3333333-3333-3333-3333-333333333333",
    name: "Combo VIP (Cabelo + Barba + Sobrancelha)",
    category: "Combo",
    description:
      "Pacote completo de renovação visual com massagem facial e bebida cortesia.",
    price: 95.0,
    duration_minutes: 60,
    loyalty_points: 40,
  },
  {
    id: "d4444444-4444-4444-4444-444444444444",
    name: "Acabamento (Pezinho & Sobrancelha)",
    category: "Estética",
    description:
      "Manutenção rápida do contorno do corte e alinhamento de sobrancelha na navalha.",
    price: 25.0,
    duration_minutes: 15,
    loyalty_points: 10,
  },
  {
    id: "d5555555-5555-5555-5555-555555555555",
    name: "Selagem / Hidratação Profunda",
    category: "Estética",
    description:
      "Tratamento capilar reconstrutor para redução de volume e brilho intenso.",
    price: 70.0,
    duration_minutes: 45,
    loyalty_points: 25,
  },
  {
    id: "d6666666-6666-6666-6666-666666666666",
    name: "Corte Infantil (Até 10 anos)",
    category: "Cabelo",
    description: "Corte cuidadoso para crianças com atendimento especializado.",
    price: 45.0,
    duration_minutes: 30,
    loyalty_points: 15,
  },
];

export const INITIAL_BARBERS: Barber[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: 'Rafael "Navalha" Mendes',
    specialty: "Degradê Navalhado & Barba Terapia",
    bio: "Mestre barbeiro com 10 anos de experiência em cortes clássicos e modernos.",
    rating: 4.95,
    avatar_initials: "RM",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    name: "Lucas Oliveira",
    specialty: "Corte Social, Tesoura & Visagismo",
    bio: "Especialista em visagismo masculino e acabamento fino na tesoura.",
    rating: 4.9,
    avatar_initials: "LO",
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    name: "Matheus Costa",
    specialty: "Freestyle, Pigmentação & Platinado",
    bio: "Referência em cortes urbanos, platinado e alinhamento de barba.",
    rating: 4.88,
    avatar_initials: "MC",
  },
];

export function getInitialDailyAppointments(dateStr: string): BarberAppointmentItem[] {
  return [
    {
      id: "apt-1",
      date: dateStr,
      time: "09:00",
      client_name: "Marcos Vinícius",
      client_phone: "+5511991112222",
      service_name: "Corte Degradê / Clássico",
      price: 55.0,
      duration_minutes: 40,
      loyalty_points: 20,
      barber_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      status: "completed",
      origin: "whatsapp_link",
    },
    {
      id: "apt-2",
      date: dateStr,
      time: "10:00",
      client_name: "Henrique Souza",
      client_phone: "+5511992223333",
      service_name: "Combo VIP (Cabelo + Barba + Sobrancelha)",
      price: 95.0,
      duration_minutes: 60,
      loyalty_points: 40,
      barber_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      status: "confirmed",
      origin: "whatsapp_link",
    },
    {
      id: "apt-3",
      date: dateStr,
      time: "11:00",
      client_name: "Felipe Azevedo",
      client_phone: "+5511993334444",
      service_name: "Barba Terapia (Toalha Quente)",
      price: 45.0,
      duration_minutes: 30,
      loyalty_points: 15,
      barber_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      status: "confirmed",
      origin: "whatsapp_link",
    },
    {
      id: "apt-4",
      date: dateStr,
      time: "14:30",
      client_name: "Gabriel Martins",
      client_phone: "+5511994445555",
      service_name: "Corte Degradê / Clássico",
      price: 55.0,
      duration_minutes: 40,
      loyalty_points: 20,
      barber_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      status: "confirmed",
      origin: "whatsapp_link",
    },
    {
      id: "apt-5",
      date: dateStr,
      time: "16:00",
      client_name: "Rodrigo Almeida",
      client_phone: "+5511995556666",
      service_name: "Combo VIP (Cabelo + Barba + Sobrancelha)",
      price: 95.0,
      duration_minutes: 60,
      loyalty_points: 40,
      barber_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      status: "confirmed",
      origin: "walk_in",
    },
    {
      id: "apt-6",
      date: dateStr,
      time: "18:30",
      client_name: "Bruno Carvalho",
      client_phone: "+5511996667777",
      service_name: "Selagem / Hidratação Profunda",
      price: 70.0,
      duration_minutes: 45,
      loyalty_points: 25,
      barber_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      status: "confirmed",
      origin: "whatsapp_link",
    },
  ];
}

export const INITIAL_REWARDS: LoyaltyReward[] = [
  {
    id: "e1111111-1111-1111-1111-111111111111",
    title: "Sobrancelha + Pezinho Grátis",
    description: "Resgate um acabamento completo por conta da casa.",
    points_cost: 50,
  },
  {
    id: "e2222222-2222-2222-2222-222222222222",
    title: "Barba Terapia Cortesia",
    description: "Uma sessão completa de Barba Terapia com toalha quente.",
    points_cost: 100,
  },
  {
    id: "e3333333-3333-3333-3333-333333333333",
    title: "Corte Clássico / Degradê 100% OFF",
    description: "Seu próximo corte sai totalmente grátis ao atingir 150 pontos.",
    points_cost: 150,
  },
  {
    id: "e4444444-4444-4444-4444-444444444444",
    title: "Combo VIP Experiência Completa",
    description: "Cabelo + Barba + Sobrancelha + Cerveja Artesanal.",
    points_cost: 240,
  },
];

export const INITIAL_LOYALTY_HISTORY: LoyaltyTransaction[] = [
  {
    id: "tx-1",
    type: "earn",
    points: 40,
    description: "Combo VIP (Cabelo + Barba + Sobrancelha)",
    date: "02/11/2026",
  },
  {
    id: "tx-2",
    type: "earn",
    points: 20,
    description: "Corte Degradê / Clássico",
    date: "18/10/2026",
  },
  {
    id: "tx-3",
    type: "redeem",
    points: -50,
    description: "Resgate: Sobrancelha + Pezinho Grátis",
    date: "05/10/2026",
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    sender_role: "barber",
    sender_name: 'Rafael "Navalha" Mendes',
    content:
      "Fala Carlos! Tudo certo? Vi que você está quase completando 10 selos no cartão fidelidade.",
    timestamp: "10:15",
    sent_via_whatsapp: true,
  },
  {
    id: "msg-2",
    sender_role: "client",
    sender_name: "Carlos Eduardo",
    content:
      "Opa Rafael! Tudo ótimo. Quero agendar o Combo VIP para sexta-feira à tarde, tem horário?",
    timestamp: "10:17",
  },
  {
    id: "msg-3",
    sender_role: "barber",
    sender_name: 'Rafael "Navalha" Mendes',
    content:
      "Tenho livre às 14:00, 15:00 e 16:30! Pode escolher direto no calendário aqui ao lado que já te mando a confirmação no WhatsApp.",
    timestamp: "10:18",
    sent_via_whatsapp: true,
  },
];
