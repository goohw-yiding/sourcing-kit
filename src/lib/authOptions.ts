import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KakaoProvider from "next-auth/providers/kakao";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 위챗 공중하오(微信公众号) OAuth 프로바이더
// 공중하오 백엔드: 설정 → 公众号设置 → 功能设置 → 网页授权域名 → sourcing-kit.vercel.app 등록 필요
// .env에 WECHAT_APP_ID=wx58c0154f3f312525, WECHAT_APP_SECRET=... 설정 필요
const WechatProvider = {
  id: "wechat",
  name: "微信",
  type: "oauth" as const,
  authorization: {
    // 微信公众号 网页授权 URL (开放平台 QR코드 방식이 아님)
    url: "https://open.weixin.qq.com/connect/oauth2/authorize",
    params: {
      appid: process.env.WECHAT_APP_ID,
      response_type: "code",
      scope: "snsapi_userinfo", // 닉네임·프로필 이미지 포함
    },
  },
  token: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async request(context: any) {
      const code = context.params?.code as string;
      const res = await fetch(
        `https://api.weixin.qq.com/sns/oauth2/access_token` +
        `?appid=${process.env.WECHAT_APP_ID}` +
        `&secret=${process.env.WECHAT_APP_SECRET}` +
        `&code=${code}` +
        `&grant_type=authorization_code`
      );
      const data = await res.json();
      return {
        tokens: {
          access_token: data.access_token,
          openid: data.openid,
          unionid: data.unionid,
        },
      };
    },
  },
  userinfo: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async request(context: any) {
      const tokens = context.tokens as { access_token: string; openid: string };
      const res = await fetch(
        `https://api.weixin.qq.com/sns/userinfo` +
        `?access_token=${tokens.access_token}` +
        `&openid=${tokens.openid}` +
        `&lang=zh_CN`
      );
      return res.json();
    },
  },
  profile(profile: { openid: string; unionid?: string; nickname?: string; headimgurl?: string }) {
    return {
      id: profile.unionid || profile.openid,
      name: profile.nickname || "微信用户",
      email: `wechat_${profile.unionid || profile.openid}@sourcing-kit.app`,
      image: profile.headimgurl,
    };
  },
  clientId: process.env.WECHAT_APP_ID,
  clientSecret: process.env.WECHAT_APP_SECRET,
  checks: ["state"],
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // 위챗: WECHAT_APP_ID 설정 시 활성화
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(process.env.WECHAT_APP_ID ? [WechatProvider as any] : []),
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
      if (account?.provider === "kakao" || account?.provider === "google" || account?.provider === "wechat") {
        // 카카오는 기본 스코프에서 이메일을 주지 않을 수 있음 → providerAccountId로 대체
        const email =
          user.email ||
          `${account.provider}_${account.providerAccountId}@sourcing-kit.app`;

        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          const tenant = await prisma.tenant.create({
            data: { name: user.name ?? "소싱킷 사용자" },
          });
          dbUser = await prisma.user.create({
            data: {
              email,
              name: user.name ?? "",
              tenantId: tenant.id,
              password: null,
            },
          });
        }
        // user 객체에 tenantId 주입 (jwt 콜백으로 전달)
        (user as { tenantId?: string }).tenantId = dbUser.tenantId;
        user.id = dbUser.id;
        user.email = email;
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
