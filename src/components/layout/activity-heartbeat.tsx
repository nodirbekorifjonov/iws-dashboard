'use client';

import { useEffect } from 'react';

export function ActivityHeartbeat() {
  useEffect(() => {
    const ping = () => {
      void fetch('/api/activity', { method: 'POST', keepalive: true }).catch(() => {});
    };
    ping();
    const id = window.setInterval(ping, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
