import type {NextAuthConfig} from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({auth, request}) {
      const {pathname} = request.nextUrl;
      const isPublic =
        pathname === "/" ||
        pathname.startsWith("/sign-in") ||
        pathname.startsWith("/sign-up") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/register") ||
        pathname.startsWith("/api/recover");

      if (isPublic) {
        return true;
      }

      return !!auth?.user;
    },
    jwt({token, user}) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({session, token}) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
