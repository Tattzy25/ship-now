# Admin Settings Guide

## Domain

- Base URL: `https://tattty.com`
- Endpoints live under this domain once deployed.

## Endpoints

- `GET /api/admin-settings`
  - Returns: `{ settings, availableModels, providers }`
- `POST /api/admin-settings`
  - Body: partial object to update any settings field
  - Header (optional): `x-admin-token: <ADMIN_TOKEN>` if set in env

## Default Values

- `defaultProvider`: `replicate`
- `providerModelOverrides.replicate`: `stability-ai/stable-diffusion-3.5-large-turbo`
- `hideModelFromUser`: `true`
- `providerEnabled`: `{ replicate: true, vertex: false, openai: false, fireworks: false }`
- `generation`:
  - `dimensionFormat`: `size`
  - `size`: `1024x1024`
  - `aspectRatio`: `1:1`
  - `useSeed`: `true`
  - `randomizeSeed`: `true`
  - `seed`: unset
  - `vertexAddWatermark`: `false`
  - `timeoutMillis`: `55000`

## Fields

- `defaultProvider`: one of `replicate | vertex | openai | fireworks`
- `providerModelOverrides`: `{ [provider]: modelId }`
  - Replicate models:
    - `black-forest-labs/flux-1.1-pro`
    - `black-forest-labs/flux-1.1-pro-ultra`
    - `black-forest-labs/flux-dev`
    - `black-forest-labs/flux-pro`
    - `black-forest-labs/flux-schnell`
    - `ideogram-ai/ideogram-v2`
    - `ideogram-ai/ideogram-v2-turbo`
    - `luma/photon`
    - `luma/photon-flash`
    - `recraft-ai/recraft-v3`
    - `stability-ai/stable-diffusion-3.5-large`
    - `stability-ai/stable-diffusion-3.5-large-turbo`
- `defaultPrompt`: string applied when no prompt is provided
- `systemPrompt`: string prefixed to user prompt on the server
- `hideModelFromUser`: boolean; when true, server uses `providerModelOverrides` and ignores client model
- `providerEnabled`: `{ replicate, vertex, openai, fireworks }` booleans; disabled providers are blocked server-side
- `generation`:
  - `dimensionFormat`: `size | aspectRatio`
  - `size`: e.g. `1024x1024`
  - `aspectRatio`: e.g. `1:1`
  - `useSeed`: boolean
  - `randomizeSeed`: boolean
  - `seed`: number (used only when `useSeed` and not randomizing)
  - `vertexAddWatermark`: boolean
  - `timeoutMillis`: number in milliseconds

## Examples

- Read settings

```bash
curl -s https://tattty.com/api/admin-settings -H "x-admin-token: <ADMIN_TOKEN>"
```

- Update system prompt

```bash
curl -X POST https://tattty.com/api/admin-settings \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <ADMIN_TOKEN>" \
  -d '{
    "systemPrompt": "Follow internal style guide v3"
  }'
```

- Set Replicate model and keep user model hidden

```bash
curl -X POST https://tattty.com/api/admin-settings \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <ADMIN_TOKEN>" \
  -d '{
    "hideModelFromUser": true,
    "providerModelOverrides": { "replicate": "stability-ai/stable-diffusion-3.5-large-turbo" }
  }'
```

- Generation controls

```bash
curl -X POST https://tattty.com/api/admin-settings \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <ADMIN_TOKEN>" \
  -d '{
    "generation": {
      "dimensionFormat": "size",
      "size": "1024x1024",
      "useSeed": true,
      "randomizeSeed": false,
      "seed": 12345,
      "vertexAddWatermark": false,
      "timeoutMillis": 55000
    }
  }'
```

## Dashboard Component

- Use `components/AdminSettingsPanel.tsx` in your dashboard
- Props:
  - `apiBaseUrl`: `https://tattty.com`
  - `adminToken`: optional; pass to add `x-admin-token` header
- The panel reads models from the API and lets you update all fields visually using shadcn components.
