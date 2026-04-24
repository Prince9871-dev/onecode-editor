import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

const githubId = process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_CLIENT_ID;
const githubSecret =
  process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_CLIENT_SECRET;
const googleId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const googleSecret =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;

const providers = [];

if (githubId && githubSecret) {
  providers.push(
    GitHub({
      clientId: githubId,
      clientSecret: githubSecret,
    })
  );
}

if (googleId && googleSecret) {
  providers.push(
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
    })
  );
}

export default {
  providers,
} satisfies NextAuthConfig;