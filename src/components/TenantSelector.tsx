import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export const TenantSelector = () => {
  const { currentTenant, availableTenants, setCurrentTenant } = useTenant();
  const { globalAdmin } = useAuth();

  if (!globalAdmin && availableTenants.length <= 1) {
    // Don't show selector if user only has access to one tenant
    return null;
  }

  if (availableTenants.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentTenant?.id || ""}
        onValueChange={(value) => {
          const tenant = availableTenants.find((t) => t.id === value);
          if (tenant) {
            setCurrentTenant(tenant);
          }
        }}
      >
        <SelectTrigger className="w-[200px] h-8 text-sm">
          <SelectValue placeholder="Select tenant" />
        </SelectTrigger>
        <SelectContent>
          {availableTenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              {tenant.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
