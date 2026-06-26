const IS_PROD = process.env.NODE_ENV === 'production';

export const ENV_CONFIG = {
    API_BASE_URL: IS_PROD ? '' : 'http://localhost:3001',
};
