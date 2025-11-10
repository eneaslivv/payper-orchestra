import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = 'trial' | 'active' | 'free' | 'suspended' | 'cancelled' | 'invited' | 'disabled';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  trial: { label: 'Trial', className: 'bg-warning/10 text-warning border-warning/20' },
  active: { label: 'Activo', className: 'bg-success/10 text-success border-success/20' },
  free: { label: 'Free', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  suspended: { label: 'Suspendido', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  cancelled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground border-border' },
  invited: { label: 'Invitado', className: 'bg-warning/10 text-warning border-warning/20' },
  disabled: { label: 'Deshabilitado', className: 'bg-muted text-muted-foreground border-border' },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
};
