export function AboutIcon({ name }: { name: "eye" | "target" | "diamond" }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "eye" && <><path d="M1 16S7 6 16 6s15 10 15 10-6 10-15 10S1 16 1 16Z" /><circle cx="16" cy="16" r="6" /></>}
    {name === "target" && <><circle cx="15" cy="17" r="13" /><circle cx="15" cy="17" r="8" /><circle cx="15" cy="17" r="3" /><path d="m15 17 13-13m-5-2v7h7" /></>}
    {name === "diamond" && <><path d="M7 3h18l6 8-15 20L1 11Zm-6 8h30M7 3l5 8 4 20 4-20 5-8M12 11l4-8 4 8" /></>}
  </svg>;
}
