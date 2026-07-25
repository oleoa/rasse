import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authConfig } from "@/lib/auth.config";

const credentialsSchema = z.object({
  email: z.string().min(1).max(200),
  password: z.string().min(1).max(200),
});

/**
 * Hash descartável, com o mesmo custo dos verdadeiros. Comparar contra ele
 * quando o utilizador não existe faz o pedido demorar o mesmo que uma password
 * errada — sem isto, o tempo de resposta denunciava quais os emails registados.
 */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.4a0iSm2s5vHNvE0Kt2GMmoIcQlmB4rW";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        const matches = await bcrypt.compare(
          parsed.data.password,
          user?.passwordHash ?? DUMMY_HASH,
        );

        // Uma única saída para "não existe" e "password errada".
        if (!user || !matches) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
