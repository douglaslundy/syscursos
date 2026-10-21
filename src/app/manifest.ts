import type { MetadataRoute } from "next";

// PWA: permite instalar o SysCursos no celular/computador. O aluno abre direto na area de cursos.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SysCursos",
    short_name: "SysCursos",
    description: "Plataforma de cursos online",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#0F1115",
    theme_color: "#FF4D00",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
