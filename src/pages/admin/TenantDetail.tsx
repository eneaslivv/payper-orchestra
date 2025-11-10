import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const TenantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTenantData();
    }
  }, [id]);

  const fetchTenantData = async () => {
    try {
      // Fetch tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", id)
        .single();

      if (tenantError) throw tenantError;
      setTenant(tenantData);

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from("tenant_contacts")
        .select("*")
        .eq("tenant_id", id);

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("tenant_modules")
        .select(`
          *,
          apps_registry (*)
        `)
        .eq("tenant_id", id);

      if (modulesError) throw modulesError;
      setModules(modulesData || []);
    } catch (error) {
      console.error("Error fetching tenant data:", error);
      toast.error("Error al cargar los datos del tenant");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando detalles del tenant...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <div className="rounded-full bg-muted p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">❌</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Tenant no encontrado</h2>
        <p className="text-muted-foreground mb-4">
          El tenant que buscas no existe o fue eliminado.
        </p>
        <Button onClick={() => navigate("/admin/tenants")}>
          Volver a Tenants
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/tenants")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
          <p className="text-muted-foreground">{tenant.legal_name || "Sin razón social"}</p>
        </div>
        <StatusBadge status={tenant.status} className="ml-auto" />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Información</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
          <TabsTrigger value="notes">Notas Internas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Slug</p>
                  <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Moneda</p>
                  <p className="text-sm text-muted-foreground">{tenant.default_currency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Zona Horaria</p>
                  <p className="text-sm text-muted-foreground">{tenant.timezone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Estado</p>
                  <StatusBadge status={tenant.status} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Módulos Activos</CardTitle>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay módulos activados
                </p>
              ) : (
                <div className="space-y-2">
                  {modules.map((module: any) => (
                    <div
                      key={module.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{module.apps_registry.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {module.apps_registry.description}
                        </p>
                      </div>
                      <StatusBadge status={module.enabled ? "active" : "disabled"} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contactos</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay contactos registrados
                </p>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.email}</p>
                          {contact.phone && (
                            <p className="text-sm text-muted-foreground">{contact.phone}</p>
                          )}
                          {contact.role_label && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {contact.role_label}
                            </p>
                          )}
                        </div>
                        {contact.is_primary && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas Internas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {tenant.notes_internal || "Sin notas"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenantDetail;
