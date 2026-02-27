const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  port: Number(process.env.PORT || 4300),
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@termissh.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
};

module.exports = { config };
