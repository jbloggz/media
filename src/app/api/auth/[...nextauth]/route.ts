/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The authentication route for OAuth with google
 */

import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

const authOptionsGoogle: AuthOptions = {
   providers: [
      GoogleProvider({
         clientId: process.env.GOOGLE_ID || '',
         clientSecret: process.env.GOOGLE_SECRET || '',
         authorization: {
            params: {
               prompt: 'consent',
               access_type: 'offline',
               response_type: 'code',
            },
         },
      }),
   ],
   callbacks: {
      signIn: async (params) => {
         const valid_emails = JSON.parse(process.env.GOOGLE_ALLOWED_USERS || '[]');
         return Array.isArray(valid_emails) && valid_emails.some((v) => params.profile?.email === v);
      },
      redirect: async ({ baseUrl }) => baseUrl,
   },
   pages: {
      signIn: '/login',
      error: '/login',
   },
};

const authOptionsCredentials: AuthOptions = {
   providers: [
      CredentialsProvider({
         // The name to display on the sign in form (e.g. "Sign in with...")
         name: 'Credentials',
         // `credentials` is used to generate a form on the sign in page.
         // You can specify which fields should be submitted, by adding keys to the `credentials` object.
         // e.g. domain, username, password, 2FA token, etc.
         // You can pass any HTML attribute to the <input> tag through the object.
         credentials: {
            email: { label: 'Email', type: 'text' },
            password: { label: 'Password', type: 'password' },
         },
         async authorize(credentials, req) {
            try {
               const allowed_users: Record<string, string> = JSON.parse(process.env.CREDENTIALS || '{}');
               const email = credentials?.email || '';
               const password = credentials?.password || '';
               const encoded_hash = allowed_users[email] || '';
               return bcrypt.compareSync(password, atob(encoded_hash)) ? { id: email, email } : null;
            } catch {
               return null;
            }
         },
      }),
   ],
   theme: {
      logo: '/favicon-192x192.png',
   },
};

const handler = NextAuth(process.env.NEXTAUTH_PROVIDER === 'google' ? authOptionsGoogle : authOptionsCredentials);
export { handler as GET, handler as POST };
