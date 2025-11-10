import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TenantUser {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  email?: string;
}

interface TenantUsersProps {
  tenantId: string;
}

export const TenantUsers = ({ tenantId }: TenantUsersProps) => {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("tenant_user");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [tenantId]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("tenant_users")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For now, just show user_id, we'll add email display later
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error("El email es requerido");
      return;
    }

    setInviting(true);
    try {
      // For now, create a placeholder invitation
      // In production, this would send an actual email invitation
      const tempUserId = crypto.randomUUID();

      const { error: insertError } = await supabase.from("tenant_users").insert([{
        tenant_id: tenantId,
        user_id: tempUserId,
        role: inviteRole as any,
        status: "invited" as any,
      }]);

      if (insertError) throw insertError;

      toast.success(`Invitación enviada a ${inviteEmail}`);
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("tenant_user");
      fetchUsers();
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast.error(error.message || "Error al invitar usuario");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de querer remover este usuario?")) return;

    try {
      const { error } = await supabase
        .from("tenant_users")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast.success("Usuario removido");
      fetchUsers();
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast.error("Error al remover usuario");
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      tenant_owner: "Propietario",
      tenant_admin: "Administrador",
      tenant_manager: "Manager",
      tenant_user: "Usuario",
    };
    return labels[role] || role;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: "Activo", className: "bg-success/10 text-success" },
      invited: { label: "Invitado", className: "bg-warning/10 text-warning" },
      disabled: { label: "Deshabilitado", className: "bg-muted text-muted-foreground" },
    };
    const { label, className } = config[status] || config.invited;
    return (
      <span className={`text-xs px-2 py-1 rounded ${className}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Usuarios del Comercio</CardTitle>
          <Button onClick={() => setShowInviteDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Invitar Usuario
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay usuarios asignados a este comercio
              </p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.email || user.user_id.substring(0, 8) + "..."}</p>
                      {getStatusBadge(user.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{getRoleLabel(user.role)}</span>
                      <span>•</span>
                      <span>
                        Agregado {format(new Date(user.created_at), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveUser(user.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Usuario</DialogTitle>
            <DialogDescription>
              Invita a un nuevo usuario a este comercio. Si no tiene cuenta, se creará automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant_owner">Propietario</SelectItem>
                  <SelectItem value="tenant_admin">Administrador</SelectItem>
                  <SelectItem value="tenant_manager">Manager</SelectItem>
                  <SelectItem value="tenant_user">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteUser} disabled={inviting}>
              {inviting ? "Invitando..." : "Invitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};