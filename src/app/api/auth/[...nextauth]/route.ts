/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The authentication route for OAuth with google
 */

import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const authOptions: AuthOptions = {
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
      signIn: async (params) =>
         process.env.ALLOWED_LOGIN_DOMAIN && params.profile?.email?.endsWith(process.env.ALLOWED_LOGIN_DOMAIN) ? true : false,
      redirect: async ({ baseUrl }) => baseUrl,
   },
   pages: {
      signIn: '/login',
      error: '/login',
   },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
