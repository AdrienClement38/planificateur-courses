"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresher({ interval = 30000 }: { interval?: number }) {
  const router = useRouter();

  useEffect(() => {
    // Silent auto-refresh for robust background sync without WebSocket overhead
    const timer = setInterval(() => {
      router.refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [router, interval]);

  return null;
}
