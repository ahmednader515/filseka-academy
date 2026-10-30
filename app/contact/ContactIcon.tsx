export type ContactIconName = "mail" | "phone" | "send" | "pin" | "clock" | "share" | "user" | "list";
export function ContactIcon({ name }: { name: ContactIconName }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "mail" && <><rect x="2" y="5" width="28" height="22" rx="3" /><path d="m3 7 13 11L29 7M3 25l9-9m17 9-9-9" /></>}
    {name === "phone" && <path d="m10 2-7 4c-2 10 13 25 23 23l4-7-8-6-4 4-7-7 4-4Z" />}
    {name === "send" && <><path d="M2 14 30 2 20 30l-6-12Zm12 4L30 2" /><path d="m14 18-1 10 7-6" /></>}
    {name === "pin" && <><path d="M27 13c0 9-11 18-11 18S5 22 5 13a11 11 0 0 1 22 0Z" /><circle cx="16" cy="13" r="4" /></>}
    {name === "clock" && <><circle cx="16" cy="16" r="13" /><path d="M16 7v10l6 4" /></>}
    {name === "share" && <><circle cx="24" cy="5" r="4" /><circle cx="7" cy="16" r="4" /><circle cx="24" cy="27" r="4" /><path d="m10 14 11-7m-11 11 11 7" /></>}
    {name === "user" && <><circle cx="16" cy="9" r="6" /><path d="M4 30v-3a12 12 0 0 1 24 0v3" /></>}
    {name === "list" && <><rect x="3" y="3" width="26" height="26" rx="3" /><path d="M12 10h12m-12 6h12m-12 6h12M7 10h.1M7 16h.1M7 22h.1" /></>}
  </svg>;
}
