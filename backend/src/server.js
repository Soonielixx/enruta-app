const express = require('express'); const cors = require('cors'); const jwt = require('jsonwebtoken'); const crypto = require('crypto');
const pool = require('./db'); const migrate = require('./migrate');

const PORT = process.env.PORT || 3000;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TTL = Number(process.env.LINK_TOKEN_TTL_SECONDS || 900);
const STATUSES = ['Activo', 'Inactivo', 'Reparación', 'Robado'];

const app = express();
app.use(cors({ origin: true, allowedHeaders: ['Content-Type', 'x-api-key', 'x-company'] }));
app.use(express.json({ limit: '100kb' }));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, message, code = 400) => res.status(code).json({ error: message });
const clean = (v) => (typeof v === 'string' ? v.trim() : v);
const nul = (v) => { const c = clean(v); return c === '' || c === undefined ? null : c; };

function admin(req, res, next) {
  const key = req.get('x-api-key') || '';
  const ok = key.length === ADMIN_API_KEY.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(ADMIN_API_KEY));
  if (!ok) return bad(res, 'API key inválida.', 401);
  const company = (req.get('x-company') || '').trim().toLowerCase();
  if (!company) return bad(res, 'Falta el encabezado x-company.');
  req.company = company; next();
}

app.get('/api/health', wrap(async (_req, res) => { await pool.query('SELECT 1'); res.json({ ok: true }); }));

/* ---------------- Conductores ---------------- */
app.get('/api/drivers', admin, wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM drivers WHERE company=$1 ORDER BY name', [req.company]); res.json(rows);
}));
app.post('/api/drivers', admin, wrap(async (req, res) => {
  const name = clean(req.body.name); if (!name) return bad(res, 'El nombre del conductor es obligatorio.');
  const { rows } = await pool.query('INSERT INTO drivers (company,name,email,phone) VALUES ($1,$2,$3,$4) RETURNING *', [req.company, name, nul(req.body.email), nul(req.body.phone)]);
  res.status(201).json(rows[0]);
}));
app.put('/api/drivers/:id', admin, wrap(async (req, res) => {
  const name = clean(req.body.name); if (!name) return bad(res, 'El nombre del conductor es obligatorio.');
  const { rows } = await pool.query('UPDATE drivers SET name=$3,email=$4,phone=$5 WHERE id=$1 AND company=$2 RETURNING *', [req.params.id, req.company, name, nul(req.body.email), nul(req.body.phone)]);
  rows[0] ? res.json(rows[0]) : bad(res, 'Conductor no encontrado.', 404);
}));
app.delete('/api/drivers/:id', admin, wrap(async (req, res) => {
  const r = await pool.query('DELETE FROM drivers WHERE id=$1 AND company=$2', [req.params.id, req.company]); r.rowCount ? res.status(204).end() : bad(res, 'Conductor no encontrado.', 404);
}));
app.post('/api/drivers/sync', admin, wrap(async (req, res) => {
  const list = Array.isArray(req.body.drivers) ? req.body.drivers.slice(0, 500) : [];
  for (const d of list) {
    const email = nul(d.email); const name = clean(d.name); if (!email || !name) continue;
    await pool.query(`INSERT INTO drivers (company,name,email,phone) VALUES ($1,$2,$3,$4)
      ON CONFLICT (company, lower(email)) WHERE email IS NOT NULL DO UPDATE SET name=EXCLUDED.name, phone=COALESCE(EXCLUDED.phone, drivers.phone)`, [req.company, name, email, nul(d.phone)]);
  }
  const { rows } = await pool.query('SELECT * FROM drivers WHERE company=$1 ORDER BY name', [req.company]); res.json(rows);
}));

/* ---------------- Vehículos ---------------- */
app.get('/api/vehicles', admin, wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM vehicles WHERE company=$1 ORDER BY plate', [req.company]); res.json(rows);
}));
app.post('/api/vehicles', admin, wrap(async (req, res) => {
  const plate = clean(req.body.plate); if (!plate) return bad(res, 'La placa es obligatoria.');
  const { rows } = await pool.query('INSERT INTO vehicles (company,plate,description) VALUES ($1,$2,$3) RETURNING *', [req.company, plate.toUpperCase(), nul(req.body.description)]);
  res.status(201).json(rows[0]);
}));
app.put('/api/vehicles/:id', admin, wrap(async (req, res) => {
  const plate = clean(req.body.plate); if (!plate) return bad(res, 'La placa es obligatoria.');
  const { rows } = await pool.query('UPDATE vehicles SET plate=$3,description=$4 WHERE id=$1 AND company=$2 RETURNING *', [req.params.id, req.company, plate.toUpperCase(), nul(req.body.description)]);
  rows[0] ? res.json(rows[0]) : bad(res, 'Vehículo no encontrado.', 404);
}));
app.delete('/api/vehicles/:id', admin, wrap(async (req, res) => {
  const r = await pool.query('DELETE FROM vehicles WHERE id=$1 AND company=$2', [req.params.id, req.company]); r.rowCount ? res.status(204).end() : bad(res, 'Vehículo no encontrado.', 404);
}));

