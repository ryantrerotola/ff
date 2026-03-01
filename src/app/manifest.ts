import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FlyArchive — Fly Tying Pattern Database",
    short_name: "FlyArchive",
    description:
      "Free fly tying pattern database with community features. Browse patterns, materials, and instructional resources.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#2b6e57",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["sports", "lifestyle", "education"],
  };
}
