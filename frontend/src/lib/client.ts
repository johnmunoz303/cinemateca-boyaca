export async function api(route: string, method = "GET", data?: unknown) {
  const response = await fetch("/api/v1/" + route, {
    method,
    cache: "no-store",
    headers:
      data instanceof FormData ? {} : { "Content-Type": "application/json" },
    body: data
      ? data instanceof FormData
        ? data
        : JSON.stringify(data)
      : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error ?? "No se pudo completar");
  return result;
}
export const date = (value: string) =>
  new Date(value).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
export const currency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
