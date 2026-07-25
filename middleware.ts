import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Só a configuração sem providers: o middleware corre no edge, onde não há
// bcrypt nem base de dados.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/dashboard/:path*"],
};
