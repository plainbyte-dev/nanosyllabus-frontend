// auth.ts (root)
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  })],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.id_token) {
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: account.id_token }),
        });

        if (!response.ok) {
          throw new Error("Backend Google authentication failed");
        }

        const backendSession = await response.json();
        token.backendAccessToken = backendSession.access_token;
        token.role = backendSession.role;
        token.backendUser = backendSession.user;
      }

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        backendAccessToken: token.backendAccessToken,
        role: token.role,
        backendUser: token.backendUser,
      };
    },
  },
});
