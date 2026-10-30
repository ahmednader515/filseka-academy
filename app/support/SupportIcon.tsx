export type SupportIconName = "headset" | "chat" | "whatsapp" | "telegram" | "book" | "ticket" | "shield" | "attach" | "user" | "play";

export function SupportIcon({ name }: { name: SupportIconName }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "headset" && <><path d="M5 18v-4a11 11 0 0 1 22 0v4M27 25v2a3 3 0 0 1-3 3h-6" /><rect x="2" y="14" width="7" height="13" rx="3" /><rect x="23" y="14" width="7" height="13" rx="3" /><path d="M5 12a11 11 0 0 1 22 0" /></>}
    {name === "chat" && <><path d="M4 4h20a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H13l-7 6v-6H4a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" /><path d="M8 12h.1m6.9 0h.1m6.9 0h.1" strokeWidth="3" /></>}
    {name === "whatsapp" && <><path d="M6 26 2 30l2-9a14 14 0 1 1 7 7Z" /><path d="m12 8-3 2c-1 5 8 14 13 12l2-3-5-3-2 2-4-4 2-2Z" /></>}
    {name === "telegram" && <><path d="m2 14 28-11-6 27-9-9-5 5 1-9Z" /><path d="m11 17 13-9-9 13" /></>}
    {name === "book" && <><path d="M16 7v23M16 7C12 3 7 3 2 5v22c5-2 10-2 14 3 4-5 9-5 14-3V5c-5-2-10-2-14 2Z" /><path d="M6 11h5m-5 5h5m10-5h5m-5 5h5" /></>}
    {name === "ticket" && <><path d="M3 7h26v6a3 3 0 0 0 0 6v6H3v-6a3 3 0 0 0 0-6Zm18 0v3m0 4v4m0 4v3" /></>}
    {name === "shield" && <><path d="M16 2c5 4 9 5 13 5 0 14-5 20-13 24C8 27 3 21 3 7c4 0 8-1 13-5Z" /><path d="m9 16 5 5 9-10" /></>}
    {name === "attach" && <path d="m11 18 10-10a4 4 0 0 1 6 6L13 28A7 7 0 0 1 3 18L19 2m-8 16a2 2 0 0 0 3 3l9-9" />}
    {name === "user" && <><circle cx="16" cy="9" r="6" /><path d="M4 30v-4a12 12 0 0 1 24 0v4" /></>}
    {name === "play" && <><rect x="2" y="5" width="28" height="23" rx="4" /><path d="m13 11 8 6-8 6Z" /></>}
  </svg>;
}
