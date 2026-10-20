// src/app/data.ts
export interface Pin { id: number; x: number; y: number; status?: 'done' | 'alert' | 'next'; label: string; title?: string }
export interface MapPath { tone: 'blue' | 'green'; points: [number, number][] }
export interface Alerta { id: string; tone: 'bad' | 'hl' | ''; title: string; detail: string; actions?: boolean }
export interface Stop {
  id: number; name: string; status: 'next' | 'done' | 'failed' | 'pending'; line: string;
  time?: string; boxes?: number; products?: number; total?: number; balance?: number;
}
export interface OrderLine { id: string; name: string; price: number; ordered: number; delivered: number }
export interface Historial { date: string; tone: 'ok' | 'bad'; tag: string; line: string; amount?: number }

export const ROUTE = { code: 'R-114', date: 'Miércoles 16 de septiembre', done: 8, total: 32, sales: 12480, offlinePending: 4 };

// M-01
export const STOPS: Stop[] = [
  { id: 9, name: 'Abarrotes Doña Mari', status: 'next', line: 'Av. Juárez 210 · 400 m · llegada 10:15', boxes: 12, products: 6, total: 3180, balance: 1240 },
  { id: 7, name: 'Minisúper El Roble', status: 'done', line: '09:52 · completo · cobrado en efectivo' },
  { id: 8, name: 'Papelería Sol', status: 'failed', line: 'Local cerrado · reprogramada al 17 sep' },
  { id: 11, name: 'Tienda La Esquina', status: 'pending', time: '11:05', line: 'Hidalgo 14 · 1.8 km · cierra a las 14:00' },
];

// M-02 (coordenadas en %)
export const MAP_PINS: Pin[] = [
  { id: 7, x: 11, y: 82, status: 'done', label: '7' },
  { id: 8, x: 24, y: 64, status: 'done', label: '8' },
  { id: 9, x: 50, y: 70, status: 'next', label: '9' },
  { id: 10, x: 63, y: 48, label: '10' },
  { id: 11, x: 44, y: 32, label: '11' },
  { id: 12, x: 66, y: 16, label: '12' },
];
export const MAP_PATH: MapPath[] = [{ tone: 'blue', points: [[11, 82], [24, 64], [50, 70], [63, 48], [44, 32], [66, 16]] }];

// M-03 — con estas cantidades el total entregado es $2,946.50
export const ORDER: OrderLine[] = [
  { id: 'P01', name: 'Pan de caja grande', price: 380, ordered: 2, delivered: 2 },
  { id: 'P02', name: 'Bollería surtida', price: 233.5, ordered: 4, delivered: 3 },
  { id: 'P04', name: 'Pastelito individual', price: 290, ordered: 2, delivered: 2 },
  { id: 'P03', name: 'Tortilla de harina', price: 205, ordered: 2, delivered: 2 },
  { id: 'P05', name: 'Pan integral', price: 240, ordered: 1, delivered: 1 },
  { id: 'P08', name: 'Concha', price: 256, ordered: 1, delivered: 1 },
];
export const SHORTAGE_REASONS = ['Producto dañado', 'Error de conteo en almacén', 'Merma en ruta', 'Rechazo parcial del cliente', 'Sin existencia en la unidad'];

// M-05
export const CORTE = {
  operador: 'Luis Martínez',
  paradas: [30, 32],
  venta: 48210,
  inventario: { cargado: 420, vendido: 386, devuelto: 31 },
  efectivo: { sistema: 41880, declarado: 41650, tolerancia: 100 },
};

// M-06
export const NEGOCIO = {
  name: 'Abarrotes Doña Mari',
  eta: '10:15', ruta: 'R-114', repartidor: 'Luis M.', boxes: 12, products: 6, total: 3180, saldo: 1240,
  pins: [
    { id: 1, x: 8, y: 80, label: '🚚', title: 'Unidad' },
    { id: 2, x: 72, y: 26, status: 'done', label: '●', title: 'Tu negocio' },
  ] as Pin[],
  paths: [{ tone: 'blue', points: [[8, 80], [27, 63], [50, 70], [72, 26]] }] as MapPath[],
  historial: [
    { date: '12 de septiembre', tone: 'ok', tag: 'Completo', line: 'Ver comprobante', amount: 2940 },
    { date: '10 de septiembre', tone: 'bad', tag: 'Parcial', line: 'Faltó 1 caja · nota de crédito aplicada' },
  ] as Historial[],
};

// M-07
export const TORRE = {
  fecha: 'Centro Veracruz · miércoles 16 de septiembre',
  kpis: { rutas: 14, avance: 62, venta: '$612 K', devolucion: '3.1%' },
  pins: [
    { id: 1, x: 8.7, y: 77, status: 'done', label: '7' },
    { id: 2, x: 22, y: 59, status: 'done', label: '8' },
    { id: 3, x: 37, y: 68, label: '9' },
    { id: 4, x: 48.7, y: 41, label: '10' },
    { id: 5, x: 63.7, y: 50, status: 'alert', label: '!', title: 'Incidencia' },
    { id: 6, x: 27, y: 32, status: 'done', label: '3' },
    { id: 7, x: 55, y: 27, label: '5' },
  ] as Pin[],
  paths: [
    { tone: 'blue', points: [[10, 82], [23, 64], [38, 73], [50, 45], [65, 55], [78, 27]] },
    { tone: 'green', points: [[13, 27], [28, 36], [42, 18], [57, 32], [72, 73]] },
  ] as MapPath[],
  alertas: [
    { id: 'a1', tone: 'bad', title: 'R-118 retrasada 48 min', detail: 'Quedan 9 paradas · reasignar' },
    { id: 'a2', tone: 'bad', title: 'Visita fuera de sitio', detail: 'R-107 · Tienda La Paz · 640 m' },
    { id: 'a3', tone: 'hl', title: 'Diferencia de efectivo', detail: 'R-114 · $230 · requiere aprobación', actions: true },
    { id: 'a4', tone: 'hl', title: 'Timbrado rechazado', detail: 'Código postal inválido · 2 documentos' },
    { id: 'a5', tone: '', title: 'Dispositivo sin sincronizar', detail: 'TEC-0397 · hace 3 h 20 min' },
  ] as Alerta[],
};