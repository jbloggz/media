/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Next.js middleware
 */

/* Secure all pages/routes except login page and static assets */
export { default } from 'next-auth/middleware';

export const config = { matcher: ['/((?!login|.*\\.ico|.*\\.svg|.*\\.png).*)'] };
