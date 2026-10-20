import { BarChart3, LayoutDashboard, Package, Receipt, Route as RouteIcon, Settings, Users } from 'lucide-angular';

export interface NavItem { label: string; icon: unknown; to?: string }

export const WEB_NAV: NavItem[] = [
  { label: 'Torre de control', icon: LayoutDashboard, to: '/web/torre' },
  { label: 'Rutas', icon: RouteIcon },
  { label: 'Clientes', icon: Users },
  { label: 'Catálogo', icon: Package },
  { label: 'Liquidaciones', icon: Receipt },
  { label: 'Reportes', icon: BarChart3 },
  { label: 'Configuración', icon: Settings, to: '/web/config' },
];