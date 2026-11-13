import 'dotenv/config'

for (const key of ['DATABASE_URL', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`[config] Missing ${key}. Copy .env.example to .env and fill it in.`)
    process.exit(1)
  }
}
if (process.env.JWT_SECRET.length < 32) {
  console.warn('[config] JWT_SECRET is shorter than 32 characters. Use a long random value.')
}

const bool = (v, d = false) => (v === undefined ? d : /^(1|true|yes)$/i.test(v))

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: 10,
  clientOrigins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean),
  allowLan: bool(process.env.ALLOW_LAN, true),
  trustProxy: bool(process.env.TRUST_PROXY, false),
}
