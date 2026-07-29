import type { ComponentType } from "react";

export interface FormatDefinition {
  key: string;
  label: string;
  rules: Record<string, unknown>;
}

export interface StatFieldDefinition {
  key: string;
  label: string;
}

/**
 * Forma mínima que necesita el preview de feed de un plugin. Deliberadamente
 * no depende del modelo `Content` (que recién existe en Fase 2) — cuando el
 * Gestor de Contenido se implemente, mapea su entidad a esto en el borde,
 * no al revés, para que el plugin no dependa del core.
 */
export interface PlatformContentItem {
  id: string;
  formatKey: string;
  thumbnailUrl?: string;
  hidden?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Contrato que implementa cada integración de plataforma (§1.7). */
export interface PlatformPlugin {
  id: string;
  name: string;
  contentFormats: FormatDefinition[];
  statFields: StatFieldDefinition[];
  FeedPreviewComponent: ComponentType<{ items: PlatformContentItem[] }>;
  validateContent(item: PlatformContentItem): ValidationResult;
}
