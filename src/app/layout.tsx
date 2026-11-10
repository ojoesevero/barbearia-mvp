import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Navalha de Ouro | Sistema Web para Barbearia",
  description:
    "Agendamento online, Catálogo de Serviços, Notificações WhatsApp, Chat em Tempo Real e Plano de Fidelidade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}

