import { FileText } from 'lucide-react';

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
        <FileText className="size-4" />
      </div>
      <span className="font-heading text-sidebar-foreground text-sm font-semibold">
        DocAssistant
      </span>
    </div>
  );
}
