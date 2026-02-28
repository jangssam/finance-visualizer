export const config = {
  opendart: {
    apiKey: process.env.OPENDART_API_KEY || '',
    baseUrl: 'https://opendart.fss.or.kr/api',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.0-flash',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
  },
};

export function validateConfig() {
  const missing: string[] = [];
  if (!config.opendart.apiKey) missing.push('OPENDART_API_KEY');
  if (!config.gemini.apiKey) missing.push('GEMINI_API_KEY');
  if (!config.db.host) missing.push('DB_HOST');
  return missing;
}
