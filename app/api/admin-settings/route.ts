import { NextRequest, NextResponse } from "next/server";
import { ProviderKey, PROVIDERS } from "@/lib/provider-config";
import { getAdminSettings, updateAdminSettings, getAvailableModels } from "@/lib/admin-settings";

const authorize = (req: NextRequest) => {
  const token = process.env.ADMIN_TOKEN;
  const header = req.headers.get("x-admin-token");
  if (!token) return true;
  return header === token;
};

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const settings = getAdminSettings();
  const available = getAvailableModels();
  return NextResponse.json({ settings, availableModels: available, providers: Object.keys(PROVIDERS) });
}

export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const patch: Partial<{
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
    }> = body;
    const updated = updateAdminSettings(patch);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "invalid request" }, { status: 400 });
  }
}
