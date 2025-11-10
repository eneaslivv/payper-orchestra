import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Mail, MapPin, Package, Users, Phone } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { ModuleChip } from "@/components/ModuleChip";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TenantUsers } from "@/components/tenant-detail/TenantUsers";

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  status: string;
  default_currency: string;
  timezone: string;
  notes_internal: string | null;
  created_at: string;
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role_label: string | null;
    is_primary: boolean;
  }>;
  modules: Array<{
    id: string;
    enabled: boolean;
    activated_at: string | null;
    app: {
      name: string;
      key: string;
      is_core: boolean;
    };
  }>;
  locations: Array<{
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    status: string;
  }>;
}

const TenantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTenantDetail();
    }
  }, [id]);

  const fetchTenantDetail = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select(`
          *,
          tenant_contacts:tenant_contacts (*),
          tenant_modules:tenant_modules (
            id,
            enabled,
            activated_at,
            apps_registry (name, key, is_core)
          ),
          tenant_locations:tenant_locations (*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setTenant(null);
        return;
      }

      const formatted: TenantDetail = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        legal_name: data.legal_name,
        status: data.status,
        default_currency: data.default_currency,
        timezone: data.timezone,
        notes_internal: data.notes_internal,
        created_at: data.created_at,
        contacts: data.tenant_contacts || [],
        modules: (data.tenant_modules || []).map((m: any) => ({
          id: m.id,
          enabled: m.enabled,
          activated_at: m.activated_at,
          app: m.apps_registry,
        })),
        locations: data.tenant_locations || [],
      };

      setTenant(formatted);
    } catch (error) {
      console.error("Error fetching tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando comercio...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Comercio no encontrado</p>
        <Button onClick={() => navigate("/admin/tenants")} className="mt-4">
          Volver a Comercios
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/tenants")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
              <StatusBadge status={tenant.status as any} />
            </div>
            <p className="text-muted-foreground mt-1">
              {tenant.slug} • Creado {format(new Date(tenant.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Módulos</p>
                <p className="text-2xl font-bold">{tenant.modules.filter(m => m.enabled).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Mail className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contactos</p>
                <p className="text-2xl font-bold">{tenant.contacts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <MapPin className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Locaciones</p>
                <p className="text-2xl font-bold">{tenant.locations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuarios</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="locations">Locaciones</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre Comercial</p>
                <p className="text-base font-medium">{tenant.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Razón Social</p>
                <p className="text-base">{tenant.legal_name || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Slug</p>
                <p className="text-base font-mono text-sm">{tenant.slug}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <StatusBadge status={tenant.status as any} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Moneda</p>
                <p className="text-base">{tenant.default_currency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Zona Horaria</p>
                <p className="text-base">{tenant.timezone}</p>
              </div>
              {tenant.notes_internal && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Notas Internas</p>
                  <p className="text-base">{tenant.notes_internal}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contactos del Comercio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenant.contacts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay contactos registrados</p>
                ) : (
                  tenant.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{contact.name}</p>
                          {contact.is_primary && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                        {contact.role_label && (
                          <p className="text-sm text-muted-foreground">{contact.role_label}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Módulos Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenant.modules.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay módulos asignados</p>
                ) : (
                  tenant.modules.map((module) => (
                    <div
                      key={module.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <ModuleChip name={module.app.name} isCore={module.app.is_core} />
                        <div>
                          <p className="font-medium">{module.app.name}</p>
                          {module.activated_at && (
                            <p className="text-sm text-muted-foreground">
                              Activado {format(new Date(module.activated_at), "d MMM yyyy", { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        {module.enabled ? (
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                            Activo
                          </span>
                        ) : (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            Desactivado
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <TenantUsers tenantId={tenant.id} />
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Locaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenant.locations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay locaciones registradas</p>
                ) : (
                  tenant.locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{location.name}</p>
                          {location.code && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                              {location.code}
                            </span>
                          )}
                        </div>
                        {location.address && (
                          <p className="text-sm text-muted-foreground pl-6">{location.address}</p>
                        )}
                        {(location.city || location.country) && (
                          <p className="text-sm text-muted-foreground pl-6">
                            {[location.city, location.country].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={location.status as any} />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenantDetail;