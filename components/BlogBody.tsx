import { Fragment, type ReactNode } from "react";

function safeHref(value: string) {
  if (value.startsWith("/") && !value.startsWith("//") && !/[\\\s]/.test(value)) return value;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
function inline(value: string): ReactNode[] {
  return value.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    const href = link ? safeHref(link[2]) : null;
    return link && href ? <a key={index} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>{link[1]}</a> : <Fragment key={index}>{part}</Fragment>;
  });
}
/** A deliberately small Markdown subset; raw HTML is always rendered as text. */
export function BlogBody({ body, className }: { body: string; className?: string }) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) { index++; continue; }
    const key = index;
    if (line.startsWith("### ")) { blocks.push(<h3 key={key}>{inline(line.slice(4))}</h3>); index++; continue; }
    if (line.startsWith("## ")) { blocks.push(<h2 key={key}>{inline(line.slice(3))}</h2>); index++; continue; }
    const bullet = /^[-*] /;
    const numbered = /^\d+\. /;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const pattern = ordered ? numbered : bullet;
      const items: ReactNode[] = [];
      while (index < lines.length && pattern.test(lines[index].trim())) { items.push(<li key={index}>{inline(lines[index].trim().replace(pattern, ""))}</li>); index++; }
      blocks.push(ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>);
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !/^(?:#{2,3} |[-*] |\d+\. )/.test(lines[index].trim())) { paragraph.push(lines[index]); index++; }
    blocks.push(<p key={key}>{inline(paragraph.join("\n"))}</p>);
  }
  return <div className={className}>{blocks}</div>;
}
