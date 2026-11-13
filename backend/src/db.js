const { Pool } = require('pg');
module.exports = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://enruta:enruta@localhost:5432/enruta' });
