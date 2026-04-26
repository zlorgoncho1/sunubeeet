/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export — pas de Node serveur en prod, nginx sert les fichiers du dossier `out/`.
  // Conséquence : pas de SSR, pas de middleware, pas de next/image optimization.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

module.exports = nextConfig;
