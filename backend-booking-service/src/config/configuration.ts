export default () => ({
  jwt: {
    privateKey: process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    publicKey: process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n'),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  },
  oauth: {
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    },
  },
  storage: {
    url:                  process.env.SUPABASE_URL,
    serviceRoleKey:       process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket:               process.env.SUPABASE_BUCKET || 'booking-uploads',
    presignExpirySeconds: parseInt(process.env.SUPABASE_PRESIGN_EXPIRY_SECONDS || '3600', 10),
  },
});
