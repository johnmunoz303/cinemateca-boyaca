// Only same-origin browser requests through the private frontend are accepted.
export function isLocalFrontendOrigin(origin, forwardedHost, configuredOrigin) {
  try {
    const url = new URL(origin);
    const configured = new URL(configuredOrigin);
    if (url.origin !== origin || url.username || url.password) return false;
    if (url.protocol !== 'http:' || url.port !== configured.port) return false;
    if (forwardedHost !== url.host) return false;
    const parts = url.hostname.split('.');
    if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return false;
    const [a,b] = parts.map(Number);
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  } catch { return false; }
}
