"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ProviderKey, PROVIDERS } from "@/lib/provider-config";

type GenerationSettings = {
  dimensionFormat: "size" | "aspectRatio";
  size?: string;
  aspectRatio?: string;
  useSeed: boolean;
  randomizeSeed: boolean;
  seed?: number;
  vertexAddWatermark: boolean;
  timeoutMillis: number;
};

type AdminSettingsDto = {
  settings: {
    defaultProvider: ProviderKey;
    providerModelOverrides: Record<ProviderKey, string>;
    defaultPrompt: string;
    systemPrompt: string;
    hideModelFromUser: boolean;
    providerEnabled: Record<ProviderKey, boolean>;
    generation: GenerationSettings;
  };
  availableModels: Record<ProviderKey, string[]>;
  providers: string[];
};

export function AdminSettingsPanel({ apiBaseUrl, adminToken }: { apiBaseUrl: string; adminToken?: string }) {
  const [data, setData] = useState<AdminSettingsDto | null>(null);
  const [pending, setPending] = useState(false);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminToken) headers["x-admin-token"] = adminToken;

  const load = async () => {
    const res = await fetch(`${apiBaseUrl}/api/admin-settings`, { headers });
    const json = await res.json();
    setData(json as AdminSettingsDto);
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (patch: any) => {
    setPending(true);
    await fetch(`${apiBaseUrl}/api/admin-settings`, {
      method: "POST",
      headers,
      body: JSON.stringify(patch),
    });
    await load();
    setPending(false);
  };

  if (!data) return null;

  const s = data.settings;
  const models = data.availableModels;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Provider Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Default Provider</Label>
              <Select value={s.defaultProvider} onValueChange={(v) => update({ defaultProvider: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={s.defaultProvider} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Providers</SelectLabel>
                    {(Object.keys(PROVIDERS) as ProviderKey[]).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Hide Model From User</Label>
              <div className="flex items-center gap-2">
                <Toggle pressed={s.hideModelFromUser} onPressedChange={(on) => update({ hideModelFromUser: !!on })}>Hide</Toggle>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Replicate Model</Label>
              <Select value={s.providerModelOverrides.replicate} onValueChange={(v) => update({ providerModelOverrides: { replicate: v } })}>
                <SelectTrigger>
                  <SelectValue placeholder={s.providerModelOverrides.replicate} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Models</SelectLabel>
                    {(models.replicate || []).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Enable Replicate</Label>
              <div className="flex items-center gap-2">
                <Toggle pressed={s.providerEnabled.replicate} onPressedChange={(on) => update({ providerEnabled: { replicate: !!on } })}>{s.providerEnabled.replicate ? "On" : "Off"}</Toggle>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Default Prompt</Label>
            <Textarea defaultValue={s.defaultPrompt} onBlur={(e) => update({ defaultPrompt: e.currentTarget.value })} />
          </div>
          <div className="grid gap-2">
            <Label>System Prompt</Label>
            <Textarea defaultValue={s.systemPrompt} onBlur={(e) => update({ systemPrompt: e.currentTarget.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Dimension Format</Label>
              <Select value={s.generation.dimensionFormat} onValueChange={(v) => update({ generation: { dimensionFormat: v } })}>
                <SelectTrigger>
                  <SelectValue placeholder={s.generation.dimensionFormat} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="size">size</SelectItem>
                    <SelectItem value="aspectRatio">aspectRatio</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{s.generation.dimensionFormat === "size" ? "Size" : "Aspect Ratio"}</Label>
              <Textarea defaultValue={s.generation.dimensionFormat === "size" ? (s.generation.size || "1024x1024") : (s.generation.aspectRatio || "1:1")} onBlur={(e) => update({ generation: s.generation.dimensionFormat === "size" ? { size: e.currentTarget.value } : { aspectRatio: e.currentTarget.value } })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Use Seed</Label>
              <div className="flex items-center gap-2">
                <Toggle pressed={s.generation.useSeed} onPressedChange={(on) => update({ generation: { useSeed: !!on } })}>{s.generation.useSeed ? "On" : "Off"}</Toggle>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Randomize Seed</Label>
              <div className="flex items-center gap-2">
                <Toggle pressed={s.generation.randomizeSeed} onPressedChange={(on) => update({ generation: { randomizeSeed: !!on } })}>{s.generation.randomizeSeed ? "On" : "Off"}</Toggle>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Fixed Seed</Label>
              <Textarea defaultValue={s.generation.seed ? String(s.generation.seed) : ""} onBlur={(e) => update({ generation: { seed: e.currentTarget.value ? Number(e.currentTarget.value) : undefined } })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Vertex Add Watermark</Label>
              <div className="flex items-center gap-2">
                <Toggle pressed={s.generation.vertexAddWatermark} onPressedChange={(on) => update({ generation: { vertexAddWatermark: !!on } })}>{s.generation.vertexAddWatermark ? "On" : "Off"}</Toggle>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Timeout (ms)</Label>
              <Textarea defaultValue={String(s.generation.timeoutMillis)} onBlur={(e) => update({ generation: { timeoutMillis: Number(e.currentTarget.value) } })} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={pending} onClick={() => load()}>Refresh</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

