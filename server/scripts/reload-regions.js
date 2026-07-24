// 일회성 마이그레이션: 이미 DB에 있는 공고의 제목·기관명으로 지역(regions)을 다시 뽑아, 비어있던 것을
// 채운다. regionLookup에 시도명·시명을 추가했는데(광주·전남 등) 기존 저장분은 옛날 regions=[]라, 재수집
// 없이 제목만으로 갱신한다. 기존 regions(zipCd로 온 부산/서울 등)는 날리지 않고 합집합으로 둔다.
//   node scripts/reload-regions.js
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { deriveRegionFromDistrict } from "../regionLookup.js";

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function updateWithRetry(id, eligibility, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const { error } = await s.from("postings").update({ eligibility }).eq("id", id);
    if (!error) return true;
    await sleep(500 * (i + 1));
  }
  return false;
}

async function run() {
  let all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await s.from("postings").select("id,title,org,eligibility").range(from, from + 999);
    if (error) throw error;
    all = all.concat(data);
    if (data.length < 1000) break;
  }
  console.log(`전체 ${all.length}건, 제목 기반 지역 재계산 시작`);

  let changed = 0, failed = 0;
  for (const r of all) {
    const e = r.eligibility || {};
    const derived = deriveRegionFromDistrict(`${r.title} ${r.org || ""}`);
    if (!derived.length) continue; // 제목에 지역 신호 없으면 건드리지 않는다(무관 유지)
    const merged = [...new Set([...(e.regions || []), ...derived])];
    // 변화 없으면 건너뛴다(불필요한 write 방지)
    if (merged.length === (e.regions || []).length && merged.every((x) => (e.regions || []).includes(x))) continue;
    const ok = await updateWithRetry(r.id, { ...e, regions: merged });
    ok ? changed++ : failed++;
    if ((changed + failed) % 200 === 0) console.log(`  ...변경 ${changed}, 실패 ${failed}`);
    await sleep(15);
  }
  console.log(`완료: 지역 채움 ${changed}건, 실패 ${failed}건`);
}

run().catch((e) => { console.error("마이그레이션 실패:", e.message); process.exit(1); });
