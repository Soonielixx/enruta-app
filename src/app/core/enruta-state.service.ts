import { ApplicationRef, Injectable, inject } from '@angular/core';
import { MapboxService } from './mapbox.service';
import { strFromU8, unzipSync, zipSync } from 'fflate';

export type View =
  | 'dashboard' | 'routes' | 'planner' | 'approvals' | 'reports' | 'settlements' | 'audit'
  | 'configuration' | 'parameters' | 'forms' | 'publish' | 'brand' | 'integrations' | 'import'
  | 'products' | 'clients' | 'prices' | 'users' | 'devices' | 'profile' | 'notifications' | 'context';
export type AuthView = 'login' | 'verify' | 'recover' | 'reset' | 'register' | 'plan' | 'submitted' | 'permission' | 'expired';
export type RecordKind = 'producto' | 'cliente' | 'ruta' | 'usuario' | 'lista' | 'promocion' | 'descuento' | 'dispositivo' | 'liquidacion';
type ImportTarget = 'clientes' | 'productos';

interface NavItem {
  label: string;
  view: View;
  icon: string;
}

export interface DeliveryField {
  id: number;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string; helpText?: string; options?: string[]; min?: string; max?: string; maxLength?: string; defaultValue?: string; visible?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface Account {
  id: number; email: string; name: string; phone: string; role: string; photo: string; salt: string; hash: string;
  company: string; totpSecret: string; lastLogin: string; createdAt: string;
  failed?: number; lockedUntil?: number; sessions?: { id: string; ua: string; createdAt: string; lastSeen: string }[];
}

export interface SimpleRecord {
  id: number; name: string; detail: string; status: string; code?: string; category?: string;
  lat?: number; lng?: number; phone?: string; email?: string; role?: string; operatorId?: number; day?: string;
  color?: string; stopIds?: number[]; price?: number; refId?: number;
  collected?: number; deposited?: number; date?: string;
}

@Injectable({ providedIn: 'root' })
export class EnrutaState {
  constructor() { this.init(); }

  authenticated = false;
  authView: AuthView = 'login';
  view: View = 'dashboard';
  toast = '';
  email = '';
  password = '';
  verificationCode = '';
  newPassword = '';
  confirmPassword = '';
  registrationStep = 1;
  selectedPlan = '';
  acceptedTerms = false;
  registeredCompany = '';
  uploadName = '';
  uploadIssues: string[] = [];
  uploadCount = 0;
  pendingImported: SimpleRecord[] = [];
  uploadCompleted = false;
  importTarget: ImportTarget = 'clientes';
  modalKind: RecordKind | '' = '';
  draftName = '';
  draftDetail = '';
  draftCode = '';
  draftCategory = '';
  productCategoryFilter = '';
  productStatusFilter = '';
  brandLogoName = '';
  activeClient: SimpleRecord | null = null;
  showIntegrationForm = false;
  integrationName = '';
  showPasswordDialog = false;
  showContextDialog = false;
  companyName = '';
  centerName = '';
  settingsModules = [
    { name: 'Preventa', description: 'Pedido anticipado en el punto de venta', enabled: false },
    { name: 'Autoventa', description: 'Venta y entrega en el mismo momento', enabled: false },
    { name: 'Activos en comodato', description: 'Refrigeradores y exhibidores', enabled: false },
    { name: 'Auditoría de exhibición', description: 'Revisión de producto en anaquel', enabled: false },
  ];
  deliveryFields: DeliveryField[] = [];
  fieldLabel = '';
  fieldType = 'Texto';
  fieldRequired = false;
  products: SimpleRecord[] = [];
  clients: SimpleRecord[] = [];
  routes: SimpleRecord[] = [];
  users: SimpleRecord[] = [];
  priceLists: SimpleRecord[] = [];
  promotions: SimpleRecord[] = [];
  discounts: SimpleRecord[] = [];
  priceTab: 'Listas' | 'Promociones' | 'Descuentos' = 'Listas';
  devices: SimpleRecord[] = [];
  notifications: SimpleRecord[] = [];
  auditEvents: SimpleRecord[] = [];
  approvals: SimpleRecord[] = [];
  notificationsFilter = 'Todas';
  searchTerm = '';
  savedPermissions = false;
  selectedRole = '';
  rolePermissions: { name: string; enabled: boolean }[] = [
    { name: 'Entregar y capturar evidencia', enabled: false },
    { name: 'Cobrar en ruta', enabled: false },
    { name: 'Aplicar descuentos', enabled: false },
    { name: 'Autorizar crédito', enabled: false },
    { name: 'Ver precios de otros canales', enabled: false },
  ];
  profilePreferences = { criticalAlerts: false, dailySummary: false, versionNotices: false };
  brandColor = '';
  brandName = '';
  brandLogoDataUrl = '';
  connectionState: Record<string, boolean> = {};

  readonly navigation: NavGroup[] = [
    { label: 'OPERACIÓN', items: [
      { label: 'Torre de control', view: 'dashboard', icon: '⌂' },
      { label: 'Rutas', view: 'routes', icon: '↗' },
      { label: 'Aprobaciones', view: 'approvals', icon: '✓' },
      { label: 'Liquidaciones', view: 'settlements', icon: '▤' },
      { label: 'Indicadores', view: 'reports', icon: '▥' },
      { label: 'Bitácora', view: 'audit', icon: '◷' },
    ] },
    { label: 'DATOS', items: [
      { label: 'Clientes', view: 'clients', icon: '♙' },
      { label: 'Catálogo', view: 'products', icon: '▦' },
      { label: 'Precios y promociones', view: 'prices', icon: '%' },
      { label: 'Importar datos', view: 'import', icon: '⇧' },
    ] },
    { label: 'ADMINISTRACIÓN', items: [
      { label: 'Configuración', view: 'configuration', icon: '⚙' },
      { label: 'Parámetros', view: 'parameters', icon: '☷' },
      { label: 'Formularios', view: 'forms', icon: '☑' },
      { label: 'Marca e identidad', view: 'brand', icon: '✳' },
      { label: 'Integraciones', view: 'integrations', icon: '⛓' },
      { label: 'Usuarios y roles', view: 'users', icon: '♧' },
      { label: 'Dispositivos', view: 'devices', icon: '▣' },
    ] },
  ];

  get title(): string {
    const titles: Record<View, string> = {
      dashboard: 'Torre de control', routes: 'Rutas', planner: 'Planeador de rutas', approvals: 'Aprobaciones pendientes',
      reports: 'Indicadores', settlements: 'Liquidaciones', audit: 'Bitácora de auditoría',
      configuration: 'Configuración de la empresa', parameters: 'Panel de parámetros', forms: 'Editor de formularios',
      publish: 'Publicar configuración', brand: 'Marca e identidad visual', integrations: 'Integraciones', import: 'Alta de empresa e importación',
      products: 'Catálogo de productos', clients: 'Clientes', prices: 'Listas de precios y promociones',
      users: 'Usuarios y roles', devices: 'Dispositivos', profile: 'Mi perfil', notifications: 'Notificaciones', context: 'Cambiar de contexto',
    };
    return titles[this.view];
  }

  get visibleNotifications(): SimpleRecord[] {
    return this.notifications.filter((item) => this.notificationsFilter === 'Todas' || item.status === this.notificationsFilter);
  }

  get enabledModuleCount(): number {
    return this.settingsModules.filter((module) => module.enabled).length;
  }

  get passwordLengthValid(): boolean {
    return this.newPassword.length >= 12;
  }

  get passwordComplexityValid(): boolean {
    return /[A-Z]/.test(this.newPassword) && /[0-9]/.test(this.newPassword);
  }

  get filteredProducts(): SimpleRecord[] {
    return this.filterRecords(this.products).filter((product) =>
      (!this.productCategoryFilter || product.category === this.productCategoryFilter)
      && (!this.productStatusFilter || product.status === this.productStatusFilter));
  }

  get productCategories(): string[] {
    return [...new Set(this.products.map((product) => product.category).filter((category): category is string => Boolean(category)))];
  }

  get filteredClients(): SimpleRecord[] {
    return this.filterRecords(this.clients);
  }












  createPriceRecord(): void {
    this.openCreate(this.priceTab === 'Listas' ? 'lista' : this.priceTab === 'Promociones' ? 'promocion' : 'descuento');
  }



  startImport(target: ImportTarget): void {
    this.importTarget = target;
    this.uploadName = '';
    this.uploadIssues = [];
    this.uploadCount = 0;
    this.pendingImported = [];
    this.uploadCompleted = false;
    this.navigate('import');
  }




  setClient(client: SimpleRecord): void {
    this.activeClient = client;
  }
















  showToast(message: string): void {
    this.notify(message);
  }

  trackById(_index: number, item: SimpleRecord): number {
    return item.id;
  }

  // ======================= Persistencia, cuentas y sesión =======================
  accounts: Account[] = [];
  currentId: number | null = null;
  pendingAccountId: number | null = null;
  keepSession = true;
  resetCode = '';
  reg = { company: '', rfc: '', industry: '', country: '', timezone: '', adminName: '', adminEmail: '', phone: '', password: '', confirm: '' };
  planModules: Record<string, boolean> = {};
  profileEditing = false;
  profileDraft = { name: '', phone: '', email: '', currentPassword: '' };
  passwordForm = { current: '', next: '', confirm: '' };
  showTotpDialog = false;
  totpSecretDraft = '';
  totpCode = '';
  editingId: number | null = null;
  draftPhone = ''; draftLat = ''; draftLng = ''; draftPrice = ''; draftEmail = ''; draftRole = 'Repartidor';
  draftDay = 'Lunes'; draftColor = '#1769aa'; draftOperator = ''; draftStatus = ''; draftPassword = '';
  activeRouteId: number | null = null;
  selectedDevice: SimpleRecord | null = null;
  centers: string[] = [];
  pendingChanges: string[] = [];
  versions: SimpleRecord[] = [];
  changeNote = '';
  userFilter = 'Todos';
  rolePermissionSets: Record<string, { name: string; enabled: boolean }[]> = {};
  routeMetrics = { distanceKm: 0, durationMin: 0, geometry: [] as number[][], estimated: false, loading: false };
  readonly days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  readonly roles = ['Administrador', 'Supervisor', 'Repartidor', 'Preventista'];
  readonly routeColors = ['#1769aa', '#17865b', '#d9822b', '#8b5cf6', '#d64545', '#0ea5a5'];
  private readonly mapbox = inject(MapboxService);
  private readonly overviewGeometries = new Map<number, { signature: string; coords: number[][] }>();
  private readonly pendingOverviewRoutes = new Map<number, string>();

  private get hasStorage(): boolean { return typeof localStorage !== 'undefined'; }

