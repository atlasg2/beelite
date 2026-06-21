// Grok Imagine helper: edit an existing image (image-to-image) or generate from text.
// Usage:
//   node scripts/grok-image.mjs edit  <inputImage> <outputPath> "<prompt>"
//   node scripts/grok-image.mjs gen   <outputPath> "<prompt>"
// Reads XAI_API_KEY from .env.local. Prints the full API response (base64 truncated)
// so we can learn the schema, then saves the resulting image to <outputPath>.

import fs from "node:fs";
import path from "node:path";

// --- load XAI_API_KEY from .env.local (simple parser) ---
function loadEnv() {
  const envPath = path.resolve(".env.local");
  const txt = fs.readFileSync(envPath, "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*XAI_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) return m[1];
  }
  throw new Error("XAI_API_KEY not found in .env.local");
}
const API_KEY = loadEnv();
const MODEL = "grok-imagine-image-quality";

function toDataUri(file) {
  const buf = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function summarize(obj) {
  // deep-clone but truncate long base64 strings so the log stays readable
  return JSON.parse(JSON.stringify(obj), (k, v) =>
    typeof v === "string" && v.length > 120 ? `${v.slice(0, 60)}…[${v.length} chars]` : v
  );
}

async function callApi(endpoint, body) {
  const res = await fetch(`https://api.x.ai/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  console.log(`HTTP ${res.status}`);
  if (json) console.log("RESPONSE:", JSON.stringify(summarize(json), null, 2));
  else console.log("RAW:", text.slice(0, 1000));
  if (!res.ok) process.exit(1);
  return json;
}

async function saveImage(item, outputPath) {
  // item may carry { url } (http or data URI) or { b64_json } / { base64 }
  const b64 = item.b64_json || item.base64;
  let buf;
  if (b64) {
    buf = Buffer.from(b64, "base64");
  } else if (item.url && item.url.startsWith("data:")) {
    buf = Buffer.from(item.url.split(",")[1], "base64");
  } else if (item.url) {
    const r = await fetch(item.url);
    buf = Buffer.from(await r.arrayBuffer());
  } else {
    throw new Error("No image data in response item: " + JSON.stringify(Object.keys(item)));
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buf);
  console.log(`SAVED -> ${outputPath} (${buf.length} bytes)`);
}

const [, , mode, ...rest] = process.argv;

if (mode === "edit") {
  const [input, output, prompt, aspectRatio, resolution] = rest;
  const body = {
    model: MODEL,
    prompt,
    image: { url: toDataUri(input), type: "image_url" },
  };
  if (aspectRatio) body.aspect_ratio = aspectRatio;
  if (resolution) body.resolution = resolution;
  const json = await callApi("images/edits", body);
  await saveImage(json.data[0], output);
} else if (mode === "gen") {
  const [output, prompt, aspectRatio, resolution] = rest;
  const body = { model: MODEL, prompt };
  if (aspectRatio) body.aspect_ratio = aspectRatio;
  if (resolution) body.resolution = resolution;
  const json = await callApi("images/generations", body);
  await saveImage(json.data[0], output);
} else {
  console.error("Usage: node scripts/grok-image.mjs <edit|gen> ...");
  process.exit(1);
}
