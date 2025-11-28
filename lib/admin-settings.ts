import { MODEL_CONFIGS, PROVIDERS, ProviderKey } from "./provider-config";

export type AdminSettings = {
  defaultProvider: ProviderKey;
  providerModelOverrides: Record<ProviderKey, string>;
  defaultPrompt: string;
  systemPrompt: string;
  hideModelFromUser: boolean;
  providerEnabled: Record<ProviderKey, boolean>;
  generation: {
    dimensionFormat: "size" | "aspectRatio";
    size?: string;
    aspectRatio?: string;
    useSeed: boolean;
    randomizeSeed: boolean;
    seed?: number;
    vertexAddWatermark: boolean;
    timeoutMillis: number;
  };
  assetRoot?: string;
  outputFolder?: string;
};

let settings: AdminSettings = {
  defaultProvider: "replicate",
  providerModelOverrides: MODEL_CONFIGS.performance,
  defaultPrompt: "",
  systemPrompt: "",
  hideModelFromUser: true,
  providerEnabled: { replicate: true, vertex: false, openai: false, fireworks: false },
  generation: {
    dimensionFormat: "size",
    size: "1024x1024",
    aspectRatio: "1:1",
    useSeed: true,
    randomizeSeed: true,
    seed: undefined,
    vertexAddWatermark: false,
    timeoutMillis: 55 * 1000,
  },
  assetRoot: "",
  outputFolder: "",
};

export const getAdminSettings = (): AdminSettings => settings;

export const updateAdminSettings = (patch: Partial<AdminSettings>): AdminSettings => {
  const next: AdminSettings = { ...settings };
  if (patch.defaultProvider) {
    next.defaultProvider = patch.defaultProvider;
  }
  if (patch.providerModelOverrides) {
    const overrides = { ...next.providerModelOverrides };
    for (const k of Object.keys(patch.providerModelOverrides) as ProviderKey[]) {
      const model = patch.providerModelOverrides[k];
      const allowed = PROVIDERS[k]?.models ?? [];
      if (!allowed.includes(model)) {
        throw new Error(`invalid model for provider ${k}`);
      }
      overrides[k] = model;
    }
    next.providerModelOverrides = overrides;
  }
  if (typeof patch.defaultPrompt === "string") {
    next.defaultPrompt = patch.defaultPrompt;
  }
  if (typeof patch.systemPrompt === "string") {
    next.systemPrompt = patch.systemPrompt;
  }
  if (typeof patch.hideModelFromUser === "boolean") {
    next.hideModelFromUser = patch.hideModelFromUser;
  }
  if (patch.providerEnabled) {
    next.providerEnabled = { ...next.providerEnabled, ...patch.providerEnabled } as Record<ProviderKey, boolean>;
  }
  if (patch.generation) {
    next.generation = { ...next.generation, ...patch.generation };
    if (next.generation.dimensionFormat === "size") {
      next.generation.aspectRatio = next.generation.aspectRatio;
    }
    if (next.generation.dimensionFormat === "aspectRatio") {
      next.generation.size = next.generation.size;
    }
  }
  if (typeof patch.assetRoot === "string") {
    next.assetRoot = patch.assetRoot;
  }
  if (typeof patch.outputFolder === "string") {
    next.outputFolder = patch.outputFolder;
  }
  settings = next;
  return settings;
};

export const resetAdminSettings = (): AdminSettings => {
  settings = {
    defaultProvider: "replicate",
    providerModelOverrides: MODEL_CONFIGS.performance,
    defaultPrompt: "",
    systemPrompt: "",
    hideModelFromUser: true,
    providerEnabled: { replicate: true, vertex: false, openai: false, fireworks: false },
    generation: {
      dimensionFormat: "size",
      size: "1024x1024",
      aspectRatio: "1:1",
      useSeed: true,
      randomizeSeed: true,
      seed: undefined,
      vertexAddWatermark: false,
      timeoutMillis: 55 * 1000,
    },
    assetRoot: "",
    outputFolder: "",
  };
  return settings;
};

export const getAvailableModels = (): Record<ProviderKey, string[]> =>
  Object.fromEntries(
    (Object.keys(PROVIDERS) as ProviderKey[]).map((k) => [k, PROVIDERS[k].models])
  ) as Record<ProviderKey, string[]>;
