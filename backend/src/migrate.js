const fs = require('fs'); const path = require('path'); const pool = require('./db');
module.exports = async function migrate() {
  await pool.query(fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8'));
};
if (require.main === module) migrate().then(() => { console.log('Esquema aplicado'); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
