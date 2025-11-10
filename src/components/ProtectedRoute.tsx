import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, globalAdmin, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!globalAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">
            Tu cuenta no tiene permisos de administrador global. 
            Contacta al equipo de Payper para obtener acceso.
          </p>
          <button
            onClick={async () => {
              try {
                await signOut();
              } catch (e) {
                // no-op
              }
            }}
            className="text-primary hover:underline"
          >
            Volver a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
