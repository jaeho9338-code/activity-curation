// noiseFilter.js 규칙이 바뀐 뒤, 이미 DB에 쌓여 있던(과거 수집분) 캐주얼 동아리·스터디를 다시 걸러 지운다.
// collect.js는 수집 시점에만 걸러서 신규분만 막고, 기존에 이미 들어간 건 안 건드린다 - 그래서 필터를
// 고친 뒤엔 이 스크립트로 기존분도 소급 정리해야 한다. collect.js가 이 필터를 쓰는 링커리어만 본다
// (온통청년 등 정책 소스는 '스터디카페 이용료 지원'처럼 필터가 오탐하는 정상 지원정책이 있어 건드리지 않는다).
//   node scripts/purge-noise.js            (dry-run: 개수만)
//   node scripts/purge-noise.js --apply    (실제 삭제)
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";
import { isClubNoise } from "../noiseFilter.js";

const SOURCE = "링커리어";

// 노이즈로 다시 걸리는 공고를 찾는다(apply=false면 세기만, true면 지운다). 소스별 분포를 반환한다.
export async function purgeNoise(supabase, apply = false) {
  const bySrc = {};
  const ids = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("postings")
      .select("id,source,title,org").eq("source", SOURCE).range(from, from + 999);
    if (error) throw error;
    for (const r of data) {
      if (isClubNoise(`${r.title} ${r.org || ""}`)) {
        bySrc[r.source] = (bySrc[r.source] || 0) + 1;
        ids.push(r.id);
      }
    }
    if (data.length < 1000) break;
  }
  if (apply && ids.length) {
    // delete().in()은 한 번에 너무 많은 id를 넘기면 URL이 길어질 수 있어 500개씩 나눠 지운다.
    for (let i = 0; i < ids.length; i += 500) {
      const { error } = await supabase.from("postings").delete().in("id", ids.slice(i, i + 500));
      if (error) throw error;
    }
  }
  return { count: ids.length, bySrc, applied: apply };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const apply = process.argv.includes("--apply");
  const r = await purgeNoise(supabase, apply);
  console.log(`노이즈로 재판정된 기존 공고: ${r.count}건`, JSON.stringify(r.bySrc));
  console.log(apply ? `삭제 완료: ${r.count}건 제거.` : "dry-run입니다. 실제로 지우려면 --apply 를 붙이세요.");
}
