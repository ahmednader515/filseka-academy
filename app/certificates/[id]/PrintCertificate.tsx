"use client";
export function PrintCertificate() {
  return <button onClick={() => window.print()} className="rounded-full border border-[#f23159] bg-gradient-to-b from-[#d0002d] to-[#720016] px-5 py-3 text-sm font-bold text-white">طباعة / حفظ PDF</button>;
}
