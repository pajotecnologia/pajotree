import { NextRequest, NextResponse } from "next/server";

// Lista de domínios padrões que pertencem ao Pajotree / desenvolvimento local
const DEFAULT_HOSTS = [
  "localhost",
  "127.0.0.1",
  "pajotree.com",
  "www.pajotree.com",
  "pajotree.com.br",
  "www.pajotree.com.br",
  "pajotech.com.br",
  "www.pajotech.com.br",
  "tree.pajotech.com.br",
  "pajotech.com",
  "vercel.app",
];

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const cleanHost = host.split(":")[0].toLowerCase();
  const { pathname } = req.nextUrl;

  // Ignora rotas de sistema, arquivos estáticos e assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }

  // Verifica se é um domínio personalizado (não padrão)
  const isDefaultHost = DEFAULT_HOSTS.some((dh) => cleanHost === dh || cleanHost.endsWith(`.${dh}`));

  if (!isDefaultHost && cleanHost) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-custom-host", cleanHost);

    // Se o visitante acessou a raiz "/" do domínio próprio, reescreve internamente para a Landing Page White Label
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = `/wl/${cleanHost}`;
      return NextResponse.rewrite(url, {
        headers: requestHeaders,
      });
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
