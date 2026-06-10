/**
 * Uygulamanın React giriş noktası.
 *
 * QueryClient: tüm useQuery / useMutation çağrılarının paylaştığı cache.
 * staleTime 30s — backend sık değişen veri vermediği sürece tarayıcıyı
 * sıklıkla tazelemeye zorlamayalım. Manuel refetch ya da invalidate
 * gerekirse hook'lar zaten tetikliyor.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ToastProvider } from "./components/Toast";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
