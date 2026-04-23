export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/projeto/:path*", "/admin/:path*", "/perfil/:path*"],
};
