/** Validate browser origins against server configuration and the request's Host. */
export function isAllowedRequestOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = new Set([new URL(request.url).origin]);
  for (const configured of [process.env.NEXTAUTH_URL, process.env.AUTH_URL]) {
    if (!configured?.trim()) continue;
    try {
      const url = new URL(configured.trim());
      if (url.protocol === "https:" || url.protocol === "http:") allowed.add(url.origin);
    } catch { /* Invalid configuration must not broaden the accepted origins. */ }
  }
  // TLS can terminate at the proxy while Next.js receives an internal HTTP URL.
  // Use Host rather than trusting an arbitrary X-Forwarded-Host value.
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  if (host && (protocol === "https" || protocol === "http")) {
    try {
      const url = new URL(`${protocol}://${host}`);
      if (url.host === host && !url.username && !url.password) allowed.add(url.origin);
    } catch { /* Reject malformed proxy headers. */ }
  }
  return allowed.has(origin);
}
