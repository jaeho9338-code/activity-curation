// 기존 링커리어 '대외활동' 공고를 classify.js 규칙으로 대외활동·봉사·동아리로 다시 나눈다.
// DB엔 링커리어 유형(activityTypeID)이 없어서 목록 API를 다시 받아 url -> 유형 지도를 만든다.
//   node scripts/recategorize.js            (dry-run)
//   node scripts/recategorize.js --apply
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as linkareer from "../sources/linkareer.js";
import { classifyActivity } from "../classify.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const apply = process.argv.includes("--apply");

const typeByUrl = new Map();
for (const t of linkareer.TYPES.filter((x) => x.category === "대외활동")) {
  for (let p = 1; p <= 30; p++) {
    const { items, totalCount } = await linkareer.fetchList(t.id, p, 100);
    for (const it of items) typeByUrl.set(it.sourceUrl, t.id);
    if (p * 100 >= totalCount) break;
  }
}

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from("postings").select("id,title,org,url,category")
    .eq("source", "링커리어").in("category", ["대외활동", "봉사", "동아리"]).range(from, from + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}

const moves = {};
const changes = [];
for (const r of rows) {
  const next = classifyActivity(r.title, r.org, typeByUrl.get(r.url) ?? null);
  if (next === r.category) continue;
  const key = `${r.category}->${next}`;
  moves[key] = (moves[key] || 0) + 1;
  changes.push({ id: r.id, category: next });
}
if (process.argv.includes("--show")) for (const c of changes) { const r = rows.find((x) => x.id === c.id); console.log(c.category, "|", r.title.slice(0, 50)); }
console.log(`링커리어 ${rows.length}건 중 재분류 ${changes.length}건`, JSON.stringify(moves));

if (apply) {
  for (const c of changes) {
    const { error } = await supabase.from("postings").update({ category: c.category }).eq("id", c.id);
    if (error) throw error;
  }
  console.log("적용 완료");
} else console.log("dry-run입니다. --apply 로 적용");
