// Aviso audible para notificaciones del Hub (tickets nuevos para staff,
// respuestas nuevas para brokers) — ambos ya se generan en Firestore y
// NotificationBell.tsx ya los recoge por polling; esto solo les agrega
// sonido. Tono sintetizado con Web Audio API (sin archivo de audio externo,
// evita tener que conseguir/licenciar un asset).
//
// Los navegadores bloquean audio que no arranque desde un gesto real del
// usuario — initAudioUnlock() crea/retoma el AudioContext en el primer clic
// de la sesión (ocurre casi de inmediato al navegar el Hub), para que el
// chime disparado después por un timer de polling sí pueda sonar.

let audioContext: AudioContext | null = null;
let unlockListenerAttached = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }
  return audioContext;
}

export function initAudioUnlock(): void {
  if (typeof window === "undefined" || unlockListenerAttached) return;
  unlockListenerAttached = true;
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener("pointerdown", unlock, { once: true });
}

export function playNotificationChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== "running") return;

    const playTone = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const startAt = ctx.currentTime + startOffset;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.12, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration);
    };

    // Dos tonos cortos ascendentes (ej. "ding-dong" tipo notificación de app) —
    // nada agresivo, pensado para sonar en una oficina sin sobresaltar.
    playTone(740, 0, 0.18);
    playTone(988, 0.1, 0.22);
  } catch {
    // Silencioso: un fallo de audio (bloqueado, no soportado) nunca debe
    // interrumpir la experiencia del Hub.
  }
}
