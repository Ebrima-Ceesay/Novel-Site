const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const adapter = new FileSync(path.join(dataDir, 'db.json'));
const db = low(adapter);

db.defaults({ novels: [], admin: null }).write();

// On first run, create the admin account from environment variables.
// If the password in .env changes later, update it by deleting data/db.json's
// "admin" key, or just edit it directly (see README).
function ensureAdmin() {
  const existing = db.get('admin').value();
  const envUser = process.env.ADMIN_USERNAME || 'author';
  const envPass = process.env.ADMIN_PASSWORD || 'changeme';

  if (!existing) {
    const passwordHash = bcrypt.hashSync(envPass, 10);
    db.set('admin', { username: envUser, passwordHash }).write();
    console.log(`Created admin account "${envUser}". Make sure ADMIN_PASSWORD in .env is set to something secure.`);
  }
}

ensureAdmin();

module.exports = db;
