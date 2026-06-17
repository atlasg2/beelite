// Test finish-schedule extraction on a sample PDF.
// Usage: npx tsx scripts/extract-test.ts [samples/midlands-A701.pdf]
process.loadEnvFile(".env");
import { readFileSync } from "fs";
import { extractFinishSchedule } from "../lib/anthropic";

async function main() {
  const path = process.argv[2] ?? "samples/midlands-A701.pdf";
  const b64 = readFileSync(path).toString("base64");
  console.log(`Reading ${path} with Claude…\n`);

  const t = Date.now();
  const { finishes, model, usage } = await extractFinishSchedule(b64);

  console.table(
    finishes.map((f) => ({
      code: f.code,
      type: f.type,
      unit: f.unit,
      category: f.category,
      inScope: f.includedInFlooringScope,
      conf: f.confidence,
    }))
  );
  console.log(`\n${finishes.length} finishes · model ${model}`);
  console.log(`tokens in/out: ${usage.input_tokens}/${usage.output_tokens}`);
}

main().catch((e) => {
  console.error(e?.response?.data?.error ?? e?.error ?? e);
  process.exit(1);
});
