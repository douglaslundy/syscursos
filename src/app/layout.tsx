import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SysCursos",
  description: "Plataforma de cursos online",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
