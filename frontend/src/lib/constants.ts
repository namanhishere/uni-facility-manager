export const API_URL = typeof window === 'undefined'
    ? (process.env.INTERNAL_API_URL || 'http://localhost:3500')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500');
