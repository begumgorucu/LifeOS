/**
 * Axios instance — backend ile her HTTP konuşma buradan geçer.
 *
 * Base URL "/api/v1": Vite dev server'ı bunu otomatik olarak backend
 * container'ına (http://backend:8000) yönlendiriyor (vite.config.ts'deki
 * proxy ayarı). Bu sayede tarayıcı same-origin sanır, CORS derdi yok.
 */
import axios, { AxiosError } from "axios";
import type { ApiErrorEnvelope } from "@/types/api";

export const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

/**
 * Backend bizim standart `{error:{code,message}}` formatında 4xx/5xx döner.
 * Bu helper hata objesinden okunabilir bir mesaj çıkarır — UI toast'larda
 * doğrudan göstermek için pratik.
 */
export function readApiError(err: unknown): { code: string; message: string } {
  if (axios.isAxiosError(err)) {
    const axErr = err as AxiosError<ApiErrorEnvelope>;
    const env = axErr.response?.data?.error;
    if (env) return { code: env.code, message: env.message };
    return { code: "NETWORK_ERROR", message: axErr.message };
  }
  return { code: "UNKNOWN", message: String(err) };
}
