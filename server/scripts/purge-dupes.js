// 이미 DB에 쌓인 소스 간 중복 공고를 지운다(dedupe.js 규칙). 같은 공고 묶음에서 먼저 들어온 1건만 남긴다.
//   node scripts/purge-dupes.js            (dry-run)
//   node scripts/purge-dupes.js --apply
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { DedupIndex } from "../dedupe.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const apply = process.argv.includes("--apply");

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from("postings").select("id,title,deadline,source,created_at")
    .order("created_at", { ascending: true }).range(from, from + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}

const idx = new DedupIndex();
const drop = [];
for (const r of rows) {
  if (idx.has(r)) drop.push(r);
  else idx.add(r);
}
const bySrc = {};
for (const r of drop) bySrc[r.source] = (bySrc[r.source] || 0) + 1;
console.log(`전체 ${rows.length}건 중 중복 ${drop.length}건`, JSON.stringify(bySrc));

if (apply) {
  for (let i = 0; i < drop.length; i += 200) {
    const { error } = await supabase.from("postings").delete().in("id", drop.slice(i, i + 200).map((r) => r.id));
    if (error) throw error;
  }
  console.log("삭제 완료");
} else console.log("dry-run입니다. --apply 로 적용");
