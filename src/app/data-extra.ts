export const COMPANY = { code: 'distribuidora-norte', name: 'Distribuidora Norte' };
export const SYNC_LOGIN = { lastData: 'hoy 06:10' };

export interface Unit { id: string; name: string; km: string }
export const UNITS: Unit[] = [
  { id: 'U1', name: 'Camioneta 3.5T — ABC-123', km: '84,320 km' },
  { id: 'U2', name: 'Camioneta 1.5T — XYZ-201', km: '61,905 km' },
  { id: 'U3', name: 'Furgón refrigerado — REF-908', km: '112,480 km' },
];

export interface LoadLine { id: string; name: string; loaded: number; counted: number | null; reason: string | null }
export const LOAD_LINES: LoadLine[] = [
  { id: 'P01', name: 'Pan de caja grande', loaded: 40, counted: 40, reason: null },
  { id: 'P02', name: 'Bollería surtida', loaded: 25, counted: 25, reason: null },
  { id: 'P03', name: 'Tortilla de harina', loaded: 30, counted: 28, reason: null },
  { id: 'P04', name: 'Pastelito individual', loaded: 60, counted: null, reason: null },
];
export const LOAD_DIFF_REASONS = ['Producto dañado', 'Error de conteo en almacén', 'Merma en ruta', 'Rechazo parcial del cliente', 'Sin existencia en la unidad'];

export const CLIENTE = {
  name: 'Abarrotes Doña Mari',
  address: 'Av. Juárez 210, Col. Centro',
  canal: 'Tienda tradicional · visita L–M–V',
  contacto: 'María R. · 55 1234 5678',
  saldo: 1240, vencidos: 1, limite: 5000, disponible: 3760,
  pedido: { boxes: 12, sku: 6, total: 3180, nota: 'Levantado por preventa el 14 sep' },
  visitas: [{ date: '12 sep', tone: 'ok' as const, label: 'entregado' }, { date: '10 sep', tone: 'bad' as const, label: 'parcial' }],
};

export const NO_ENTREGA_REASONS = ['Local cerrado', 'Cliente rechazó la mercancía', 'Sin dinero para pagar', 'Dirección incorrecta', 'Crédito excedido'];

export const COBRO = {
  hoy: 2946.5,
  saldoVencido: 1240,
  formas: ['Efectivo', 'Transferencia', 'Crédito'],
  aplicaA: [
    { doc: 'Entrega F-8842', importe: 2946.5, nota: '' },
    { doc: 'Saldo anterior', importe: 53.5, nota: 'parcial' },
  ],
};

export const INCIDENCIA_REASONS = ['Faltó producto', 'Llegó dañado o caduco', 'Me cobraron de más'];
export const INCIDENCIA_ENTREGA = { folio: 'F-8842', fecha: 'hoy 10:18', recibio: 'María Rodríguez', producto: 'Bollería surtida' };

export interface ConfigModulo { id: string; name: string; desc: string; on: boolean }
export const CONFIG_MODULOS: ConfigModulo[] = [
  { id: 'preventa', name: 'Preventa', desc: 'Pedido anticipado en el punto de venta', on: true },
  { id: 'autoventa', name: 'Autoventa', desc: 'Venta y entrega en el mismo momento', on: true },
  { id: 'comodato', name: 'Activos en comodato', desc: 'Refrigeradores y exhibidores', on: false },
];
export interface ConfigCampo { id: string; label: string; required: boolean }
export const CONFIG_CAMPOS: ConfigCampo[] = [
  { id: 'firma', label: 'Firma del receptor', required: true },
  { id: 'foto', label: 'Fotografía de la mercancía', required: true },
  { id: 'temp', label: 'Temperatura del refrigerador', required: false },
];