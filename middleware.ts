import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  publicRoutes,
  authRoutes,
} from "@/routes";

export function middleware(req: NextRequest) {
  const { nextUrl } = req;

  const isLoggedIn =
    !!req.cookies.get("authjs.session-token") ||
    !!req.cookies.get("__Secure-authjs.session-token") ||
    !!req.cookies.get("next-auth.session-token") ||
    !!req.cookies.get("__Secure-next-auth.session-token");

  const isApiAuthRoute =
    nextUrl.pathname.startsWith(apiAuthPrefix);

  const isPublicRoute =
    publicRoutes.includes(nextUrl.pathname);

  const isAuthRoute =
    authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(DEFAULT_LOGIN_REDIRECT, nextUrl)
      );
    }

    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(
      new URL("/auth/sign-in", nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};