/* ---------------- Dispositivos ---------------- */
const DEVICE_SELECT = `SELECT d.*, dr.name AS driver_name, v.plate AS vehicle_plate, v.description AS vehicle_description
  FROM devices d LEFT JOIN drivers dr ON dr.id=d.driver_id LEFT JOIN vehicles v ON v.id=d.vehicle_id`;

function validateDevice(b) {
  const errors = [];
  if (!clean(b.alias)) errors.push('El alias es obligatorio.');
  const imei = clean(b.imei_serial);
  if (!imei) errors.push('El IMEI o número de serie es obligatorio.');
  else if (!/^\d{15}$/.test(imei) && !/^[A-Za-z0-9\-]{5,40}$/.test(imei)) errors.push('Escribe un IMEI de 15 dígitos o un número de serie alfanumérico (5-40).');
  if (b.phone && !/^[0-9+\s()\-]{7,20}$/.test(String(b.phone))) errors.push('El teléfono no es válido.');
  if (b.status && !STATUSES.includes(b.status)) errors.push('Estado no válido.');
  return errors;
}

function dbError(e, res) {
  if (e.code === '23505') {
    const c = e.constraint || '';
    const msg = c.includes('imei') ? 'Ya existe un dispositivo con ese IMEI/serie.' : c.includes('driver') ? 'Ese conductor ya tiene un dispositivo asignado.' : c.includes('vehicle') ? 'Ese vehículo ya tiene un dispositivo asignado.' : c.includes('plate') ? 'Ya existe un vehículo con esa placa.' : 'Registro duplicado.';
    return bad(res, msg, 409);
  }
  if (e.code === '23503') return bad(res, 'El conductor o vehículo indicado no existe.', 400);
  return null;
}

app.get('/api/devices', admin, wrap(async (req, res) => {
  const { rows } = await pool.query(`${DEVICE_SELECT} WHERE d.company=$1 ORDER BY d.created_at DESC`, [req.company]); res.json(rows);
}));
app.get('/api/devices/:id', admin, wrap(async (req, res) => {
  const { rows } = await pool.query(`${DEVICE_SELECT} WHERE d.id=$1 AND d.company=$2`, [req.params.id, req.company]);
  rows[0] ? res.json(rows[0]) : bad(res, 'Dispositivo no encontrado.', 404);
}));
app.post('/api/devices', admin, wrap(async (req, res) => {
  const b = req.body; const errors = validateDevice(b); if (errors.length) return bad(res, errors[0]);
  try {
    const { rows } = await pool.query(`INSERT INTO devices (company,alias,imei_serial,brand,model,os,os_version,phone,driver_id,vehicle_id,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`, [req.company, clean(b.alias), clean(b.imei_serial), nul(b.brand), nul(b.model), nul(b.os), nul(b.os_version), nul(b.phone), nul(b.driver_id), nul(b.vehicle_id), b.status || 'Activo']);
    const full = await pool.query(`${DEVICE_SELECT} WHERE d.id=$1`, [rows[0].id]); res.status(201).json(full.rows[0]);
  } catch (e) { if (!dbError(e, res)) throw e; }
}));
app.put('/api/devices/:id', admin, wrap(async (req, res) => {
  const b = req.body; const errors = validateDevice(b); if (errors.length) return bad(res, errors[0]);
  try {
    const r = await pool.query(`UPDATE devices SET alias=$3,imei_serial=$4,brand=$5,model=$6,os=$7,os_version=$8,phone=$9,driver_id=$10,vehicle_id=$11,status=$12,updated_at=now()
      WHERE id=$1 AND company=$2 RETURNING id`, [req.params.id, req.company, clean(b.alias), clean(b.imei_serial), nul(b.brand), nul(b.model), nul(b.os), nul(b.os_version), nul(b.phone), nul(b.driver_id), nul(b.vehicle_id), b.status || 'Activo']);
    if (!r.rowCount) return bad(res, 'Dispositivo no encontrado.', 404);
    const full = await pool.query(`${DEVICE_SELECT} WHERE d.id=$1`, [req.params.id]); res.json(full.rows[0]);
  } catch (e) { if (!dbError(e, res)) throw e; }
}));
app.delete('/api/devices/:id', admin, wrap(async (req, res) => {
  const r = await pool.query('DELETE FROM devices WHERE id=$1 AND company=$2', [req.params.id, req.company]); r.rowCount ? res.status(204).end() : bad(res, 'Dispositivo no encontrado.', 404);
}));

