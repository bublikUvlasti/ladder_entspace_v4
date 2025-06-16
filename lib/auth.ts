import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import argon2 from 'argon2';

/**
 * NextAuth options for authentication
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'your-username' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          throw new Error('Username and password required');
        }
        
        // Find user by username (name field in database)
        const user = await prisma.user.findFirst({ 
          where: { name: credentials.username } 
        });
        
        if (!user) {
          throw new Error('No user found with that username');
        }
        
        const isValid = await argon2.verify(user.password, credentials.password);
        if (!isValid) {
          throw new Error('Invalid password');
        }
        
        return { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          wins: user.wins 
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.wins = user.wins;
      } else if (token.id) {
        // Refresh wins count from database on each JWT refresh
        const dbUser = await prisma.user.findUnique({ 
          where: { id: token.id },
          select: { wins: true }
        });
        if (dbUser) {
          token.wins = dbUser.wins;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token?.id && session.user) {
        session.user.id = token.id;
        session.user.wins = token.wins || 0;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
    newUser: '/auth/register'
  },
  secret: process.env.NEXTAUTH_SECRET
}; 