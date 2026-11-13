CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS drivers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company    TEXT NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS drivers_company_email_uq ON drivers (company, lower(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS vehicles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company     TEXT NOT NULL,
  plate       TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_company_plate_uq ON vehicles (company, upper(plate));

CREATE TABLE IF NOT EXISTS devices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company             TEXT NOT NULL,
  alias               TEXT NOT NULL,
  imei_serial         TEXT NOT NULL,
  brand               TEXT,
  model               TEXT,
  os                  TEXT,
  os_version          TEXT,
  phone               TEXT,
  driver_id           UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id          UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo','Inactivo','Reparación','Robado')),
  fcm_token           TEXT,
  reported_model      TEXT,
  reported_os         TEXT,
  linked_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS devices_company_imei_uq ON devices (company, upper(imei_serial));
CREATE UNIQUE INDEX IF NOT EXISTS devices_company_driver_uq ON devices (company, driver_id) WHERE driver_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS devices_company_vehicle_uq ON devices (company, vehicle_id) WHERE vehicle_id IS NOT NULL;

-- Tokens de vinculación QR (un solo uso, 15 min)
CREATE TABLE IF NOT EXISTS device_link_tokens (
  jti        UUID PRIMARY KEY,
  device_id  UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS device_link_tokens_device_idx ON device_link_tokens (device_id);

-- Historial de asociaciones hardware <-> conductor
CREATE TABLE IF NOT EXISTS device_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  driver_id  UUID REFERENCES drivers(id) ON DELETE SET NULL,
  model      TEXT,
  os         TEXT,
  fcm_token  TEXT,
  linked_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
