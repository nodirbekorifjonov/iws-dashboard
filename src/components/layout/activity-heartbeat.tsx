'use client';

import { pingActivity } from '@/lib/actions/activity';
import { useEffect } from 'react';

export function ActivityHeartbeat() {
  useEffect(() => {
    const ping = () => {
      void pingActivity();
    };
    ping();
    const id = window.setInterval(ping, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
