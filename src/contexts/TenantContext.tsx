import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  setCurrentTenant: (tenant: Tenant | null) => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { user, globalAdmin } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserTenants();
    } else {
      setCurrentTenant(null);
      setAvailableTenants([]);
      setLoading(false);
    }
  }, [user, globalAdmin]);

  const fetchUserTenants = async () => {
    try {
      setLoading(true);
      
      // Global admins can see all tenants
      if (globalAdmin) {
        const { data, error } = await supabase
          .from("tenants")
          .select("id, name, slug, status")
          .order("name");
        
        if (error) throw error;
        setAvailableTenants(data || []);
        
        // Auto-select first tenant if none selected
        if (!currentTenant && data && data.length > 0) {
          setCurrentTenant(data[0]);
        }
      } else {
        // Regular users see only their assigned tenants
        const { data, error } = await supabase
          .from("tenant_users")
          .select("tenants(id, name, slug, status)")
          .eq("user_id", user!.id)
          .eq("status", "active");
        
        if (error) throw error;
        
        const tenants = data?.map((tu: any) => tu.tenants).filter(Boolean) || [];
        setAvailableTenants(tenants);
        
        // Auto-select first tenant if none selected
        if (!currentTenant && tenants.length > 0) {
          setCurrentTenant(tenants[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching user tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        availableTenants,
        setCurrentTenant,
        loading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};
