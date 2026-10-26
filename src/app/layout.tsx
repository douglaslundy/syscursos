import type { Metadata, Viewport } from "next";

import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";
import { ThemeToggle } from "@/components/shared/theme-toggle";

import "./globals.css";

export const metadata: Metadata = {
  title: "SysCursos",
  description: "Plataforma de cursos online",
  appleWebApp: { capable: true, title: "SysCursos", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#FF4D00" };

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var saved = localStorage.getItem("theme");
                  var theme = saved === "light" || saved === "dark"
                    ? saved
                    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                  document.documentElement.setAttribute("data-theme", theme);
                } catch (e) {
                  document.documentElement.setAttribute("data-theme", "light");
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <ThemeToggle />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
