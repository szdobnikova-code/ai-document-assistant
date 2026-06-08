import { SidebarBrand } from '@/components/layout/sidebar-brand';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UsageBlock } from '@/components/usage/usage-block';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export function Sidebar() {
  return (
    <aside className="bg-sidebar border-sidebar-border hidden h-screen w-60 shrink-0 flex-col gap-6 border-r p-4 md:sticky md:top-0 md:flex">
      <SidebarBrand />
      <div className="flex-1">
        <SidebarNav />
      </div>
      <div className="flex flex-col gap-2">
        <ThemeToggle />
        <UsageBlock />
      </div>
    </aside>
  );
}
