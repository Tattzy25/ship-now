import { NextRequest, NextResponse } from "next/server";
import { ImageModel, experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { fireworks } from "@ai-sdk/fireworks";
import { replicate } from "@ai-sdk/replicate";
import { ProviderKey } from "@/lib/provider-config";
import { getAdminSettings } from "@/lib/admin-settings";
import { GenerateImageRequest } from "@/lib/api-types";

/**
 * Intended to be slightly less than the maximum execution time allowed by the
 * runtime so that we can gracefully terminate our request.
 */
const TIMEOUT_MILLIS = 55 * 1000;

const DEFAULT_IMAGE_SIZE = "1024x1024" as `${number}x${number}`;
const DEFAULT_ASPECT_RATIO = "1:1" as `${number}:${number}`;

interface ProviderConfig {
  createImageModel: (modelId: string) => ImageModel;
  dimensionFormat: "size" | "aspectRatio";
}

const providerConfig: Record<ProviderKey, ProviderConfig> = {
  openai: {
    createImageModel: openai.image,
    dimensionFormat: "size",
  },
  fireworks: {
    createImageModel: fireworks.image,
    dimensionFormat: "aspectRatio",
  },
  replicate: {
    createImageModel: replicate.image,
    dimensionFormat: "size",
  },
};

const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMillis: number
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMillis)
    ),
  ]);
};

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const { prompt, provider, modelId } =
    (await req.json()) as GenerateImageRequest;

  try {
    const settings = getAdminSettings();
    if (!prompt || !provider || !providerConfig[provider]) {
      const error = "Invalid request parameters";
      console.error(`${error} [requestId=${requestId}]`);
      return NextResponse.json({ error }, { status: 400 });
    }
    if (!settings.providerEnabled[provider]) {
      return NextResponse.json({ error: "provider disabled" }, { status: 403 });
    }

    const config = providerConfig[provider];
    const chosenModelId = settings.hideModelFromUser
      ? settings.providerModelOverrides[provider]
      : modelId;
    const finalPrompt = settings.systemPrompt
      ? `${settings.systemPrompt}\n${prompt}`
      : prompt;
    const useSize = settings.generation.dimensionFormat === "size";
    const seedValue = settings.generation.useSeed
      ? settings.generation.randomizeSeed
        ? Math.floor(Math.random() * 1000000)
        : settings.generation.seed
      : undefined;
    const timeoutMillis = settings.generation.timeoutMillis ?? TIMEOUT_MILLIS;
    const startstamp = performance.now();
    const generatePromise = generateImage({
      model: config.createImageModel(chosenModelId),
      prompt: finalPrompt,
      ...(useSize
        ? { size: (settings.generation.size ?? DEFAULT_IMAGE_SIZE) as `${number}x${number}` }
        : { aspectRatio: (settings.generation.aspectRatio ?? DEFAULT_ASPECT_RATIO) as `${number}:${number}` }),
      ...(provider !== "openai" && seedValue !== undefined && { seed: seedValue }),
    }).then(({ image, warnings }) => {
      if (warnings?.length > 0) {
        console.warn(
          `Warnings [requestId=${requestId}, provider=${provider}, model=${chosenModelId}]: `,
          warnings
        );
      }
      console.log(
        `Completed image request [requestId=${requestId}, provider=${provider}, model=${chosenModelId}, elapsed=${(
          (performance.now() - startstamp) /
          1000
        ).toFixed(1)}s].`
      );

      return {
        provider,
        image: image.base64,
      };
    });

    const result = await withTimeout(generatePromise, timeoutMillis);
    return NextResponse.json(result, {
      status: "image" in result ? 200 : 500,
    });
  } catch (error) {
    // Log full error detail on the server, but return a generic error message
    // to avoid leaking any sensitive information to the client.
    console.error(
      `Error generating image [requestId=${requestId}, provider=${provider}, model=${modelId}]: `,
      error
    );
    return NextResponse.json(
      {
        error: "Failed to generate image. Please try again later.",
      },
      { status: 500 }
    );
  }
}