  private read<T>(key: string, fallback: T, store: Storage | undefined = this.hasStorage ? localStorage : undefined): T {
    try { const raw = store?.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
  }


  private get dataKey(): string { return `enruta.data.${(this.account?.company ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`; }

  private loadCompanyData(account: Account): void {
    this.companyName = account.company;
    const data = this.read<Record<string, unknown>>(`enruta.data.${account.company.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, {});
    const keys = ['centerName', 'parameterSets', 'settingsModules', 'deliveryFields', 'formsData', 'settlements', 'products', 'clients', 'routes', 'users', 'priceLists', 'promotions', 'discounts', 'devices', 'notifications', 'auditEvents', 'approvals', 'rolePermissionSets', 'profilePreferences', 'brandColor', 'brandName', 'brandLogoDataUrl', 'brandLogoName', 'connectionState', 'activeRouteId', 'centers', 'pendingChanges', 'versions', 'selectedPlan'];
    const self = this as unknown as Record<string, unknown>;
    for (const key of keys) if (data[key] !== undefined) self[key] = data[key];
    this.applyBrand();
    if (this.activeRouteId && !this.routes.some((route) => route.id === this.activeRouteId)) this.activeRouteId = null;
    void this.refreshRoute();
  }

  private persist(): void {
    if (!this.hasStorage) return;
    queueMicrotask(() => { try { this.appRef.tick(); } catch { /* ciclo en curso */ } });
    try {
      localStorage.setItem('enruta.accounts', JSON.stringify(this.accounts));
      if (this.account) {
        const keys = ['centerName', 'parameterSets', 'settingsModules', 'deliveryFields', 'formsData', 'settlements', 'products', 'clients', 'routes', 'users', 'priceLists', 'promotions', 'discounts', 'devices', 'notifications', 'auditEvents', 'approvals', 'rolePermissionSets', 'profilePreferences', 'brandColor', 'brandName', 'brandLogoDataUrl', 'brandLogoName', 'connectionState', 'activeRouteId', 'centers', 'pendingChanges', 'versions', 'selectedPlan'];
        const self = this as unknown as Record<string, unknown>;
        const snapshot: Record<string, unknown> = {};
        for (const key of keys) snapshot[key] = self[key];
        localStorage.setItem(this.dataKey, JSON.stringify(snapshot));
      }
    } catch { this.toastKind = 'error'; this.toast = 'No hay espacio de almacenamiento local suficiente. Reduce el tamaño de las imágenes.'; }
  }

  get account(): Account | null { return this.accounts.find((item) => item.id === this.currentId) ?? null; }
  get displayName(): string { return this.account?.name || this.account?.email || 'Cuenta'; }
  get initials(): string { return (this.account?.name || this.account?.email || 'U').trim().slice(0, 1).toUpperCase(); }
  get roleName(): string { return this.account?.role ?? 'Sin rol'; }

  private async hash(password: string, salt: string): Promise<string> {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100_000, hash: 'SHA-256' }, key, 256);
    return Array.from(new Uint8Array(bits)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private newSalt(): string { return Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, '0')).join(''); }

  private validPassword(value: string): boolean { return value.length >= 12 && /[A-Z]/.test(value) && /[0-9]/.test(value); }
  private validEmail(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

  private async createAccount(data: { email: string; name: string; phone: string; role: string; company: string; password: string }): Promise<Account> {
    const salt = this.newSalt();
    const account: Account = {
      id: Date.now() + Math.floor(Math.random() * 1000), email: data.email.trim().toLowerCase(), name: data.name.trim(), phone: data.phone.trim(),
      role: data.role, photo: '', salt, hash: await this.hash(data.password, salt), company: data.company, totpSecret: '', lastLogin: '', createdAt: new Date().toISOString(),
    };
    this.accounts = [...this.accounts, account];
    return account;
  }



  async sendVerification(): Promise<void> {
    const account = this.accounts.find((item) => item.id === this.pendingAccountId);
    if (!account) { this.authView = 'login'; this.fail('Primero inicia sesión con tu correo y contraseña.'); return; }
    if (await this.verifyTotp(account.totpSecret, this.verificationCode.trim())) { this.pendingAccountId = null; this.startSession(account); }
    else this.fail('Código incorrecto o vencido.');
  }

  openAuth(view: AuthView): void {
    if (view === 'verify' && !this.pendingAccountId && !this.authenticated) { this.fail('La verificación en dos pasos se solicita después de ingresar tu contraseña.'); return; }
    if (view === 'verify' && this.authenticated) { this.openTotpSetup(); return; }
    this.authView = view;
    if (view === 'register') this.registrationStep = 1;
  }

  async continueRegistration(): Promise<void> {
    const r = this.reg;
    if (this.registrationStep === 1) {
      if (!r.company.trim() || !r.adminName.trim()) { this.fail('Completa la razón social y el nombre del administrador.'); return; }
      if (!this.validEmail(r.adminEmail.trim())) { this.fail('Escribe un correo válido.'); return; }
      if (this.accounts.some((item) => item.email === r.adminEmail.trim().toLowerCase())) { this.fail('Ya existe una cuenta con ese correo.'); return; }
      if (!this.validPassword(r.password)) { this.fail('La contraseña necesita 12 caracteres, una mayúscula y un número.'); return; }
      if (r.password !== r.confirm) { this.fail('Las contraseñas no coinciden.'); return; }
      this.registrationStep = 2; this.authView = 'plan';
      return;
    }
    if (!this.selectedPlan) { this.fail('Elige un plan.'); return; }
    const account = await this.createAccount({ email: r.adminEmail, name: r.adminName, phone: r.phone, role: 'Administrador', company: r.company.trim(), password: r.password });
    this.registeredCompany = r.company.trim();
    const modules = this.settingsModules.map((m) => ({ ...m, enabled: !!this.planModules[m.name] }));
    localStorage.setItem(`enruta.data.${account.company.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, JSON.stringify({ settingsModules: modules, selectedPlan: this.selectedPlan, users: [{ id: account.id, name: account.name, detail: 'Administrador', status: 'Activo', email: account.email, role: 'Administrador' }] }));
    this.persist();
    this.email = account.email;
    this.reg = { company: '', rfc: '', industry: '', country: '', timezone: '', adminName: '', adminEmail: '', phone: '', password: '', confirm: '' };
    this.authView = 'submitted';
  }

  async sendRecovery(): Promise<void> {
    const email = this.email.trim().toLowerCase();
    if (!this.validEmail(email)) { this.fail('Escribe un correo válido.'); return; }
    const account = this.accounts.find((item) => item.email === email);
    if (account) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const codes = this.read<Record<string, { code: string; expires: number }>>('enruta.recovery', {});
      codes[email] = { code, expires: Date.now() + 30 * 60_000 };
      localStorage.setItem('enruta.recovery', JSON.stringify(codes));
      this.notify(`Modo local (sin servidor de correo): tu código de recuperación es ${code}. Vence en 30 minutos.`);
      this.authView = 'reset';
    } else this.notify('Si la dirección existe, recibirás instrucciones para recuperar el acceso.');
  }

  async saveNewPassword(): Promise<void> {
    const email = this.email.trim().toLowerCase();
    const codes = this.read<Record<string, { code: string; expires: number }>>('enruta.recovery', {});
    const entry = codes[email];
    const account = this.accounts.find((item) => item.email === email);
    if (!account || !entry || entry.code !== this.resetCode.trim() || entry.expires < Date.now()) { this.fail('Correo o código de recuperación inválido o vencido.'); return; }
    if (!this.validPassword(this.newPassword) || this.newPassword !== this.confirmPassword) { this.fail('Usa al menos 12 caracteres, una mayúscula, un número y confirma la misma contraseña.'); return; }
    account.salt = this.newSalt(); account.hash = await this.hash(this.newPassword, account.salt);
    delete codes[email]; localStorage.setItem('enruta.recovery', JSON.stringify(codes));
    this.persist();
    this.newPassword = ''; this.confirmPassword = ''; this.resetCode = '';
    this.notify('Contraseña actualizada. Ya puedes iniciar sesión.');
    this.authView = 'login';
  }


  // ======================= Permisos por rol =======================
  canAccess(view: View): boolean {
    const role = this.account?.role ?? 'Administrador';
    if (role === 'Administrador') return true;
    const restricted: View[] = role === 'Supervisor'
      ? ['users', 'integrations', 'brand', 'configuration', 'publish', 'audit']
      : ['users', 'integrations', 'brand', 'configuration', 'publish', 'audit', 'parameters', 'forms', 'settlements', 'reports', 'devices', 'approvals', 'import'];
    return !restricted.includes(view);
  }

  navigate(view: View): void {
    if (!this.canAccess(view)) { this.fail('Tu rol no tiene permiso para ver esta sección.'); return; }
    this.view = view; this.searchTerm = ''; this.activeClient = null; this.selectedDevice = null;
    if (view === 'planner') void this.refreshRoute();
  }

  selectRole(role: string): void {
    this.selectedRole = role;
    this.rolePermissions = (this.rolePermissionSets[role] ?? this.rolePermissions.map((p) => ({ name: p.name, enabled: false }))).map((p) => ({ ...p }));
  }

  savePermissions(): void {
    if (!this.selectedRole) { this.fail('Selecciona un rol antes de guardar sus permisos.'); return; }
    this.rolePermissionSets[this.selectedRole] = this.rolePermissions.map((p) => ({ ...p }));
    this.savedPermissions = true;
    this.addAuditEvent(`Guardó permisos del rol ${this.selectedRole}`);
    this.notify('Permisos guardados.');
  }

  // ======================= Perfil =======================
  startProfileEdit(): void {
    const a = this.account; if (!a) return;
    this.profileDraft = { name: a.name, phone: a.phone, email: a.email, currentPassword: '' };
    this.profileEditing = true;
  }

  cancelProfileEdit(): void { this.profileEditing = false; }

  async saveProfile(): Promise<void> {
    const a = this.account; if (!a) return;
    const d = this.profileDraft; const email = d.email.trim().toLowerCase();
    if (!d.name.trim()) { this.fail('El nombre no puede estar vacío.'); return; }
    if (!this.validEmail(email)) { this.fail('Escribe un correo válido.'); return; }
    if (email !== a.email) {
      if (this.accounts.some((item) => item.email === email)) { this.fail('Ese correo ya está en uso.'); return; }
      if (!d.currentPassword || await this.hash(d.currentPassword, a.salt) !== a.hash) { this.fail('Para cambiar el correo confirma tu contraseña actual.'); return; }
    }
    const oldEmail = a.email;
    a.name = d.name.trim(); a.phone = d.phone.trim(); a.email = email;
    const user = this.users.find((item) => item.email === oldEmail || item.id === a.id);
    if (user) { user.name = a.name; user.email = email; }
    this.email = email; this.profileEditing = false;
    this.addAuditEvent('Actualizó los datos de su perfil');
    this.notify('Perfil actualizado.');
  }

  setProfilePhoto(event: Event): void {
    const input = event.target as HTMLInputElement; const file = input.files?.[0]; const a = this.account;
    if (!file || !a) return;
    if (!file.type.startsWith('image/')) { this.notify('Selecciona un archivo de imagen.'); input.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { this.notify('La foto no debe superar 5 MB.'); input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256; const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        a.photo = canvas.toDataURL('image/jpeg', 0.85);
        this.addAuditEvent('Cambió su foto de perfil'); this.notify('Foto de perfil actualizada.'); input.value = '';
      };
      img.onerror = () => this.notify('No se pudo leer la imagen.');
      img.src = String(reader.result);
    };
    reader.onerror = () => this.notify('No se pudo leer la imagen.');
    reader.readAsDataURL(file);
  }

  removeProfilePhoto(): void {
    const a = this.account; if (!a || !a.photo) return;
    a.photo = ''; this.addAuditEvent('Eliminó su foto de perfil'); this.notify('Foto eliminada.');
  }

  openPasswordDialog(): void { this.passwordForm = { current: '', next: '', confirm: '' }; this.showPasswordDialog = true; }

  async changePassword(): Promise<void> {
    const a = this.account; const f = this.passwordForm; if (!a) return;
    if (await this.hash(f.current, a.salt) !== a.hash) { this.fail('La contraseña actual es incorrecta.'); return; }
    if (!this.validPassword(f.next)) { this.fail('La nueva contraseña necesita 12 caracteres, una mayúscula y un número.'); return; }
    if (f.next !== f.confirm) { this.fail('La confirmación no coincide.'); return; }
    if (f.next === f.current) { this.fail('Elige una contraseña distinta a la actual.'); return; }
    a.salt = this.newSalt(); a.hash = await this.hash(f.next, a.salt);
    this.showPasswordDialog = false; this.passwordForm = { current: '', next: '', confirm: '' };
    this.addAuditEvent('Cambió su contraseña'); this.notify('Contraseña actualizada.');
  }

  saveProfilePreferences(): void { this.addAuditEvent('Actualizó preferencias de notificación'); this.notify('Preferencias guardadas.'); }

  // ---- verificación en dos pasos (TOTP) ----
  openTotpSetup(): void {
    const a = this.account; if (!a) return;
    this.totpCode = '';
    if (!a.totpSecret) { const bytes = crypto.getRandomValues(new Uint8Array(20)); this.totpSecretDraft = this.base32Encode(bytes); } else this.totpSecretDraft = '';
    this.showTotpDialog = true;
  }

  async confirmTotp(): Promise<void> {
    const a = this.account; if (!a) return;
    if (!await this.verifyTotp(this.totpSecretDraft, this.totpCode.trim())) { this.fail('Código incorrecto. Revisa tu app de autenticación.'); return; }
    a.totpSecret = this.totpSecretDraft; this.showTotpDialog = false;
    this.addAuditEvent('Activó la verificación en dos pasos'); this.notify('Verificación en dos pasos activada.');
  }

  async disableTotp(): Promise<void> {
    const a = this.account; if (!a) return;
    if (!await this.verifyTotp(a.totpSecret, this.totpCode.trim())) { this.fail('Escribe un código válido para desactivar.'); return; }
    a.totpSecret = ''; this.showTotpDialog = false;
    this.addAuditEvent('Desactivó la verificación en dos pasos'); this.notify('Verificación en dos pasos desactivada.');
  }

  get otpauthUri(): string { return `otpauth://totp/EnRuta:${encodeURIComponent(this.account?.email ?? '')}?secret=${this.totpSecretDraft}&issuer=EnRuta`; }

  private base32Encode(bytes: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = 0; let value = 0; let out = '';
    for (const byte of bytes) { value = (value << 8) | byte; bits += 8; while (bits >= 5) { out += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; } }
    if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
    return out;
  }

  private base32Decode(text: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = 0; let value = 0; const out: number[] = [];
    for (const char of text.toUpperCase().replace(/=+$/, '')) { const idx = alphabet.indexOf(char); if (idx < 0) continue; value = (value << 5) | idx; bits += 5; if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; } }
    return new Uint8Array(out);
  }

