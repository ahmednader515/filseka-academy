export type AcademyIconName = "mic" | "camera" | "video" | "broadcast" | "star" | "trophy" | "layers" | "users" | "graduate" | "book" | "mentor" | "clock";

export function AcademyIcon({ name, className }: { name: AcademyIconName; className?: string }) {
  return <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "mic" && <><rect x="11" y="3" width="10" height="18" rx="5" /><path d="M7 14v3a9 9 0 0 0 18 0v-3M16 26v4m-6 0h12m-11-21h4m-4 4h4m-4 4h4" /></>}
    {name === "camera" && <><path d="M4 9h6l2-4h8l2 4h6v19H4Z" /><circle cx="16" cy="18" r="6" /><path d="M25 12h.01" /></>}
    {name === "video" && <><rect x="3" y="7" width="20" height="18" rx="3" /><path d="m23 13 7-4v14l-7-4ZM11 12l6 4-6 4Z" /></>}
    {name === "broadcast" && <><circle cx="16" cy="12" r="3" /><path d="M16 15v15M10 5a10 10 0 0 0 0 14M22 5a10 10 0 0 1 0 14M6 1a16 16 0 0 0 0 22M26 1a16 16 0 0 1 0 22" /></>}
    {name === "star" && <path d="m16 2 4.4 9 9.9 1.5-7.2 7 1.7 9.9-8.8-4.7-8.8 4.7 1.7-9.9-7.2-7 9.9-1.5Z" />}
    {name === "trophy" && <><path d="M9 3h14v8a7 7 0 0 1-14 0Zm0 3H3v5a7 7 0 0 0 7 7m13-12h6v5a7 7 0 0 1-7 7m-6 0v9m-5 3h10m-8-3h6" /><path d="m16 6 1.3 2.5 2.7.4-2 2 .5 2.7-2.5-1.3-2.5 1.3.5-2.7-2-2 2.7-.4Z" /></>}
    {name === "layers" && <><path d="m16 2 14 8-14 8L2 10Zm-14 15 14 8 14-8M2 24l14 7 14-7" /></>}
    {name === "users" && <><circle cx="13" cy="9" r="5" /><path d="M3 29v-5a10 10 0 0 1 20 0v5M24 5a5 5 0 0 1 0 10m2 4a8 8 0 0 1 4 7v3" /></>}
    {name === "graduate" && <><path d="m16 3 15 8-15 8-15-8Zm-9 12v10q9 7 18 0V15M30 12v12" /></>}
    {name === "book" && <><path d="M16 7v23M16 7C12 3 7 3 2 5v22c5-2 10-2 14 3 4-5 9-5 14-3V5c-5-2-10-2-14 2Z" /><path d="M6 10h5m-5 5h5m10-5h5m-5 5h5" /></>}
    {name === "mentor" && <><rect x="12" y="3" width="18" height="17" rx="2" /><path d="m19 10 3 3 5-6M21 20v5m-4 4h10" /><circle cx="7" cy="14" r="4" /><path d="M1 30v-5a6 6 0 0 1 12 0v5" /></>}
    {name === "clock" && <><circle cx="16" cy="16" r="13" /><path d="M16 8v8l6 4M16 3v2m13 11h-2M16 29v-2M3 16h2" /></>}
  </svg>;
}
