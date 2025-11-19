/// <reference types="vite/client" />

/**
 * Environment configuration for the Next Episode stage
 */
export const env = {
    // Development mode flag
    isDevelopment: import.meta.env.DEV,
    
    // Production mode flag
    isProduction: import.meta.env.PROD,
    
    // Base URL for the stage
    baseUrl: import.meta.env.BASE_URL,
};