  private async totpAt(secret: string, counter: number): Promise<string> {
    const key = await crypto.subtle.importKey('raw', this.base32Decode(secret) as BufferSource, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const buffer = new ArrayBuffer(8); const view = new DataView(buffer);
    view.setUint32(0, Math.floor(counter / 2 ** 32)); view.setUint32(4, counter >>> 0);
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, buffer));
    const offset = sig[19] & 15;
    const code = (((sig[offset] & 0x7f) << 24) | (sig[offset + 1] << 16) | (sig[offset + 2] << 8) | sig[offset + 3]) % 1_000_000;
    return String(code).padStart(6, '0');
  }

  private async verifyTotp(secret: string, code: string): Promise<boolean> {
    if (!/^\d{6}$/.test(code) || !secret) return false;
    const step = Math.floor(Date.now() / 30_000);
    for (const delta of [-1, 0, 1]) if (await this.totpAt(secret, step + delta) === code) return true;
    return false;
  }

  // ======================= CRUD genérico =======================
  private listFor(kind: RecordKind): SimpleRecord[] {
    return { producto: this.products, cliente: this.clients, ruta: this.routes, usuario: this.users, lista: this.priceLists, promocion: this.promotions, descuento: this.discounts, dispositivo: this.devices, liquidacion: this.settlements }[kind];
  }

  private setList(kind: RecordKind, list: SimpleRecord[]): void {
    switch (kind) {
      case 'producto': this.products = list; break; case 'cliente': this.clients = list; break; case 'ruta': this.routes = list; break;
      case 'usuario': this.users = list; break; case 'lista': this.priceLists = list; break; case 'promocion': this.promotions = list; break;
      case 'descuento': this.discounts = list; break; case 'dispositivo': this.devices = list; break; case 'liquidacion': this.settlements = list; break;
    }
  }

  openCreate(kind: RecordKind): void {
    this.modalKind = kind; this.editingId = null;
    this.draftName = ''; this.draftDetail = ''; this.draftCode = ''; this.draftCategory = ''; this.draftPhone = ''; this.draftLat = ''; this.draftLng = '';
    this.draftPrice = ''; this.draftEmail = ''; this.draftRole = 'Repartidor'; this.draftDay = 'Lunes'; this.draftOperator = ''; this.draftPassword = ''; this.draftDeposit = ''; this.draftDate = new Date().toISOString().slice(0, 10);
    this.draftColor = this.routeColors[this.routes.length % this.routeColors.length];
    this.draftStatus = kind === 'ruta' ? 'Borrador' : 'Activo';
  }

  openEdit(kind: RecordKind, record: SimpleRecord): void {
    this.openCreate(kind);
    this.editingId = record.id; this.draftName = record.name; this.draftDetail = record.detail; this.draftStatus = record.status;
    this.draftCode = record.code ?? ''; this.draftCategory = record.category ?? ''; this.draftPhone = record.phone ?? '';
    this.draftLat = record.lat !== undefined ? String(record.lat) : ''; this.draftLng = record.lng !== undefined ? String(record.lng) : '';
    this.draftPrice = record.price !== undefined ? String(record.price) : ''; this.draftEmail = record.email ?? ''; this.draftRole = record.role ?? 'Repartidor';
    this.draftDay = record.day ?? 'Lunes'; this.draftColor = record.color ?? '#1769aa'; this.draftOperator = record.operatorId ? String(record.operatorId) : '';
    if (kind === 'ruta') this.draftDetail = '';
    if (kind === 'liquidacion') { this.draftOperator = String(record.refId ?? ''); this.draftPrice = String(record.collected ?? ''); this.draftDeposit = String(record.deposited ?? ''); this.draftDate = record.date ?? ''; }
  }

  closeModal(): void {
    this.modalKind = ''; this.editingId = null; this.showIntegrationForm = false; this.showPasswordDialog = false; this.showContextDialog = false; this.showTotpDialog = false;
  }

  async geocodeDraft(): Promise<void> {
    const result = await this.mapbox.geocode(this.draftDetail || this.draftName);
    if (!result) { this.fail('No se encontró esa dirección. Escribe calle, número y ciudad.'); return; }
    this.draftLat = result.lat.toFixed(6); this.draftLng = result.lng.toFixed(6); this.draftDetail = this.draftDetail || result.place;
    this.notify('Ubicación encontrada.');
  }

