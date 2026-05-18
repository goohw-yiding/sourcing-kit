import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    NaverProvider({
      clientId: process.env.NAVER_LOGIN_CLIENT_ID!,
      clientSecret: process.env.NAVER_LOGIN_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, tenantId: user.tenantId, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // 소셜 로그인: DB에 User/Tenant 자동 생성 또는 조회
      if ((account?.provider === "kakao" || account?.provider === "naver") && user.email) {
        let dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!dbUser) {
          const tenant = await prisma.tenant.create({
            data: { name: user.name ?? "소싱킷 사용자" },
          });
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? "",
              tenantId: tenant.id,
            },
          });
        }
        (user as { tenantId?: string }).tenantId = dbUser.tenantId;
        user.id = dbUser.id;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as { tenantId?: string }).tenantId;
        token.userId = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        (session.user as { id?: string; tenantId?: string }).id = token.userId as string;
        (session.user as { id?: string; tenantId?: string }).tenantId = token.tenantId as string;
      }
      return session;
    },
  },
};
