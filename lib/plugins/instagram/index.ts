import type { PlatformPlugin } from "../types";
import { InstagramFeedPreview } from "./feed-preview";

/**
 * Único plugin implementado en Fase 1 (§1.7). Los formatos coinciden con el
 * seed de `platform_formats` en drizzle/seed.ts — si se agrega un formato
 * acá, hay que sumarlo también al seed (todavía no están unificados en una
 * sola fuente; ver nota en el resumen de esta fase).
 */
export const instagramPlugin: PlatformPlugin = {
  id: "instagram",
  name: "Instagram",
  contentFormats: [
    { key: "post", label: "Post", rules: { aspectRatio: "1:1" } },
    { key: "reel", label: "Reel", rules: { aspectRatio: "9:16", maxDurationSec: 90 } },
    { key: "carrusel", label: "Carrusel", rules: { aspectRatio: "1:1", maxSlides: 10 } },
    { key: "historia", label: "Historia", rules: { aspectRatio: "9:16" } },
  ],
  statFields: [
    { key: "reach", label: "Alcance" },
    { key: "likes", label: "Me gusta" },
    { key: "comments", label: "Comentarios" },
    { key: "saves", label: "Guardados" },
    { key: "shares", label: "Compartidos" },
    { key: "views", label: "Reproducciones" },
    { key: "followersDelta", label: "Nuevos seguidores" },
    { key: "engagementRate", label: "Engagement" },
  ],
  FeedPreviewComponent: InstagramFeedPreview,
  validateContent(item) {
    const format = this.contentFormats.find((f) => f.key === item.formatKey);
    if (!format) {
      return { valid: false, errors: [`Formato desconocido: ${item.formatKey}`] };
    }
    return { valid: true, errors: [] };
  },
};