  async saveRecord(): Promise<void> {
    const kind = this.modalKind; const name = this.draftName.trim() || (this.modalKind === 'liquidacion' ? 'Liquidación' : '');
    if (!kind) return;
    if (!name) { this.fail('Escribe un nombre antes de guardar.'); return; }
    const list = this.listFor(kind);
    const existing = this.editingId !== null ? list.find((item) => item.id === this.editingId) : undefined;
    const rec: SimpleRecord = existing ? { ...existing } : { id: Date.now(), name, detail: '', status: 'Activo' };
    rec.name = name; rec.detail = this.draftDetail.trim(); rec.status = this.draftStatus || rec.status;
    switch (kind) {
      case 'producto': {
        rec.code = this.draftCode.trim(); rec.category = this.draftCategory.trim();
        const price = this.draftPrice.trim() === '' ? undefined : Number(this.draftPrice);
        if (price !== undefined && (!Number.isFinite(price) || price < 0)) { this.fail('El precio debe ser un número positivo.'); return; }
        rec.price = price;
        if (rec.code && this.products.some((p) => p.id !== rec.id && p.code === rec.code)) { this.fail('Ya existe un producto con esa clave.'); return; }
        break;
      }
      case 'cliente': {
        rec.phone = this.draftPhone.trim();
        let lat = this.draftLat.trim() === '' ? NaN : Number(this.draftLat); let lng = this.draftLng.trim() === '' ? NaN : Number(this.draftLng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          const found = rec.detail ? await this.mapbox.geocode(rec.detail) : null;
          if (found) { lat = found.lat; lng = found.lng; }
        }
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          if (Math.abs(lat) > 90 || Math.abs(lng) > 180) { this.fail('Coordenadas fuera de rango.'); return; }
          rec.lat = lat; rec.lng = lng;
        } else { rec.lat = undefined; rec.lng = undefined; }
        break;
      }
      case 'ruta': {
        rec.operatorId = this.draftOperator ? Number(this.draftOperator) : undefined; rec.day = this.draftDay; rec.color = this.draftColor;
        rec.stopIds = rec.stopIds ?? [];
        const operator = this.users.find((u) => u.id === rec.operatorId);
        rec.detail = `${operator ? operator.name : 'Sin operador asignado'} · ${rec.day}`;
        if (this.routes.some((r) => r.id !== rec.id && r.name.toLowerCase() === name.toLowerCase())) { this.fail('Ya existe una ruta con ese nombre.'); return; }
        break;
      }
      case 'usuario': {
        const email = this.draftEmail.trim().toLowerCase();
        if (!this.validEmail(email)) { this.fail('Escribe un correo válido para el usuario.'); return; }
        const taken = this.accounts.find((a) => a.email === email && a.id !== rec.id);
        if (taken) { this.fail('Ese correo ya pertenece a otra cuenta.'); return; }
        rec.email = email; rec.role = this.draftRole; rec.detail = this.draftRole;
        if (!existing) {
          if (!this.validPassword(this.draftPassword)) { this.fail('La contraseña temporal necesita 12 caracteres, una mayúscula y un número.'); return; }
          const account = await this.createAccount({ email, name, phone: '', role: this.draftRole, company: this.companyName, password: this.draftPassword });
          rec.id = account.id;
        } else {
          const account = this.accounts.find((a) => a.id === rec.id);
          if (account) { account.email = email; account.name = name; account.role = this.draftRole; }
        }
        break;
      }
      case 'liquidacion': {
        const route = this.routes.find((r) => r.id === Number(this.draftOperator));
        if (!route) { this.fail('Selecciona la ruta a liquidar.'); return; }
        const collected = Number(this.draftPrice); const deposited = Number(this.draftDeposit);
        if (!Number.isFinite(collected) || collected < 0 || this.draftPrice === '') { this.fail('Escribe el monto cobrado (número positivo).'); return; }
        if (!Number.isFinite(deposited) || deposited < 0 || this.draftDeposit === '') { this.fail('Escribe el monto depositado (número positivo).'); return; }
        rec.refId = route.id; rec.collected = collected; rec.deposited = deposited; rec.date = this.draftDate || new Date().toISOString().slice(0, 10);
        rec.name = route.name; rec.detail = `${rec.date} · ${route.detail}`;
        const diff = deposited - collected; const tol = Number(this.companyParameters['cashTolerance'] || 0);
        rec.status = Math.abs(diff) === 0 ? 'Conciliada' : Math.abs(diff) <= tol ? 'Dentro de tolerancia' : 'Con diferencia';
        if (rec.status === 'Con diferencia') this.addNotification('Diferencia de efectivo', `${route.name}: ${diff.toFixed(2)} MXN`, 'Críticas');
        break;
      }
      default: break;
    }
    this.setList(kind, existing ? list.map((item) => (item.id === rec.id ? rec : item)) : [...list, rec]);
    this.modalKind = ''; this.editingId = null;
    this.addAuditEvent(`${existing ? 'Editó' : 'Creó'} ${kind}: ${name}`);
    if (kind === 'usuario') this.userFilter = 'Todos';
    if (kind === 'usuario' && !existing) this.addNotification('Nuevo usuario', `${name} se agregó como ${rec.role}.`, 'Sistema');
    if (kind === 'ruta' && this.activeRouteId === null) this.activeRouteId = rec.id;
    if (this.activeClient?.id === rec.id) this.activeClient = rec;
    if (kind === 'ruta' || kind === 'cliente') void this.refreshRoute();
    this.notify(`${this.kindLabel(kind)} ${existing ? 'actualizado' : 'creado'}.`);
  }

  deleteRecord(kind: RecordKind, record: SimpleRecord): void {
    if (kind === 'usuario' && record.id === this.currentId) { this.fail('No puedes eliminar tu propia cuenta.'); return; }
    if (typeof window !== 'undefined' && !window.confirm(`¿Eliminar ${this.kindLabel(kind).toLowerCase()} “${record.name}”? Esta acción no se puede deshacer.`)) return;
    this.setList(kind, this.listFor(kind).filter((item) => item.id !== record.id));
    if (kind === 'cliente') { this.routes = this.routes.map((r) => ({ ...r, stopIds: (r.stopIds ?? []).filter((id) => id !== record.id) })); if (this.activeClient?.id === record.id) this.activeClient = null; }
    if (kind === 'usuario') { this.accounts = this.accounts.filter((a) => a.id !== record.id); this.routes = this.routes.map((r) => (r.operatorId === record.id ? { ...r, operatorId: undefined, detail: `Sin operador asignado · ${r.day ?? ''}` } : r)); }
    if (kind === 'ruta') { this.approvals = this.approvals.filter((a) => a.refId !== record.id); if (this.activeRouteId === record.id) this.activeRouteId = this.routes[0]?.id ?? null; }
    if (kind === 'dispositivo' && this.selectedDevice?.id === record.id) this.selectedDevice = null;
    this.addAuditEvent(`Eliminó ${kind}: ${record.name}`);
    this.notify(`${this.kindLabel(kind)} eliminado.`);
    void this.refreshRoute();
  }

  toggleStatus(kind: RecordKind, record: SimpleRecord): void {
    const next = record.status === 'Activo' ? 'Inactivo' : 'Activo';
    this.setList(kind, this.listFor(kind).map((item) => (item.id === record.id ? { ...item, status: next } : item)));
    if (this.selectedDevice?.id === record.id) this.selectedDevice = { ...record, status: next };
    this.addAuditEvent(`${next === 'Activo' ? 'Activó' : 'Desactivó'} ${kind}: ${record.name}`);
    this.notify(`${record.name}: ${next.toLowerCase()}.`);
  }

  kindLabel(kind: RecordKind): string {
    return { producto: 'Producto', cliente: 'Cliente', ruta: 'Ruta', usuario: 'Usuario', lista: 'Lista de precios', promocion: 'Promoción', descuento: 'Descuento', dispositivo: 'Dispositivo', liquidacion: 'Liquidación' }[kind];
  }

  get filteredUsers(): SimpleRecord[] { return this.users.filter((u) => this.userFilter === 'Todos' || u.role === this.userFilter); }

  syncDevice(device: SimpleRecord): void {
    const detail = `Sincronizado ${new Date().toLocaleString('es-MX')}`;
    this.devices = this.devices.map((d) => (d.id === device.id ? { ...d, detail } : d));
    this.selectedDevice = { ...device, detail };
    this.addAuditEvent(`Sincronizó el dispositivo ${device.name}`); this.notify('Dispositivo sincronizado.');
  }

  // ======================= Clientes y ubicación =======================
  setClientLocation(point: { lat: number; lng: number }, client: SimpleRecord | null = this.activeClient): void {
    if (!client) return;
    const updated = { ...client, lat: point.lat, lng: point.lng };
    this.clients = this.clients.map((c) => (c.id === client.id ? updated : c));
    if (this.activeClient?.id === client.id) this.activeClient = updated;
    this.addAuditEvent(`Actualizó la ubicación de ${client.name}`);
    this.notify('Ubicación del cliente guardada.'); this.persist();
    void this.refreshRoute();
  }

  async geocodeClient(client: SimpleRecord): Promise<void> {
    if (!client.detail) { this.fail('Agrega la dirección del cliente para ubicarlo.'); return; }
    const result = await this.mapbox.geocode(client.detail);
    if (!result) { this.fail('No se encontró la dirección. Edítala o toca el mapa para ubicarlo.'); return; }
    this.setClientLocation({ lat: result.lat, lng: result.lng }, client);
  }

  get clientsWithoutLocation(): number { return this.clients.filter((c) => c.lat === undefined).length; }

  // ======================= Rutas y mapa =======================
  get activeRoute(): SimpleRecord | null { return this.routes.find((r) => r.id === this.activeRouteId) ?? null; }

  get routeStops(): SimpleRecord[] {
    const route = this.activeRoute; if (!route) return [];
    return (route.stopIds ?? []).map((id) => this.clients.find((c) => c.id === id)).filter((c): c is SimpleRecord => !!c);
  }

  stopsOf(route: SimpleRecord): SimpleRecord[] {
    return (route.stopIds ?? []).map((id) => this.clients.find((c) => c.id === id)).filter((c): c is SimpleRecord => !!c);
  }

  get availableClients(): SimpleRecord[] {
    const taken = new Set(this.activeRoute?.stopIds ?? []);
    return this.clients.filter((c) => !taken.has(c.id) && c.status === 'Activo');
  }

  get plannerMarkers(): {
    id: number; label: string; lat: number; lng: number; color: string; order: number;
    role: 'start' | 'stop' | 'destination'; detail: string; status: string;
  }[] {
    const color = this.activeRoute?.color ?? '#1769aa';
    return this.routeStops.map((s, i) => ({ s, i })).filter(({ s }) => s.lat !== undefined && s.lng !== undefined)
      .map(({ s, i }) => ({
        id: s.id,
        label: s.name,
        lat: s.lat as number,
        lng: s.lng as number,
        color,
        order: i + 1,
        role: i === 0 ? 'start' as const : i === this.routeStops.length - 1 ? 'destination' as const : 'stop' as const,
        detail: s.detail,
        status: s.status,
      }));
  }

  get plannerLines(): { color: string; coords: number[][] }[] {
    return this.routeMetrics.geometry.length > 1 ? [{ color: '#4f35d5', coords: this.routeMetrics.geometry }] : [];
  }

  get overviewMarkers(): {
    id: number; label: string; lat: number; lng: number; color: string; order: number;
    role: 'start' | 'stop' | 'destination'; detail: string; status: string;
  }[] {
    const out: {
      id: number; label: string; lat: number; lng: number; color: string; order: number;
      role: 'start' | 'stop' | 'destination'; detail: string; status: string;
    }[] = [];
    for (const route of this.routes.filter((r) => r.status !== 'Inactiva')) {
      const stops = this.stopsOf(route);
      stops.forEach((stop, index) => {
        if (stop.lat === undefined || stop.lng === undefined) return;
        out.push({
          id: route.id * 1_000_000 + (stop.id % 1_000_000),
          label: `${route.name} · ${stop.name}`,
          lat: stop.lat,
          lng: stop.lng,
          color: route.color ?? '#1769aa',
          order: index + 1,
          role: index === 0 ? 'start' : index === stops.length - 1 ? 'destination' : 'stop',
          detail: stop.detail,
          status: stop.status,
        });
      });
    }
    return out;
  }

  get overviewLines(): { color: string; coords: number[][] }[] {
    return this.routes.filter((route) => route.status !== 'Inactiva').flatMap((route) => {
      const geometry = this.overviewGeometries.get(route.id);
      return geometry?.coords.length
        ? [{ color: '#4f35d5', coords: geometry.coords }]
        : [];
    });
  }

  async refreshOverviewRoutes(): Promise<void> {
    const activeRoutes = this.routes.filter((route) => route.status !== 'Inactiva');
    const activeRouteIds = new Set(activeRoutes.map((route) => route.id));
    for (const id of this.overviewGeometries.keys()) {
      if (!activeRouteIds.has(id)) this.overviewGeometries.delete(id);
    }

    await Promise.all(activeRoutes.map(async (route) => {
      const points = this.stopsOf(route)
        .filter((stop) => stop.lat !== undefined && stop.lng !== undefined)
        .map((stop) => ({ lat: stop.lat as number, lng: stop.lng as number }));
      if (points.length < 2) {
        this.overviewGeometries.delete(route.id);
        return;
      }

      const signature = JSON.stringify(points);
      const cached = this.overviewGeometries.get(route.id);
      if (cached?.signature === signature || this.pendingOverviewRoutes.get(route.id) === signature) return;
      if (cached) this.overviewGeometries.delete(route.id);

      this.pendingOverviewRoutes.set(route.id, signature);
      const result = await this.mapbox.directions(points);
      if (this.pendingOverviewRoutes.get(route.id) === signature) this.pendingOverviewRoutes.delete(route.id);

      const currentRoute = this.routes.find((item) => item.id === route.id && item.status !== 'Inactiva');
      const currentPoints = currentRoute
        ? this.stopsOf(currentRoute)
          .filter((stop) => stop.lat !== undefined && stop.lng !== undefined)
          .map((stop) => ({ lat: stop.lat as number, lng: stop.lng as number }))
        : [];
      if (JSON.stringify(currentPoints) !== signature || !result || result.estimated || result.geometry.length < 2) return;

      this.overviewGeometries.set(route.id, { signature, coords: result.geometry });
    }));
  }

  selectRoute(id: number | string | null): void {
    this.activeRouteId = id ? Number(id) : null;
    this.persist();
    void this.refreshRoute();
  }

  openRoute(route: SimpleRecord): void { this.selectRoute(route.id); this.navigate('planner'); }

  duplicateRoute(route: SimpleRecord): void {
    const copy: SimpleRecord = { ...route, id: Date.now(), name: `${route.name} (copia)`, status: 'Borrador', stopIds: [...(route.stopIds ?? [])] };
    this.routes = [...this.routes, copy];
    this.addAuditEvent(`Duplicó la ruta ${route.name}`); this.notify('Ruta duplicada como borrador.');
  }

  async refreshRoute(): Promise<void> {
    const points = this.routeStops.filter((s) => s.lat !== undefined && s.lng !== undefined).map((s) => ({ lat: s.lat as number, lng: s.lng as number }));
    const routeId = this.activeRouteId;
    if (points.length < 2) { this.routeMetrics = { distanceKm: 0, durationMin: 0, geometry: [], estimated: false, loading: false }; return; }
    this.routeMetrics = { ...this.routeMetrics, loading: true };
    const result = await this.mapbox.directions(points);
    if (routeId !== this.activeRouteId || !result) return;
    this.routeMetrics = { distanceKm: result.distanceKm, durationMin: result.durationMin, geometry: result.geometry, estimated: result.estimated, loading: false };
  }

  private updateActiveStops(ids: number[]): void {
    const route = this.activeRoute; if (!route) return;
    this.routes = this.routes.map((r) => (r.id === route.id ? { ...r, stopIds: ids, status: r.status === 'Publicada' ? 'Borrador' : r.status } : r));
    this.persist();
    void this.refreshRoute();
  }

  addRouteStop(client: SimpleRecord): void {
    const route = this.activeRoute;
    if (!route) { this.fail('Selecciona o crea una ruta antes de agregar paradas.'); return; }
    if ((route.stopIds ?? []).includes(client.id)) { this.fail('Este cliente ya está en la ruta.'); return; }
    if (client.lat === undefined) this.notify(`${client.name} no tiene ubicación; agrégalo y ubícalo en Clientes para verlo en el mapa.`);
    this.updateActiveStops([...(route.stopIds ?? []), client.id]);
  }

  removeRouteStop(clientId: number): void { this.updateActiveStops((this.activeRoute?.stopIds ?? []).filter((id) => id !== clientId)); }

  moveStop(index: number, delta: number): void {
    const ids = [...(this.activeRoute?.stopIds ?? [])]; const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    this.updateActiveStops(ids);
  }

  async optimizeRoute(): Promise<void> {
    const route = this.activeRoute;
    if (!route) { this.fail('Selecciona una ruta.'); return; }
    const stops = this.routeStops;
    const located = stops.filter((s) => s.lat !== undefined && s.lng !== undefined);
    if (located.length < 3) { this.fail('Se necesitan al menos 3 paradas con ubicación para optimizar.'); return; }
    const order = await this.mapbox.optimize(located.map((s) => ({ lat: s.lat as number, lng: s.lng as number })));
    const sorted = order.map((i) => located[i].id);
    const unlocated = stops.filter((s) => s.lat === undefined).map((s) => s.id);
    this.updateActiveStops([...sorted, ...unlocated]);
    this.addAuditEvent(`Optimizó la secuencia de ${route.name}`); this.notify('Secuencia optimizada con Mapbox.');
  }

  saveRouteDraft(): void {
    if (!this.activeRoute) { this.fail('No hay una ruta seleccionada.'); return; }
    this.addAuditEvent(`Guardó el borrador de ${this.activeRoute.name} con ${this.routeStops.length} paradas`);
    this.notify('Borrador de ruta guardado.');
  }

  submitRoute(): void {
    const route = this.activeRoute;
    if (!route) { this.fail('Crea o selecciona una ruta para publicarla.'); return; }
    if (!route.operatorId) { this.fail('Asigna un operador a la ruta (editar ruta) antes de publicar.'); return; }
    if (!this.routeStops.length) { this.fail('Agrega clientes a la ruta desde el planeador antes de publicarla.'); return; }
    if (route.status === 'Pendiente de aprobación') { this.fail('Esta ruta ya está esperando aprobación.'); return; }
    this.routes = this.routes.map((r) => (r.id === route.id ? { ...r, status: 'Pendiente de aprobación' } : r));
    this.approvals = [...this.approvals, { id: Date.now(), name: `Publicar ruta ${route.name}`, detail: `${this.routeStops.length} paradas · ${route.detail}`, status: 'Pendiente', refId: route.id }];
    this.addNotification('Aprobación pendiente', `La ruta ${route.name} espera autorización.`, 'Aprobaciones');
    this.addAuditEvent(`Solicitó publicar la ruta ${route.name} (${this.routeStops.length} paradas)`);
    this.notify('Ruta enviada a aprobación.');
  }

  approve(item: SimpleRecord): void {
    this.approvals = this.approvals.filter((a) => a.id !== item.id);
    if (item.refId) this.routes = this.routes.map((r) => (r.id === item.refId ? { ...r, status: 'Publicada' } : r));
    this.addAuditEvent(`Aprobó: ${item.name}`); this.notify('Solicitud aprobada.');
  }

  reject(item: SimpleRecord): void {
    this.approvals = this.approvals.filter((a) => a.id !== item.id);
    if (item.refId) this.routes = this.routes.map((r) => (r.id === item.refId ? { ...r, status: 'Borrador' } : r));
    this.addAuditEvent(`Rechazó: ${item.name}`); this.notify('Solicitud rechazada.');
  }

  get routeStatusCounts(): { published: number; pending: number; draft: number } {
    return { published: this.routes.filter((r) => r.status === 'Publicada').length, pending: this.routes.filter((r) => r.status === 'Pendiente de aprobación').length, draft: this.routes.filter((r) => r.status === 'Borrador').length };
  }

  get totalStops(): number { return this.routes.reduce((sum, r) => sum + (r.stopIds?.length ?? 0), 0); }

  // ======================= Contexto, configuración y exportaciones =======================
  switchContext(): void {
    const selected = this.centerName.trim();
    if (!selected) { this.fail('Escribe el nombre del centro al que quieres cambiar.'); return; }
    if (!this.centers.includes(selected)) this.centers = [...this.centers, selected];
    this.showContextDialog = false;
    this.addAuditEvent(`Cambió el contexto al centro ${selected}`);
    if (this.companyName.trim() && this.account && this.companyName.trim() !== this.account.company) { this.account.company = this.companyName.trim(); }
    this.notify(`Contexto actualizado: ${selected}.`);
  }

  saveConfiguration(): void {
    this.pendingChanges = [...new Set([...this.pendingChanges, 'Módulos, formularios o marca modificados'])];
    this.addAuditEvent('Guardó un borrador de configuración');
    this.notify('Borrador de configuración guardado.');
  }

  saveParameters(): void {
    this.pendingChanges = [...new Set([...this.pendingChanges, 'Parámetros operativos modificados'])];
    this.addAuditEvent('Guardó parámetros del centro');
    this.notify('Parámetros guardados como borrador.');
  }

  publishConfiguration(): void {
    if (!this.pendingChanges.length) { this.fail('No hay cambios pendientes por publicar. Guarda un borrador primero.'); return; }
    const version: SimpleRecord = { id: Date.now(), name: `Versión ${this.versions.length + 1}`, detail: `${new Date().toLocaleString('es-MX')}${this.changeNote.trim() ? ' · ' + this.changeNote.trim() : ''}`, status: 'Publicada' };
    this.versions = [version, ...this.versions]; this.pendingChanges = []; this.changeNote = '';
    this.addNotification('Configuración publicada', `${version.name} se aplicará al sincronizar los dispositivos.`, 'Sistema');
    this.addAuditEvent(`Publicó ${version.name}`);
    this.notify('Configuración publicada. Se aplicará al sincronizar los dispositivos.');
    this.view = 'configuration';
  }

  toggleConnection(name: string): void {
    this.connectionState[name] = !this.connectionState[name];
    this.addAuditEvent(`${this.connectionState[name] ? 'Conectó' : 'Desconectó'} la integración ${name}`);
    this.notify(this.connectionState[name] ? `${name} conectado.` : `Se desconectó ${name}.`);
  }


  applyBrand(): void {
    if (typeof document === 'undefined') return;
    if (/^#[0-9a-fA-F]{6}$/.test(this.brandColor)) document.documentElement.style.setProperty('--blue', this.brandColor);
    else document.documentElement.style.removeProperty('--blue');
  }

  downloadCsv(filename: string, rows: (string | number | undefined)[][]): void {
    if (rows.length < 2) { this.fail('No hay información que exportar.'); return; }
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  exportAudit(): void {
    this.downloadCsv('bitacora.csv', [['Fecha', 'Usuario', 'Acción'], ...this.auditEvents.map((e) => [e.detail, e.email ?? '', e.name])]);
  }

  exportRoutes(): void {
    this.downloadCsv('rutas.csv', [['Ruta', 'Operador/Día', 'Estado', 'Paradas'], ...this.routes.map((r) => [r.name, r.detail, r.status, r.stopIds?.length ?? 0])]);
  }

  exportClients(): void {
    this.downloadCsv('clientes.csv', [['Nombre', 'Dirección', 'Teléfono', 'Latitud', 'Longitud', 'Estado'], ...this.clients.map((c) => [c.name, c.detail, c.phone, c.lat, c.lng, c.status])]);
  }

  addNotification(name: string, detail: string, status: string): void {
    this.notifications = [{ id: Date.now() + Math.floor(Math.random() * 999), name, detail, status }, ...this.notifications];
  }

  dismissNotification(id: number): void { this.notifications = this.notifications.filter((n) => n.id !== id); this.persist(); }

  markAllRead(): void { this.notifications = []; this.persist(); this.notify('No hay notificaciones pendientes.'); }

  private addAuditEvent(name: string): void {
    this.auditEvents = [{ id: Date.now() + Math.floor(Math.random() * 999), name, detail: new Date().toLocaleString('es-MX'), status: 'Registro', email: this.account?.email }, ...this.auditEvents].slice(0, 500);
    this.persist();
  }



  private init(): void {
    if (!this.hasStorage) return;
    this.accounts = this.read<Account[]>('enruta.accounts', []);
    const id = this.read<number | null>('enruta.session', null) ?? this.read<number | null>('enruta.session', null, sessionStorage);
    const sid = localStorage.getItem('enruta.sid') ?? sessionStorage.getItem('enruta.sid');
    const account = this.accounts.find((item) => item.id === id);
    if (account && (!account.sessions?.length || account.sessions.some((x) => x.id === sid))) {
      this.currentId = account.id; this.authenticated = true; this.loadCompanyData(account); this.watchActivity();
    }
  }

  private startSession(account: Account): void {
    account.lastLogin = new Date().toISOString(); account.failed = 0; account.lockedUntil = 0;
    this.currentId = account.id; this.authenticated = true; this.authView = 'login'; this.password = '';
    if (this.hasStorage) {
      for (const st of [localStorage, sessionStorage]) { st.removeItem('enruta.session'); st.removeItem('enruta.sid'); }
      (this.keepSession ? localStorage : sessionStorage).setItem('enruta.session', JSON.stringify(account.id));
    }
    this.newSession(account);
    this.loadCompanyData(account); this.lastActivity = Date.now(); this.watchActivity();
    this.view = 'dashboard';
    this.addAuditEvent('Inició sesión');
    this.notify(`Bienvenido, ${account.name || account.email}.`);
  }

  async login(): Promise<void> {
    const email = this.email.trim().toLowerCase();
    const account = this.accounts.find((item) => item.email === email);
    if (!email) { this.fail('Escribe tu correo electrónico.'); return; }
    if (!this.validEmail(email)) { this.fail('El correo electrónico no tiene un formato válido.'); return; }
    if (!this.password) { this.fail('Escribe tu contraseña.'); return; }
    if (account?.lockedUntil && account.lockedUntil > Date.now()) { this.fail(`Cuenta bloqueada por intentos fallidos. Intenta de nuevo en ${Math.ceil((account.lockedUntil - Date.now()) / 60000)} min o recupera tu contraseña.`); return; }
    if (!account || await this.hash(this.password, account.salt) !== account.hash) {
      if (account) {
        account.failed = (account.failed ?? 0) + 1;
        if (account.failed >= 5) { account.lockedUntil = Date.now() + 15 * 60_000; account.failed = 0; this.fail('Demasiados intentos. La cuenta se bloqueó 15 minutos.'); }
        else this.fail(`Correo o contraseña incorrectos. Intentos restantes: ${5 - account.failed}.`);
        this.persist();
      } else this.fail('Correo o contraseña incorrectos.');
      return;
    }
    if (account.totpSecret) { this.pendingAccountId = account.id; this.verificationCode = ''; this.authView = 'verify'; return; }
    this.startSession(account);
  }

  signOut(): void {
    const a = this.account;
    if (a) a.sessions = (a.sessions ?? []).filter((x) => x.id !== this.currentSessionId);
    this.persist();
    if (this.hasStorage) for (const st of [localStorage, sessionStorage]) { st.removeItem('enruta.session'); st.removeItem('enruta.sid'); }
    this.authenticated = false; this.currentId = null; this.authView = 'login'; this.password = '';
    this.profileEditing = false; this.closeModal(); this.toast = '';
  }

  // ======================= v2: toasts, seguridad, importación, formularios, marca, liquidaciones =======================
  toastKind: 'ok' | 'error' = 'ok';
  profileTab: 'general' | 'seguridad' | 'preferencias' | 'sesiones' = 'general';
  reportPeriod: '7' | '30' | '90' | 'all' = '30';
  activeForm: 'entrega' | 'cobro' | 'visita' = 'entrega';
  formsData: Record<string, DeliveryField[]> = {};
  selectedFieldId: number | null = null;
  formDirty = false;
  settlements: SimpleRecord[] = [];
  draftDeposit = '';
  draftDate = '';
  importMode: 'omitir' | 'actualizar' = 'omitir';
  importPreview: { row: number; cells: string[] }[] = [];
  importHeaders: string[] = [];
  importStats = { created: 0, updated: 0, skipped: 0, duplicates: 0 };
  importBusy = false;
  parameterScope: 'Empresa' | 'Centro' | 'Zona' | 'Ruta' | 'Usuario' = 'Empresa';
  parameterTarget = '';
  parameterSets: Record<string, Record<string, string>> = {};
  private lastActivity = Date.now();
  private idleTimer: ReturnType<typeof setInterval> | null = null;
  private readonly appRef = inject(ApplicationRef);
  readonly fieldTypes = ['Texto', 'Número', 'Fecha', 'Selección', 'Foto', 'Firma', 'Código de barras', 'Casilla'];
  readonly formLabels: Record<string, string> = { entrega: 'Entrega', cobro: 'Cobro', visita: 'Visita' };
  readonly parameterKeys = ['visitRadius', 'cashTolerance', 'overdueDays', 'loadingTime', 'minimumVersion'];

  get parameterValues(): Record<string, string> & { visitRadius: string; cashTolerance: string; overdueDays: string; loadingTime: string; minimumVersion: string } {
    const key = this.parameterScope === 'Empresa' ? 'Empresa' : `${this.parameterScope}:${this.parameterScope === 'Centro' ? this.centerName : this.parameterTarget}`;
    if (!this.parameterSets[key]) this.parameterSets[key] = { visitRadius: '', cashTolerance: '', overdueDays: '', loadingTime: '', minimumVersion: '' };
    return this.parameterSets[key] as never;
  }

  set parameterValues(value: Record<string, string>) { this.parameterSets['Empresa'] = { ...value }; }

  get companyParameters(): Record<string, string> { return this.parameterSets['Empresa'] ?? {}; }

  setParameterScope(scope: 'Empresa' | 'Centro' | 'Zona' | 'Ruta' | 'Usuario'): void {
    this.parameterScope = scope;
    this.parameterTarget = scope === 'Ruta' ? String(this.routes[0]?.id ?? '') : scope === 'Usuario' ? String(this.users[0]?.id ?? '') : '';
    if (scope === 'Centro' && !this.centerName) this.fail('Selecciona un centro en “Cambiar de contexto” para editar sus parámetros.');
  }

  get parameterNeedsTarget(): boolean { return ['Zona', 'Ruta', 'Usuario'].includes(this.parameterScope); }

  // ---- toasts ----
  fail(message: string): void { this.toastKind = 'error'; this.showMessage(message); }

  private notify(message: string): void { this.toastKind = 'ok'; this.showMessage(message); }

  private showMessage(message: string): void {
    this.toast = message;
    this.persist();
    if (message && typeof window !== 'undefined') window.setTimeout(() => { if (this.toast === message) this.toast = ''; }, message.length > 90 ? 9000 : 4500);
  }

  // ---- seguridad: bloqueo, sesiones, inactividad ----
  passwordStrength(value: string): { score: number; label: string } {
    let score = 0;
    if (value.length >= 12) score += 1;
    if (value.length >= 16) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    score = Math.min(4, score);
    return { score, label: ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'][value ? score : 0] };
  }

  get sessionsList(): { id: string; ua: string; createdAt: string; lastSeen: string }[] { return this.account?.sessions ?? []; }
  get currentSessionId(): string { return (typeof localStorage !== 'undefined' ? (localStorage.getItem('enruta.sid') ?? sessionStorage.getItem('enruta.sid')) : '') ?? ''; }

  get securityEvents(): SimpleRecord[] {
    const email = this.account?.email;
    return this.auditEvents.filter((e) => e.email === email && /sesión|contraseña|dos pasos|perfil|foto|bloque/i.test(e.name)).slice(0, 8);
  }

  revokeSession(id: string): void {
    const a = this.account; if (!a) return;
    if (id === this.currentSessionId) { this.signOut(); return; }
    a.sessions = (a.sessions ?? []).filter((s) => s.id !== id);
    this.addAuditEvent('Cerró una sesión en otro dispositivo'); this.notify('Sesión cerrada.');
  }

  revokeOtherSessions(): void {
    const a = this.account; if (!a) return;
    a.sessions = (a.sessions ?? []).filter((s) => s.id === this.currentSessionId);
    this.addAuditEvent('Cerró todas las demás sesiones'); this.notify('Se cerraron las demás sesiones.');
  }

  private watchActivity(): void {
    if (typeof window === 'undefined' || this.idleTimer) return;
    const touch = () => { this.lastActivity = Date.now(); };
    for (const name of ['click', 'keydown', 'mousemove', 'touchstart']) window.addEventListener(name, touch, { passive: true });
    this.idleTimer = setInterval(() => {
      if (!this.authenticated) return;
      const a = this.account;
      if (a) {
        const sid = this.currentSessionId; const mine = a.sessions?.find((s) => s.id === sid);
        if (mine) mine.lastSeen = new Date().toISOString();
        if (sid && a.sessions && !mine) { this.signOut(); this.authView = 'expired'; this.appRef.tick(); return; }
      }
      if (Date.now() - this.lastActivity > 30 * 60_000) { this.signOut(); this.authView = 'expired'; this.appRef.tick(); }
    }, 30_000);
  }

  private newSession(account: Account): void {
    const id = (crypto.randomUUID?.() ?? String(Date.now()));
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.replace(/\(.*?\)/g, '').slice(0, 60) || 'Navegador' : 'Navegador';
    const platform = typeof navigator !== 'undefined' && /Windows|Mac|Linux|Android|iPhone/.exec(navigator.userAgent)?.[0] || '';
    account.sessions = [...(account.sessions ?? []).slice(-7), { id, ua: `${platform} · ${ua}`.trim(), createdAt: new Date().toISOString(), lastSeen: new Date().toISOString() }];
    if (this.hasStorage) (this.keepSession ? localStorage : sessionStorage).setItem('enruta.sid', id);
  }

  // ---- importación CSV / XLSX ----
  private normalizeHeader(value: string): string { return value.replace(/^\uFEFF/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' '); }

  private parseDelimited(text: string): string[][] {
    const first = text.split(/\r?\n/).find((l) => l.trim()) ?? '';
    const candidates = [',', ';', '\t', '|'];
    const delimiter = candidates.map((d) => ({ d, n: first.split(d).length })).sort((a, b) => b.n - a.n)[0].d;
    const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (quoted) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') quoted = false; else cell += ch; }
      else if (ch === '"') quoted = true;
      else if (ch === delimiter) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i += 1; row.push(cell); cell = ''; if (row.some((c) => c.trim())) rows.push(row); row = []; }
      else cell += ch;
    }
    row.push(cell); if (row.some((c) => c.trim())) rows.push(row);
    return rows;
  }

  async importDataFile(event: Event | DragEvent): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = (event as DragEvent).dataTransfer?.files?.[0] ?? input?.files?.[0];
    if (!file) return;
    await this.handleImportFile(file);
    if (input && 'value' in input) input.value = '';
  }

  async handleImportFile(file: File): Promise<void> {
    this.uploadName = ''; this.uploadIssues = []; this.uploadCount = 0; this.pendingImported = []; this.uploadCompleted = false;
    this.importPreview = []; this.importHeaders = []; this.importStats = { created: 0, updated: 0, skipped: 0, duplicates: 0 };
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension !== 'csv' && extension !== 'xlsx') { this.fail('Formato no válido. Selecciona un archivo CSV o Excel (.xlsx).'); return; }
    if (file.size === 0) { this.fail('El archivo está vacío.'); return; }
    if (file.size > 15 * 1024 * 1024) { this.fail('El archivo supera el límite de 15 MB.'); return; }
    this.importBusy = true;
    try {
      const rows = extension === 'csv' ? this.parseDelimited(await file.text()) : this.parseXlsx(await file.arrayBuffer());
      if (rows.length < 2) { this.fail('El archivo no contiene filas para importar.'); return; }
      if (rows.length - 1 > 50_000) { this.fail('El archivo supera el límite de 50,000 registros por importación.'); return; }
      const header = rows[0].map((v) => this.normalizeHeader(v ?? ''));
      const aliases: Record<string, string[]> = this.importTarget === 'clientes'
        ? { name: ['nombre', 'cliente', 'razon social', 'negocio'], detail: ['direccion', 'domicilio', 'calle'], phone: ['telefono', 'tel', 'celular'], email: ['correo', 'email', 'correo electronico'], lat: ['latitud', 'lat'], lng: ['longitud', 'lng', 'lon'], status: ['estado', 'estatus'], code: [], category: [], price: [] }
        : { name: ['nombre', 'producto', 'articulo'], detail: ['descripcion', 'detalle', 'unidad'], code: ['clave', 'codigo', 'sku'], category: ['categoria', 'familia'], price: ['precio', 'precio base', 'precio unitario'], status: ['estado', 'estatus'], phone: [], email: [], lat: [], lng: [] };
      const idx = (key: string) => header.findIndex((h) => aliases[key].includes(h));
      const col = { name: idx('name'), detail: idx('detail'), phone: idx('phone'), email: idx('email'), lat: idx('lat'), lng: idx('lng'), status: idx('status'), code: idx('code'), category: idx('category'), price: idx('price') };
      if (col.name < 0) { this.fail(`Falta la columna “${this.importTarget === 'clientes' ? 'nombre” o “cliente' : 'nombre” o “producto'}” en la primera fila.`); return; }
      const cell = (r: string[], i: number) => (i >= 0 ? String(r[i] ?? '').trim() : '');
      const issues: string[] = []; const seen = new Set<string>(); const out: SimpleRecord[] = [];
      let baseId = Date.now();
      rows.slice(1).forEach((r, n) => {
        const line = n + 2; if (!r.some((v) => String(v ?? '').trim())) return;
        const name = cell(r, col.name);
        if (!name) { issues.push(`Fila ${line}: falta el nombre.`); return; }
        const rec: SimpleRecord = { id: baseId += 1, name, detail: cell(r, col.detail), status: /inactiv/i.test(cell(r, col.status)) ? 'Inactivo' : 'Activo' };
        if (this.importTarget === 'clientes') {
          rec.phone = cell(r, col.phone) || undefined; rec.email = cell(r, col.email) || undefined;
          if (rec.email && !this.validEmail(rec.email)) { issues.push(`Fila ${line}: correo inválido (${rec.email}).`); return; }
          const lat = cell(r, col.lat).replace(',', '.'); const lng = cell(r, col.lng).replace(',', '.');
          if (lat || lng) {
            const la = Number(lat); const lo = Number(lng);
            if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) { issues.push(`Fila ${line}: coordenadas inválidas.`); return; }
            rec.lat = la; rec.lng = lo;
          }
        } else {
          rec.code = cell(r, col.code) || undefined; rec.category = cell(r, col.category) || undefined;
          const price = cell(r, col.price).replace(/[$\s]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.');
          if (price) { const p = Number(price); if (!Number.isFinite(p) || p < 0) { issues.push(`Fila ${line}: precio inválido (${price}).`); return; } rec.price = p; }
        }
        const key = (this.importTarget === 'productos' && rec.code ? `c:${rec.code}` : `n:${name}|${rec.detail}`).toLowerCase();
        if (seen.has(key)) { issues.push(`Fila ${line}: registro repetido en el archivo (${name}).`); return; }
        seen.add(key); out.push(rec);
      });
      this.importHeaders = rows[0].map((h) => String(h ?? ''));
      this.importPreview = rows.slice(1, 7).map((r, n) => ({ row: n + 2, cells: this.importHeaders.map((_, i) => String(r[i] ?? '')) }));
      this.uploadName = file.name; this.uploadCount = out.length; this.pendingImported = out; this.uploadIssues = issues.slice(0, 30);
      if (issues.length > 30) this.uploadIssues.push(`… y ${issues.length - 30} observaciones más.`);
      this.importStats.duplicates = out.filter((r) => this.findExisting(r)).length;
      if (!out.length) this.fail('No se encontró ningún registro válido en el archivo.');
      else if (issues.length) this.notify(`${out.length} registros listos; ${issues.length} filas con observaciones.`);
      else this.notify(`${out.length} registros listos para importar.`);
    } catch (error) {
      this.fail(`No se pudo leer ${file.name}: ${error instanceof Error ? error.message : 'formato inválido'}.`);
    } finally { this.importBusy = false; }
  }

  private findExisting(rec: SimpleRecord): SimpleRecord | undefined {
    if (this.importTarget === 'productos') return this.products.find((p) => (rec.code && p.code === rec.code) || (!rec.code && p.name.toLowerCase() === rec.name.toLowerCase()));
    return this.clients.find((c) => c.name.toLowerCase() === rec.name.toLowerCase() && (c.detail || '').toLowerCase() === (rec.detail || '').toLowerCase());
  }

  submitImport(): void {
    if (this.uploadCompleted) { this.fail('Este archivo ya se importó.'); return; }
    if (!this.uploadName || !this.pendingImported.length) { this.fail('Carga un archivo con al menos un registro válido antes de continuar.'); return; }
    const target = this.importTarget === 'clientes' ? [...this.clients] : [...this.products];
    let created = 0; let updated = 0; let skipped = 0;
    for (const rec of this.pendingImported) {
      const existing = this.findExisting(rec);
      if (existing) {
        if (this.importMode === 'actualizar') {
          const i = target.findIndex((t) => t.id === existing.id);
          target[i] = { ...existing, ...Object.fromEntries(Object.entries({ ...rec, id: existing.id }).filter(([, v]) => v !== undefined && v !== '')) } as SimpleRecord; updated += 1;
        } else skipped += 1;
      } else { target.push(rec); created += 1; }
    }
    if (this.importTarget === 'clientes') this.clients = target; else this.products = target;
    this.importStats = { created, updated, skipped, duplicates: this.importStats.duplicates };
    this.addAuditEvent(`Importó ${this.importTarget} desde ${this.uploadName}: ${created} nuevos, ${updated} actualizados, ${skipped} omitidos`);
    this.notify(`Importación completada: ${created} nuevos, ${updated} actualizados, ${skipped} omitidos.`);
    this.pendingImported = []; this.uploadCompleted = true;
    void this.refreshRoute();
  }

  downloadImportTemplate(format: 'csv' | 'xlsx' = 'csv'): void {
    const rows = this.importTarget === 'clientes'
      ? [['nombre', 'direccion', 'telefono', 'correo', 'latitud', 'longitud', 'estado'], ['Abarrotes La Esquina', 'Av. Insurgentes Sur 1000, CDMX', '5512345678', 'contacto@laesquina.mx', '19.3730', '-99.1790', 'Activo']]
      : [['nombre', 'clave', 'categoria', 'precio', 'descripcion', 'estado'], ['Agua purificada 1 L', 'AGU-001', 'Bebidas', '12.50', 'Caja con 12 piezas', 'Activo']];
    let blob: Blob;
    if (format === 'xlsx') {
      const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const col = (i: number) => String.fromCharCode(65 + i);
      const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => `<c r="${col(ci)}${ri + 1}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
      const enc = new TextEncoder();
      const zip = zipSync({
        '[Content_Types].xml': enc.encode('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
        '_rels/.rels': enc.encode('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
        'xl/workbook.xml': enc.encode(`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${this.importTarget}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
        'xl/_rels/workbook.xml.rels': enc.encode('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
        'xl/worksheets/sheet1.xml': enc.encode(sheet),
      });
      blob = new Blob([zip as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    } else {
      blob = new Blob(['\uFEFF' + rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `plantilla-${this.importTarget}.${format}`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  // ---- editor de formularios ----
  get currentFields(): DeliveryField[] {
    if (!this.formsData[this.activeForm]) this.formsData[this.activeForm] = this.activeForm === 'entrega' ? [...this.deliveryFields] : [];
    return this.formsData[this.activeForm];
  }

  get selectedField(): DeliveryField | null { return this.currentFields.find((f) => f.id === this.selectedFieldId) ?? null; }

  setActiveForm(kind: 'entrega' | 'cobro' | 'visita'): void { this.activeForm = kind; this.selectedFieldId = null; }

  selectField(id: number): void { this.selectedFieldId = id; }

  addDeliveryField(): void {
    const label = this.fieldLabel.trim();
    if (!label) { this.fail('Escribe una etiqueta para el campo.'); return; }
    if (this.currentFields.some((f) => f.label.toLowerCase() === label.toLowerCase())) { this.fail('Ya existe un campo con esa etiqueta.'); return; }
    const field: DeliveryField = { id: Date.now(), label, type: this.fieldType, required: this.fieldRequired, placeholder: '', helpText: '', options: this.fieldType === 'Selección' ? ['Opción 1', 'Opción 2'] : [], min: '', max: '', maxLength: '', defaultValue: '', visible: true };
    this.formsData[this.activeForm] = [...this.currentFields, field];
    this.selectedFieldId = field.id; this.fieldLabel = ''; this.fieldRequired = false; this.formDirty = true;
    this.notify('Campo agregado. Edita sus propiedades a la derecha y pulsa Guardar.');
  }

  removeDeliveryField(fieldId: number): void {
    this.formsData[this.activeForm] = this.currentFields.filter((f) => f.id !== fieldId);
    if (this.selectedFieldId === fieldId) this.selectedFieldId = null; this.formDirty = true;
  }

  duplicateField(field: DeliveryField): void {
    const copy = { ...field, id: Date.now(), label: `${field.label} (copia)`, options: [...(field.options ?? [])] };
    this.formsData[this.activeForm] = [...this.currentFields, copy]; this.selectedFieldId = copy.id; this.formDirty = true;
  }

  moveField(index: number, delta: number): void {
    const list = [...this.currentFields]; const t = index + delta; if (t < 0 || t >= list.length) return;
    [list[index], list[t]] = [list[t], list[index]]; this.formsData[this.activeForm] = list; this.formDirty = true;
  }

  updateFieldOptions(text: string): void { const f = this.selectedField; if (f) { f.options = text.split('\n').map((o) => o.trim()).filter(Boolean); this.formDirty = true; } }

  saveForm(): void {
    const list = this.currentFields;
    const bad = list.find((f) => !f.label.trim() || (f.type === 'Selección' && !(f.options?.length)));
    if (bad) { this.selectedFieldId = bad.id; this.fail(bad.label.trim() ? `El campo “${bad.label}” necesita al menos una opción.` : 'Todos los campos necesitan una etiqueta.'); return; }
    const min = list.find((f) => f.min !== '' && f.max !== '' && Number(f.min) > Number(f.max));
    if (min) { this.selectedFieldId = min.id; this.fail(`En “${min.label}” el mínimo no puede ser mayor que el máximo.`); return; }
    if (this.activeForm === 'entrega') this.deliveryFields = [...list];
    this.formDirty = false;
    this.pendingChanges = [...new Set([...this.pendingChanges, `Formulario de ${this.formLabels[this.activeForm].toLowerCase()} actualizado`])];
    this.addAuditEvent(`Guardó el formulario de ${this.formLabels[this.activeForm].toLowerCase()} (${list.length} campos)`);
    this.notify('Formulario guardado.');
  }

  // ---- marca ----
  saveBrand(): void {
    if (this.brandColor && !/^#[0-9a-fA-F]{6}$/.test(this.brandColor)) { this.fail('El color debe tener formato #RRGGBB.'); return; }
    if (!this.brandName.trim()) { this.fail('Escribe el nombre visible en la app.'); return; }
    this.applyBrand();
    this.pendingChanges = [...new Set([...this.pendingChanges, 'Marca e identidad visual actualizada'])];
    this.addAuditEvent('Guardó la marca e identidad visual');
    this.notify('Marca guardada.');
  }

  setBrandLogo(event: Event): void {
    const input = event.target as HTMLInputElement; const file = input.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) { this.fail('Formato no válido. Usa PNG, JPG, WEBP o SVG.'); input.value = ''; return; }
    if (file.size > 2 * 1024 * 1024) { this.fail('El logotipo no debe superar 2 MB.'); input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      this.brandLogoDataUrl = typeof reader.result === 'string' ? reader.result : '';
      this.brandLogoName = file.name; this.persist(); this.notify('Logotipo cargado. Pulsa Guardar para aplicarlo.'); input.value = '';
    };
    reader.onerror = () => this.fail('No se pudo leer el logotipo seleccionado.');
    reader.readAsDataURL(file);
  }

  removeBrandLogo(): void { this.brandLogoDataUrl = ''; this.brandLogoName = ''; this.persist(); }

  // ---- liquidaciones ----
  get settlementTotals(): { collected: number; deposited: number; diff: number } {
    const collected = this.settlements.reduce((s, r) => s + (r.collected ?? 0), 0); const deposited = this.settlements.reduce((s, r) => s + (r.deposited ?? 0), 0);
    return { collected, deposited, diff: deposited - collected };
  }

  settlementDiff(r: SimpleRecord): number { return (r.deposited ?? 0) - (r.collected ?? 0); }

  // ---- reportes ----
  get reportSince(): number { return this.reportPeriod === 'all' ? 0 : Date.now() - Number(this.reportPeriod) * 86_400_000; }
  get periodEvents(): SimpleRecord[] { return this.auditEvents.filter((e) => e.id >= this.reportSince); }
  get previousPeriodEvents(): SimpleRecord[] {
    if (this.reportPeriod === 'all') return [];
    const span = Number(this.reportPeriod) * 86_400_000; return this.auditEvents.filter((e) => e.id < this.reportSince && e.id >= this.reportSince - span);
  }

  private filterRecords(records: SimpleRecord[]): SimpleRecord[] {
    const query = this.searchTerm.trim().toLowerCase();
    return query ? records.filter((record) => `${record.name} ${record.detail} ${record.code ?? ''} ${record.category ?? ''}`.toLowerCase().includes(query)) : records;
  }

  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"' && quoted) {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === ',' && !quoted) {
        values.push(value);
        value = '';
      } else {
        value += character;
      }
    }
    values.push(value);
    return values;
  }

  private parseXlsx(buffer: ArrayBuffer): string[][] {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 22) throw new Error('El archivo Excel está incompleto');
    this.validateZipSize(bytes);
    const files = unzipSync(bytes);
    const workbook = this.readXml(files['xl/workbook.xml'], 'libro de trabajo');
    const firstSheet = workbook.getElementsByTagName('sheet').item(0);
    const relationshipId = firstSheet?.getAttribute('r:id');
    if (!relationshipId) throw new Error('No se encontró una hoja de cálculo');

    const relationships = this.readXml(files['xl/_rels/workbook.xml.rels'], 'relaciones del libro');
    const relationship = Array.from(relationships.getElementsByTagName('Relationship'))
      .find((element) => element.getAttribute('Id') === relationshipId);
    const target = relationship?.getAttribute('Target');
    if (!target) throw new Error('No se encontró el archivo de la primera hoja');
    const sheetPath = this.normalizeZipPath(target.startsWith('/') ? target.slice(1) : `xl/${target}`);
    const sheet = this.readXml(files[sheetPath], 'primera hoja');
    const sharedStringsFile = files['xl/sharedStrings.xml'];
    const sharedStrings = sharedStringsFile
      ? Array.from(this.readXml(sharedStringsFile, 'valores compartidos').getElementsByTagName('si'))
        .map((item) => Array.from(item.getElementsByTagName('t')).map((text) => text.textContent ?? '').join(''))
      : [];
    const rows: string[][] = [];
    for (const row of Array.from(sheet.getElementsByTagName('row'))) {
      if (rows.length >= 50_000) throw new Error('La hoja supera el límite de 50,000 filas');
      const cells = Array.from(row.getElementsByTagName('c'));
      const values: string[] = [];
      for (const cell of cells) {
        const address = cell.getAttribute('r') ?? '';
        const column = address.match(/^[A-Z]+/)?.[0] ?? '';
        const index = this.columnIndex(column);
        if (index >= 256) throw new Error('La hoja supera el límite de 256 columnas');
        const type = cell.getAttribute('t');
        const value = type === 'inlineStr'
          ? Array.from(cell.getElementsByTagName('t')).map((text) => text.textContent ?? '').join('')
          : cell.getElementsByTagName('v').item(0)?.textContent ?? '';
        values[index] = type === 's' ? sharedStrings[Number(value)] ?? '' : value;
      }
      rows.push(values.map((value) => value ?? ''));
    }
    return rows;
  }

  private validateZipSize(bytes: Uint8Array): void {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const lowerBound = Math.max(0, bytes.length - 65_557);
    let endRecord = -1;
    for (let offset = bytes.length - 22; offset >= lowerBound; offset -= 1) {
      if (view.getUint32(offset, true) === 0x06054b50) {
        endRecord = offset;
        break;
      }
    }
    if (endRecord < 0) throw new Error('El archivo Excel no es un libro ZIP válido');
    const entryCount = view.getUint16(endRecord + 10, true);
    const directorySize = view.getUint32(endRecord + 12, true);
    let offset = view.getUint32(endRecord + 16, true);
    if (entryCount === 0xffff || directorySize === 0xffffffff || offset === 0xffffffff || offset + directorySize > bytes.length) {
      throw new Error('Los libros Excel ZIP64 no están soportados');
    }
    if (entryCount > 5_000) throw new Error('El libro contiene demasiados archivos internos');
    const directoryEnd = offset + directorySize;
    let expandedSize = 0;
    for (let entry = 0; entry < entryCount; entry += 1) {
      if (offset + 46 > directoryEnd || view.getUint32(offset, true) !== 0x02014b50) {
        throw new Error('El directorio del libro Excel está dañado');
      }
      expandedSize += view.getUint32(offset + 24, true);
      if (expandedSize > 50 * 1024 * 1024) throw new Error('El contenido descomprimido supera el límite de 50 MB');
      offset += 46 + view.getUint16(offset + 28, true) + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
      if (offset > directoryEnd) throw new Error('El directorio del libro Excel está dañado');
    }
  }

  private normalizeZipPath(path: string): string {
    const parts: string[] = [];
    for (const part of path.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') parts.pop();
      else parts.push(part);
    }
    return parts.join('/');
  }

  private readXml(data: Uint8Array | undefined, partName: string): Document {
    if (!data) throw new Error(`No se encontró ${partName}`);
    const document = new DOMParser().parseFromString(strFromU8(data), 'application/xml');
    if (document.getElementsByTagName('parsererror').length) throw new Error(`El XML de ${partName} no es válido`);
    return document;
  }

  private columnIndex(column: string): number {
    let index = 0;
    for (const character of column) index = index * 26 + character.charCodeAt(0) - 64;
    return Math.max(0, index - 1);
  }


}
