export default () => ({
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/vms_db',
  jwtSecret: process.env.JWT_SECRET || 'super_enterprise_vms_jwt_secret_token_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super_enterprise_vms_jwt_refresh_token_2026',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  encryptionMasterKey: process.env.ENCRYPTION_MASTER_KEY || 'f8a3c2d1e0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a403',
});
