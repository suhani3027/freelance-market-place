import dotenv from 'dotenv';
dotenv.config(); 

// Provide sane development defaults if critical env vars are missing
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev_secret_change_me';
  console.warn('⚠️ JWT_SECRET was not set. Using a development fallback secret.');
}

if (!process.env.MONGODB_URI) {
  // Do not override if user already has a proper value; only set dev fallback
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/tasknest';
  console.warn('⚠️ MONGODB_URI was not set. Using a local MongoDB fallback at mongodb://127.0.0.1:27017/tasknest');
}