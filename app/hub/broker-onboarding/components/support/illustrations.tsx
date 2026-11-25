// Ilustraciones estáticas del módulo de Soporte — SVG a mano, sin librería
// de ilustración/animación nueva (se animan con framer-motion, ya instalado).
// Mismos tokens de color que el resto del Hub: azules oscuros de fondo
// (#05101F/#0A182D) + acento cian (#22D3EE/#38BDF8) y gris para contornos.

export function ChatWelcomeIllustration({ size = 128 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chatBubbleGrad" x1="20" y1="20" x2="108" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" stopOpacity="0.25" />
          <stop offset="1" stopColor="#2563EB" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="chatBotGrad" x1="40" y1="40" x2="88" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* Burbuja de fondo */}
      <rect x="14" y="20" width="100" height="72" rx="24" fill="url(#chatBubbleGrad)" stroke="#0E7490" strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M38 92 L30 110 L52 92 Z" fill="url(#chatBubbleGrad)" stroke="#0E7490" strokeOpacity="0.4" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Cabeza del asistente (robot amigable) */}
      <rect x="40" y="38" width="48" height="36" rx="14" fill="#05101F" stroke="url(#chatBotGrad)" strokeWidth="2.5" />
      <circle cx="56" cy="56" r="5" fill="#22D3EE" />
      <circle cx="72" cy="56" r="5" fill="#22D3EE" />
      <path d="M58 65 Q64 69 70 65" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M64 38 V30" stroke="url(#chatBotGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="64" cy="27" r="4" fill="#22D3EE" />

      {/* Chispas decorativas */}
      <path d="M100 30 L102 36 L108 38 L102 40 L100 46 L98 40 L92 38 L98 36 Z" fill="#38BDF8" opacity="0.8" />
      <path d="M18 72 L19.5 76 L23.5 77.5 L19.5 79 L18 83 L16.5 79 L12.5 77.5 L16.5 76 Z" fill="#22D3EE" opacity="0.6" />
    </svg>
  );
}

export function TicketCreatedIllustration({ size = 128 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ticketGrad" x1="20" y1="30" x2="108" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" stopOpacity="0.18" />
          <stop offset="1" stopColor="#22D3EE" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="ticketCheckGrad" x1="48" y1="48" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>

      {/* Ticket */}
      <rect x="16" y="32" width="96" height="60" rx="12" fill="url(#ticketGrad)" stroke="#0E7490" strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="16" cy="62" r="6" fill="#030812" />
      <circle cx="112" cy="62" r="6" fill="#030812" />
      <path d="M58 32 V92" stroke="#0E7490" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 4" />

      {/* Ícono de check */}
      <circle cx="80" cy="62" r="18" fill="#05101F" stroke="url(#ticketCheckGrad)" strokeWidth="2.5" />
      <path d="M72 62 L78 68 L89 55" stroke="url(#ticketCheckGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Líneas de texto del ticket */}
      <rect x="28" y="50" width="20" height="4" rx="2" fill="#22D3EE" opacity="0.7" />
      <rect x="28" y="60" width="16" height="4" rx="2" fill="#38BDF8" opacity="0.5" />
      <rect x="28" y="70" width="20" height="4" rx="2" fill="#38BDF8" opacity="0.5" />

      {/* Chispas */}
      <path d="M100 24 L101.5 28 L105.5 29.5 L101.5 31 L100 35 L98.5 31 L94.5 29.5 L98.5 28 Z" fill="#34D399" opacity="0.8" />
    </svg>
  );
}
