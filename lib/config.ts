export const config = {
  opendart: {
    apiKey: process.env.OPENDART_API_KEY || '',
    baseUrl: 'https://opendart.fss.or.kr/api',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.0-flash',
  },
};

export function validateConfig() {
  const missing: string[] = [];
  if (!config.opendart.apiKey) missing.push('OPENDART_API_KEY');
  if (!config.gemini.apiKey) missing.push('GEMINI_API_KEY');
  return missing;
}
