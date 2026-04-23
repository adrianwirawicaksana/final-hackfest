import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/screening(.*)",
  "/study(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  if (path.startsWith("/sign-in") || path.startsWith("/sign-up")) {
    return;
  }

  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL("/sign-in", req.url);

    // 🔥 ini kunci redirect setelah login
    signInUrl.searchParams.set("redirect_url", req.url);

    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
