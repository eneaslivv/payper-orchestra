# EVENTA - Single Event Ticket Purchase App

Una aplicación moderna de venta de entradas para eventos únicos, construida con Next.js 15, React 18, TypeScript y Tailwind CSS. Diseñada con un enfoque mobile-first y experiencia de usuario premium.

## 🚀 Características Principales

### Para Usuarios No Registrados
- ✨ Interfaz minimalista y atractiva
- 👀 Vista previa del evento con información básica
- 🔐 Invitaciones discretas para registrarse
- 📱 Diseño completamente responsivo

### Para Usuarios Registrados
- 🎫 Compra completa de entradas
- 📊 Dashboard personal de tickets
- 📱 Códigos QR para entrada al evento
- 🔄 Compartir tickets vía email/WhatsApp
- 👤 Gestión de perfil de usuario

### Navegación Adaptativa
- 🖥️ **Desktop/Tablet**: Sidebar lateral colapsible
- 📱 **Mobile**: Barra de navegación inferior fija
- 🔄 Transición automática según estado de autenticación

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Iconos**: Lucide React
- **Estado**: React Context API
- **Almacenamiento**: localStorage (demo)
- **Deployment**: Vercel

## 📁 Estructura del Proyecto

\`\`\`
├── app/
│   ├── (auth)/                 # Grupo de rutas de autenticación
│   │   ├── layout.tsx         # Layout específico para auth
│   │   ├── login/
│   │   │   └── page.tsx       # Página de login
│   │   └── register/
│   │       └── page.tsx       # Página de registro
│   ├── cart/
│   │   └── page.tsx           # Carrito de compras
│   ├── confirmation/
│   │   └── page.tsx           # Confirmación de compra
│   ├── event/
│   │   └── page.tsx           # Detalles del evento
│   ├── profile/
│   │   └── page.tsx           # Perfil de usuario
│   ├── tickets/
│   │   ├── [id]/
│   │   │   └── page.tsx       # Vista individual de ticket
│   │   └── page.tsx           # Lista de tickets
│   ├── globals.css            # Estilos globales
│   ├── layout.tsx             # Layout raíz
│   └── page.tsx               # Página de inicio
├── components/
│   ├── ui/                    # Componentes de shadcn/ui
│   ├── adaptive-layout.tsx    # Layout que se adapta al estado de auth
│   ├── app-sidebar.tsx        # Sidebar para desktop
│   ├── guest-header.tsx       # Header para usuarios no registrados
│   ├── guest-home.tsx         # Página de inicio para invitados
│   ├── mobile-bottom-nav.tsx  # Navegación inferior para móvil
│   └── theme-provider.tsx     # Proveedor de tema
├── contexts/
│   └── auth-context.tsx       # Contexto de autenticación
├── hooks/
│   └── use-media-query.ts     # Hook para media queries
└── lib/
    └── utils.ts               # Utilidades generales
\`\`\`

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm, yarn, o pnpm

### Instalación

1. **Clonar el repositorio**
\`\`\`bash
git clone <repository-url>
cd eventa-app
\`\`\`

2. **Instalar dependencias**
\`\`\`bash
npm install
# o
yarn install
# o
pnpm install
\`\`\`

3. **Ejecutar en desarrollo**
\`\`\`bash
npm run dev
# o
yarn dev
# o
pnpm dev
\`\`\`

4. **Abrir en el navegador**
\`\`\`
http://localhost:3000
\`\`\`

## 📱 Guía de Uso

### Flujo para Usuarios No Registrados

1. **Página de Inicio**: Vista atractiva con información del evento
2. **Explorar Evento**: Acceso a detalles básicos del evento
3. **Registro/Login**: Invitaciones para crear cuenta o iniciar sesión

### Flujo para Usuarios Registrados

1. **Dashboard**: Vista personalizada con acceso completo
2. **Comprar Tickets**: Selección de tipos de entrada y cantidad
3. **Carrito**: Revisión y confirmación de compra
4. **Mis Tickets**: Gestión de entradas con códigos QR
5. **Perfil**: Edición de información personal

### Navegación Responsiva

#### Desktop (≥1024px)
- Sidebar lateral con navegación completa
- Contenido principal en área central
- Sidebar colapsible para más espacio

#### Mobile (<1024px)
- Barra de navegación inferior fija
- Contenido ocupa toda la pantalla
- Navegación accesible con una mano

## 🎨 Diseño y Tema

### Paleta de Colores
- **Primario**: Lime Green (#84cc16)
- **Secundario**: Violet (#8b5cf6)
- **Fondo**: Dark Gray (#09090b)
- **Texto**: White/Gray variants

### Tipografía
- **Fuente**: Inter (Google Fonts)
- **Tamaños**: Sistema de escalado de Tailwind CSS

### Componentes UI
- **Librería**: shadcn/ui
- **Estilo**: Dark mode por defecto
- **Animaciones**: Transiciones suaves con CSS

## 🔐 Sistema de Autenticación

### Contexto de Autenticación
\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (userData: User) => void
  logout: () => void
  isLoading: boolean
}
\`\`\`

### Estados de Usuario
- **No Autenticado**: Acceso limitado, vista de invitado
- **Autenticado**: Acceso completo a todas las funcionalidades
- **Loading**: Estado de transición durante verificación

### Persistencia
- **Almacenamiento**: localStorage (demo)
- **Sincronización**: Entre pestañas del navegador
- **Seguridad**: Validación en cada carga de página

## 📊 Estructura de Datos

### Usuario
\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: Date
  updatedAt: Date
}
\`\`\`

### Evento
\`\`\`typescript
interface Event {
  id: string
  title: string
  description: string
  date: Date
  time: string
  location: string
  coverImage: string
  lineup: string[]
  ticketTypes: TicketType[]
}
\`\`\`

### Tipo de Ticket
\`\`\`typescript
interface TicketType {
  id: string
  name: string
  price: number
  description: string
  available: number
  maxPerUser: number
}
\`\`\`

### Ticket de Usuario
\`\`\`typescript
interface UserTicket {
  id: string
  userId: string
  eventId: string
  ticketTypeId: string
  qrCode: string
  status: 'active' | 'used' | 'cancelled'
  purchaseDate: Date
}
\`\`\`

## 🔧 Configuración de Desarrollo

### Scripts Disponibles
\`\`\`json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit"
}
\`\`\`

### Variables de Entorno
\`\`\`env
# Desarrollo
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Producción (ejemplo)
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=your-database-url
NEXTAUTH_SECRET=your-secret-key
\`\`\`

## 🚀 Deployment

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push

### Otros Proveedores
- **Netlify**: Compatible con Next.js
- **Railway**: Soporte completo para Next.js
- **Docker**: Dockerfile incluido

## 🧪 Testing

### Estructura de Tests
\`\`\`
├── __tests__/
│   ├── components/
│   ├── pages/
│   └── utils/
├── jest.config.js
└── setupTests.ts
\`\`\`

### Comandos de Testing
\`\`\`bash
npm run test          # Ejecutar tests
npm run test:watch    # Modo watch
npm run test:coverage # Reporte de cobertura
\`\`\`

## 📈 Roadmap

### Fase 1 - MVP ✅
- [x] Autenticación básica
- [x] Navegación adaptativa
- [x] Compra de tickets
- [x] Códigos QR

### Fase 2 - Mejoras
- [ ] Backend real con base de datos
- [ ] Pagos con Stripe/PayPal
- [ ] Notificaciones push
- [ ] Compartir en redes sociales

### Fase 3 - Avanzado
- [ ] Múltiples eventos
- [ ] Panel de administración
- [ ] Analytics y reportes
- [ ] API pública

## 🤝 Contribución

### Proceso de Contribución
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de Código
- **ESLint**: Configuración estricta
- **Prettier**: Formateo automático
- **TypeScript**: Tipado estricto
- **Commits**: Conventional Commits

## 📄 Licencia

MIT License - ver archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

- **Email**: support@eventa-app.com
- **GitHub Issues**: [Reportar problema](https://github.com/your-repo/issues)
- **Documentación**: [Wiki del proyecto](https://github.com/your-repo/wiki)

---

**Desarrollado con ❤️ para la comunidad de eventos**
