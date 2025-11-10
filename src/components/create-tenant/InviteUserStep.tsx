import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { InviteUserFormData } from "@/lib/validations/tenant";

interface InviteUserStepProps {
  inviteData: Partial<InviteUserFormData> | null;
  setInviteData: (data: Partial<InviteUserFormData> | null) => void;
}

const roleLabels = {
  tenant_owner: "Owner - Acceso total",
  tenant_admin: "Admin - Gestión completa",
  tenant_ops: "Operaciones - Uso diario",
  tenant_finance: "Finanzas - Reportes y datos",
  tenant_viewer: "Visualización - Solo lectura",
};

export const InviteUserStep = ({ inviteData, setInviteData }: InviteUserStepProps) => {
  const [skipInvite, setSkipInvite] = useState(inviteData === null);

  const handleSkipChange = (checked: boolean) => {
    setSkipInvite(checked);
    if (checked) {
      setInviteData(null);
    } else {
      setInviteData({ email: "", role: "tenant_owner" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Invitar Usuario (Opcional)</h2>
        <p className="text-muted-foreground">
          Invita al usuario que gestionará este tenant. Podrás agregar más usuarios después.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="skip_invite"
          checked={skipInvite}
          onCheckedChange={handleSkipChange}
        />
        <Label htmlFor="skip_invite" className="text-sm font-normal cursor-pointer">
          Omitir este paso (agregar usuarios más tarde)
        </Label>
      </div>

      {!skipInvite && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite_email">
              Email del Usuario <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invite_email"
              type="email"
              value={inviteData?.email || ""}
              onChange={(e) =>
                setInviteData({ ...inviteData, email: e.target.value })
              }
              placeholder="admin@empresa.com"
            />
            <p className="text-xs text-muted-foreground">
              Se enviará un email de invitación a esta dirección
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite_role">Rol del Usuario</Label>
            <Select
              value={inviteData?.role || "tenant_owner"}
              onValueChange={(value: any) =>
                setInviteData({ ...inviteData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-accent/50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Permisos según el rol:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Owner:</strong> Control total del tenant</li>
              <li>• <strong>Admin:</strong> Gestión de usuarios y configuraciones</li>
              <li>• <strong>Operaciones:</strong> Uso diario de los módulos activos</li>
              <li>• <strong>Finanzas:</strong> Acceso a reportes y datos financieros</li>
              <li>• <strong>Viewer:</strong> Solo visualización de información</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