/* ---------------- QR: token temporal de vinculación ---------------- */
app.post('/api/devices/:id/link-token', admin, wrap(async (req, res) => {
  const d = await pool.query('SELECT id,status FROM devices WHERE id=$1 AND company=$2', [req.params.id, req.company]);
  if (!d.rows[0]) return bad(res, 'Dispositivo no encontrado.', 404);
  if (d.rows[0].status === 'Robado') return bad(res, 'Un dispositivo marcado como robado no puede vincularse.', 403);
  const jti = crypto.randomUUID(); const expiresAt = new Date(Date.now() + TTL * 1000);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE device_link_tokens SET used_at=now() WHERE device_id=$1 AND used_at IS NULL', [req.params.id]); // invalida QR previos
    await client.query('INSERT INTO device_link_tokens (jti,device_id,expires_at) VALUES ($1,$2,$3)', [jti, req.params.id, expiresAt]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  const token = jwt.sign({ typ: 'device-link', did: req.params.id, jti }, JWT_SECRET, { algorithm: 'HS256', expiresIn: TTL });
  res.json({ token, jti, expiresAt: expiresAt.toISOString(), ttlSeconds: TTL });
}));

/* ---------------- Móvil: confirma la vinculación ---------------- */
app.post('/api/mobile/link', wrap(async (req, res) => {
  const { token, model, os, osVersion, fcmToken } = req.body || {};
  if (!token || typeof token !== 'string') return bad(res, 'Falta el token del QR.');
  let payload;
  try { payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }); } catch { return bad(res, 'El código QR expiró o no es válido. Genera uno nuevo desde la web.', 401); }
  if (payload.typ !== 'device-link') return bad(res, 'Token no válido.', 401);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const t = (await client.query('SELECT * FROM device_link_tokens WHERE jti=$1 FOR UPDATE', [payload.jti])).rows[0];
    if (!t || t.used_at || new Date(t.expires_at) < new Date()) { await client.query('ROLLBACK'); return bad(res, 'Este código QR ya se usó o expiró.', 410); }
    const d = (await client.query('SELECT * FROM devices WHERE id=$1 FOR UPDATE', [t.device_id])).rows[0];
    if (!d) { await client.query('ROLLBACK'); return bad(res, 'Dispositivo no encontrado.', 404); }
    if (d.status === 'Robado') { await client.query('ROLLBACK'); return bad(res, 'Dispositivo bloqueado.', 403); }
    await client.query(`UPDATE devices SET reported_model=$2, reported_os=$3, os_version=COALESCE(os_version,$4), fcm_token=$5, linked_at=now(),
      status=CASE WHEN status='Inactivo' THEN 'Activo' ELSE status END, updated_at=now() WHERE id=$1`, [d.id, clean(model) || null, clean(os) || null, clean(osVersion) || null, clean(fcmToken) || null]);
    await client.query('UPDATE device_link_tokens SET used_at=now() WHERE device_id=$1 AND used_at IS NULL', [d.id]); // invalida este y cualquier otro QR
    await client.query('INSERT INTO device_links (device_id,driver_id,model,os,fcm_token) VALUES ($1,$2,$3,$4,$5)', [d.id, d.driver_id, clean(model) || null, clean(os) || null, clean(fcmToken) || null]);
    const info = (await client.query(`SELECT d.id, d.alias, dr.id AS driver_id, dr.name AS driver_name, v.plate FROM devices d LEFT JOIN drivers dr ON dr.id=d.driver_id LEFT JOIN vehicles v ON v.id=d.vehicle_id WHERE d.id=$1`, [d.id])).rows[0];
    await client.query('COMMIT');
    const deviceToken = jwt.sign({ typ: 'device', did: d.id, drv: info.driver_id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '365d' });
    res.json({ ok: true, deviceToken, device: { id: info.id, alias: info.alias }, driver: info.driver_id ? { id: info.driver_id, name: info.driver_name } : null, vehicle: info.plate || null });
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; } finally { client.release(); }
}));

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Error interno del servidor.' }); });

migrate().then(() => app.listen(PORT, () => console.log(`EnRuta API en http://localhost:${PORT}`))).catch((e) => { console.error('No se pudo iniciar:', e.message); process.exit(1); });
