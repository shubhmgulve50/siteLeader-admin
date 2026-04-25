import { jwtVerify } from "jose";
import { JWTExpired } from "jose/errors";
import { NextRequest, NextResponse } from "next/server";
import apiEndpoints from "./constants/apiEndpoints";
import { ROLE } from "./constants/constants";

const secretKey = () => {
  const secret = process.env.NEXT_PUBLIC_JWT_SECRET;
  if (secret) {
    return new TextEncoder().encode(secret);
  }
  throw new Error("No secret key provided");
};

const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/confirm-email",
  "/recovery-mail",
  "/set-password",
  "/pages/",
];

function isPublicRoute(path: string) {
  return publicRoutes.includes(path) || path.startsWith("/pages/");
}

async function verifyToken(token: string) {
  if (!token) throw new Error("No token provided");
  const { payload } = await jwtVerify(token, secretKey());
  return payload;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("accessToken")?.value;
  let user = null;

  try {
    user = token ? await verifyToken(token) : null;
  } catch (error) {
    if (error instanceof JWTExpired && token) {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
        const response = await fetch(`${apiUrl}${apiEndpoints.adminProfile}`, {
          headers: {
            Cookie: `accessToken=${token}`,
          },
        });

        if (response.status === 200) {
          const result = await response.json();
          const { accessToken } = result.data;
          const nextResponse = NextResponse.next();
          nextResponse.cookies.set("accessToken", accessToken);
          return nextResponse;
        }
      } catch (e) {
        console.error("Middleware refresh error", e);
      }
    }
  }

  // If trying to access login while already authenticated
  if (path === "/login" && user) {
    const isAdminRole = [
      ROLE.SUPER_ADMIN,
      ROLE.BUILDER,
      ROLE.SUPERVISOR,
      ROLE.ENGINEER,
    ].includes(user.role as string);
    const redirectPath = isAdminRole ? "/admin/settings" : "/";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Redirect to login if unauthenticated and trying to access a protected route
  if (!isPublicRoute(path) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect the admin area
  if (path.startsWith("/admin")) {
    const isAdminRole = [
      ROLE.SUPER_ADMIN,
      ROLE.BUILDER,
      ROLE.SUPERVISOR,
      ROLE.ENGINEER,
    ].includes(user?.role as string);
    if (!isAdminRole) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Root redirect
  if (path === "/" && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
