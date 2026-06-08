'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Upload, MessageSquare } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Upload', icon: Upload },
  { href: '/assistant', label: 'Assistant', icon: MessageSquare },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
