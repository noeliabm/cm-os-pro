import { instagramPlugin } from "./instagram";
import type { PlatformPlugin } from "./types";

const registry = new Map<string, PlatformPlugin>([
  [instagramPlugin.id, instagramPlugin],
]);

export function getPlugin(id: string): PlatformPlugin {
  const plugin = registry.get(id);
  if (!plugin) throw new Error(`Plugin de plataforma no registrado: "${id}"`);
  return plugin;
}

export function listPlugins(): PlatformPlugin[] {
  return [...registry.values()];
}

export type { PlatformPlugin, PlatformContentItem, FormatDefinition, StatFieldDefinition } from "./types";
