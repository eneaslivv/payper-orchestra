import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Package, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { ModuleChip } from "@/components/ModuleChip";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
}

interface RecentTenant {
  id: string;
  name: string;
  status: string;
  created_at: string;
  modules: { name: string; is_core: boolean }[];
  contacts: { name: string; email: string }[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    suspendedTenants: 0,
  });
  const [recentTenants, setRecentTenants] = useState<RecentTenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("status");

      if (tenantsError) throw tenantsError;

      const stats = {
        totalTenants: tenants?.length || 0,
        activeTenants: tenants?.filter((t) => t.status === "active").length || 0,
        trialTenants: tenants?.filter((t) => t.status === "trial").length || 0,
        suspendedTenants: tenants?.filter((t) => t.status === "suspended").length || 0,
      };
      setStats(stats);

      // Fetch recent tenants
      const { data: recentData, error: recentError } = await supabase
        .from("tenants")
        .select(`
          id,
          name,
          status,
          created_at,
          tenant_contacts (name, email, is_primary),
          tenant_modules (
            apps_registry (name, is_core)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      const formatted = recentData?.map((tenant: any) => ({
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
        contacts: tenant.tenant_contacts
          .filter((c: any) => c.is_primary)
          .map((c: any) => ({ name: c.name, email: c.email })),
      })) || [];

      setRecentTenants(formatted);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del sistema Payper</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.activeTenants}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Trial</CardTitle>
            <Package className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.trialTenants}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspendidos</CardTitle>
            <Users className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.suspendedTenants}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Tenants Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTenants.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay tenants registrados aún
              </p>
            ) : (
              recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{tenant.name}</h3>
                      <StatusBadge status={tenant.status as any} />
                    </div>
                    {tenant.contacts[0] && (
                      <p className="text-sm text-muted-foreground">
                        {tenant.contacts[0].name} • {tenant.contacts[0].email}
                      </p>
                    )}
                    <div className="flex gap-1 flex-wrap">
                      {tenant.modules.slice(0, 3).map((module, idx) => (
                        <ModuleChip key={idx} name={module.name} isCore={module.is_core} />
                      ))}
                      {tenant.modules.length > 3 && (
                        <span className="text-xs text-muted-foreground self-center">
                          +{tenant.modules.length - 3} más
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

export default Dashboard;
