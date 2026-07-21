import dotenv from 'dotenv';

dotenv.config();

interface Config {
  node_env: string;
  port: number;
  mongodb_uri: string;
  mongodb_db_name: string;
  redis_url: string;
  jwt_secret: string;
  jwt_refresh_secret: string;
  jwt_expires_in: string;
  jwt_refresh_expires_in: string;
  stripe_secret_key: string;
  wise_api_key: string;
  sendgrid_api_key: string;
  sendgrid_from_email: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  storage_provider: string;
  r2_account_id: string;
  r2_public_url: string;
  kyc_upload_url_ttl_minutes: number;
  aws_access_key_id: string;
  aws_secret_access_key: string;
  aws_region: string;
  s3_bucket_name: string;
  maxmind_license_key: string;
  platform_fee_percent: number;
  cors_origin: string;
  admin_jwt_secret: string;
  admin_ip_whitelist: string;
  log_level: string;
  otp_debug_mode: boolean;
}

const config: Config = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  mongodb_uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/do-it-platform',
  mongodb_db_name: process.env.MONGODB_DB_NAME || 'do-it-platform',
  redis_url: process.env.REDIS_URL || 'redis://localhost:6379',
  jwt_secret: process.env.JWT_SECRET || 'change-me',
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET || 'change-me',
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '15m',
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  stripe_secret_key: process.env.STRIPE_SECRET_KEY || '',
  wise_api_key: process.env.WISE_API_KEY || '',
  sendgrid_api_key: process.env.SENDGRID_API_KEY || '',
  sendgrid_from_email: process.env.SENDGRID_FROM_EMAIL || '',
  twilio_account_sid: process.env.TWILIO_ACCOUNT_SID || '',
  twilio_auth_token: process.env.TWILIO_AUTH_TOKEN || '',
  twilio_phone_number: process.env.TWILIO_PHONE_NUMBER || '',
  storage_provider: process.env.STORAGE_PROVIDER || 'mock',
  r2_account_id: process.env.R2_ACCOUNT_ID || '',
  r2_public_url: process.env.R2_PUBLIC_URL || '',
  kyc_upload_url_ttl_minutes: parseInt(process.env.KYC_UPLOAD_URL_TTL_MINUTES || '15', 10),
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID || '',
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY || '',
  aws_region: process.env.AWS_REGION || 'us-east-1',
  s3_bucket_name: process.env.S3_BUCKET_NAME || '',
  maxmind_license_key: process.env.MAXMIND_LICENSE_KEY || '',
  platform_fee_percent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '12'),
  cors_origin: process.env.CORS_ORIGIN || '*',
  admin_jwt_secret: process.env.ADMIN_JWT_SECRET || 'change-me',
  admin_ip_whitelist: process.env.ADMIN_IP_WHITELIST || '127.0.0.1,::1',
  log_level: process.env.LOG_LEVEL || 'info',
  otp_debug_mode:
    process.env.OTP_DEBUG_MODE !== undefined
      ? process.env.OTP_DEBUG_MODE === 'true'
      : process.env.NODE_ENV === 'test',
};

export default config;
