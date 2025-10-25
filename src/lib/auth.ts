import { NextAuthOptions } from 'next-auth';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
import GitHubProvider from 'next-auth/providers/github';
import { supabase } from './supabase';

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.uid) {
        (session.user as { id: string }).id = token.uid as string;
        // Add subscription tier to session
        const { data: userData } = await supabase
          .from('users')
          .select('subscriptionTier')
          .eq('id', token.uid)
          .single();

        if (userData) {
          (session.user as { subscriptionTier: string }).subscriptionTier =
            userData.subscriptionTier;
        }
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
};
