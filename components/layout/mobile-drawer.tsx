'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SidebarBrand } from '@/components/layout/sidebar-brand';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UsageBlock } from '@/components/usage/usage-block';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { cn } from '@/lib/utils';

export function MobileTopBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header className="bg-background sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 md:hidden">
        <SidebarBrand />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu />
        </Button>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-40 transition-opacity md:hidden',
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="bg-foreground/40 absolute inset-0 backdrop-blur-xs"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            'bg-sidebar border-sidebar-border absolute top-0 left-0 flex h-full w-72 flex-col gap-6 border-r p-4 shadow-xl transition-transform duration-200',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between">
            <SidebarBrand />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </div>
          <div className="flex-1">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
          <div className="flex flex-col gap-2">
            <ThemeToggle />
            <UsageBlock />
          </div>
        </aside>
      </div>
    </>
  );
}
