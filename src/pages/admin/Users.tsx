const Users = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">Gestión de usuarios por tenant</p>
      </div>
      
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="rounded-full bg-muted p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Próximamente</h2>
          <p className="text-muted-foreground">
            La gestión de usuarios estará disponible pronto. Aquí podrás ver y administrar
            todos los usuarios asociados a cada tenant.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Users;
