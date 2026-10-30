export function BalanceIcon({ name }: { name: "wallet" | "transfer" | "receipt" | "check" | "copy" | "card" | "clock" | "arrow" }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "wallet" && <><path d="M28 9H7a3 3 0 0 1 0-6h18v6M4 6v20a3 3 0 0 0 3 3h21V9" /><path d="M28 15h-9v8h9m-5-4h.01" /></>}
    {name === "transfer" && <><path d="M3 10h25m-6-6 6 6-6 6M29 23H4m6-6-6 6 6 6" /></>}
    {name === "receipt" && <><path d="M6 2h20v28l-5-3-5 3-5-3-5 3Z" /><path d="M11 8h10m-10 5h10m-10 6h5" /></>}
    {name === "check" && <><circle cx="16" cy="16" r="13" /><path d="m9 16 5 5 10-11" /></>}
    {name === "copy" && <><rect x="10" y="10" width="19" height="19" rx="3" /><path d="M22 6V3H3v19h3" /></>}
    {name === "card" && <><rect x="2" y="5" width="28" height="22" rx="4" /><path d="M2 12h28M7 21h5m8 0h5" /></>}
    {name === "clock" && <><circle cx="16" cy="16" r="13" /><path d="M16 7v10l6 4" /></>}
    {name === "arrow" && <path d="m21 5-11 11 11 11" />}
  </svg>;
}
