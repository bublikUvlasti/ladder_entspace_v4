'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { SocketProvider } from '@/lib/socket-context';

// Обертка для SocketProvider, чтобы передать userId из сессии
function SocketWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  
  return (
    <SocketProvider userId={session?.user?.id}>
      {children}
    </SocketProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SocketWrapper>
        {children}
      </SocketWrapper>
    </SessionProvider>
  );
} 