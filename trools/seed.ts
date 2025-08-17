// tools/seed.ts
import fs from "fs";
import readline from "readline";
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(url, key); // Supabase JS 초기화 :contentReference[oaicite:1]{index=1}

async function upsertTemplates(path: string) {
  const rl = readline.createInterface({
    input: fs.createReadStream(path),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const t = JSON.parse(trimmed);
    await sb.from("prompt_templates").upsert({
      id: t.id,
      version: t.version,
      status: t.status,
      purpose: t.purpose,
      target_persona: t.target_persona,
      inputs_schema: t.inputs_schema,
      body_mustache: t.body_mustache,
      created_by: process.env.SEED_USER_ID, // 관리자 UUID
    });
    await sb.from("search_index").upsert({
      item_type: "template",
      item_id: `${t.id}:${t.version}`,
      title: t.purpose,
      tags: [t.target_persona ?? "general"],
    });
  }
}

async function upsertWorkflows(path: string) {
  const rl = readline.createInterface({
    input: fs.createReadStream(path),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const w = JSON.parse(trimmed);
    await sb.from("search_index").upsert({
      item_type: "workflow",
      item_id: w.id,
      title: w.title,
      tags: ["workflow"],
    });
  }
}

async function upsertToolsCsv(path: string) {
  const rows = parse(fs.readFileSync(path, "utf8"), {
    columns: true,
    skip_empty_lines: true,
  }); // csv-parse/sync :contentReference[oaicite:2]{index=2}
  for (const r of rows) {
    await sb.from("search_index").upsert({
      item_type: "tool",
      item_id: r.tool_id,
      title: r.name,
      tags: String(r.tags || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
    });
  }
}

(async () => {
  await upsertTemplates("src/data/prompt_templates.jsonl");
  await upsertWorkflows("src/data/workflows.jsonl");
  await upsertToolsCsv("src/data/ai_tools.csv");
  console.log("seed done");
})();
