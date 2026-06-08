'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
] as const;

type Theme = (typeof OPTIONS)[number]['value'];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration guard for next-themes — `theme` is undefined on the server,
  // so we hold the SSR-safe default until the client has mounted.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const current: Theme = mounted && isTheme(theme) ? theme : 'system';

  return (
    <div
      role="group"
      aria-label="Theme"
      className="bg-muted/60 grid grid-cols-3 gap-0.5 rounded-lg p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            aria-label={`${label} theme`}
            title={label}
            className={cn(
              'flex items-center justify-center rounded-md py-1.5 transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}

function isTheme(value: string | undefined): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}
