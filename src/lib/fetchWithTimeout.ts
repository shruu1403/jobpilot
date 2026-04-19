/**
 * Wraps the native `fetch` with an AbortController-based timeout.
 *
 * Usage (frontend components):
 *   const res = await fetchWithTimeout("/api/analyze", {
 *     method: "POST",
 *     body: JSON.stringify(payload),
 *     headers: { "Content-Type": "application/json" },
 *   }, 20_000);
 *
 * @param url       - fetch URL
 * @param options   - standard RequestInit
 * @param timeoutMs - max wait in ms (default 25000)
 * @returns Response
 * @throws Error with `isTimeout: true` property if aborted by timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 25_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      const timeoutErr = new Error("Request timed out. Server busy, please retry.");
      (timeoutErr as any).isTimeout = true;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
