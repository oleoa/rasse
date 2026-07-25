import type { NextAuthConfig } from "next-auth";

export const LOGIN_PATH = "/dashboard/login";

/**
 * Configuração sem providers, para poder ser importada pelo middleware.
 *
 * O middleware corre no runtime edge, onde não há bcrypt nem ligação à base de
 * dados. O provider `credentials` vive em `lib/auth.ts`, que só é carregado no
 * runtime Node.
 */
export const authConfig = {
  // Sem isto, o Auth.js v5 recusa qualquer host que não reconheça (só confia
  // automaticamente quando corre na Vercel) e devolve UntrustedHost.
  // O risco de confiar no cabeçalho Host é contido pela validação de
  // `callbackUrl`, que só aceita caminhos internos começados por /dashboard.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: LOGIN_PATH,
    error: LOGIN_PATH,
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname, search } = request.nextUrl;

      if (!pathname.startsWith("/dashboard")) return true;
      if (pathname === LOGIN_PATH) return true;

      if (auth?.user) return true;

      // `callbackUrl` faz o Auth.js devolver a pessoa ao destino original.
      const url = new URL(LOGIN_PATH, request.nextUrl.origin);
      url.searchParams.set("callbackUrl", `${pathname}${search}`);
      return Response.redirect(url);
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
