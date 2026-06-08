import type { ReactNode } from 'react';

import { Sidebar } from '@/components/layout/sidebar';
import { MobileTopBar } from '@/components/layout/mobile-drawer';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
