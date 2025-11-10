import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { ModuleChip } from "@/components/ModuleChip";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Tenant {
  id: string;
  name: string;
  status: string;
  created_at: string;
  modules: { name: string; is_core: boolean }[];
}

const Tenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    const filtered = tenants.filter((tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTenants(filtered);
  }, [searchTerm, tenants]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select(`
          id,
          name,
          status,
          created_at,
          tenant_modules (
            apps_registry (name, is_core)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = data?.map((tenant: any) => ({
        id: tenant.id,
        name: tenant.name,
        status: tenant.status,
        created_at: tenant.created_at,
        modules: tenant.tenant_modules
          .filter((m: any) => m.apps_registry)
          .map((m: any) => ({
            name: m.apps_registry.name,
            is_core: m.apps_registry.is_core,
          })),
      })) || [];

      setTenants(formatted);
      setFilteredTenants(formatted);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">Gestiona todos los clientes de Payper</p>
        </div>
        <Button onClick={() => navigate("/admin/tenants/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Tenant
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Listado de Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTenants.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? "No se encontraron tenants" : "No hay tenants registrados aún"}
              </p>
            ) : (
              filteredTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{tenant.name}</h3>
                      <StatusBadge status={tenant.status as any} />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {tenant.modules.slice(0, 4).map((module, idx) => (
                        <ModuleChip key={idx} name={module.name} isCore={module.is_core} />
                      ))}
                      {tenant.modules.length > 4 && (
                        <span className="text-xs text-muted-foreground self-center">
                          +{tenant.modules.length - 4} más
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground ml-4">
                    {format(new Date(tenant.created_at), "d MMM yyyy", { locale: es })}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tenants;
