"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0d1424",
            border: "1px solid #1e2d45",
            color: "#e2e8f0",
            fontFamily: "var(--font-geist-mono)",
            fontSize: "13px",
          },
          error: { iconTheme: { primary: "#ef4444", secondary: "#0d1424" } },
          success: { iconTheme: { primary: "#22c55e", secondary: "#0d1424" } },
        }}
      />
    </QueryClientProvider>
  );
}
