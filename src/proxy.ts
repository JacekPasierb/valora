import {authConfig} from "@/auth.config";
import NextAuth from "next-auth";

export default NextAuth(authConfig).auth;

/**
 * Nie obejmuj /api/auth — na Netlify middleware potrafi ponownie ustawić
 * cookie sesji w tej samej odpowiedzi co signOut i wylogowanie nie działa.
 */
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|csv|docx?|xlsx?|zip|webmanifest)$).*)",
  ],
};
