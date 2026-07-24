// 마감(D-day)이 지난 공고를 DB에서 삭제한다. 지원할 수 없는 공고라 계속 쌓이면 노이즈만 된다.
// 안전장치:
//  - deadline이 null인 것(부산청년플랫폼·서울 등 마감일 없는 상시)은 만료가 아니라 절대 안 지운다.
//  - 오늘 마감(deadline == today)은 아직 유효라 남긴다. deadline < today(엄격히 지난 것)만 지운다.
//  - 기본은 dry-run(개수만 세고 안 지움). 실제 삭제는 --apply 를 줘야 한다.
//  - 수집 뒤에 돌리면 방금 받은 유효 공고는 영향 없다(만료된 것만 지우므로).
//   node scripts/purge-expired.js            (dry-run)
//   node scripts/purge-expired.js --apply    (실제 삭제)
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (deadline도 같은 형식이라 문자열 비교 가능)
const APPLY = process.argv.includes("--apply");

// 만료 조건: deadline이 있고(null 아님) 오늘보다 이전.
function expiredQuery(q) {
  return q.lt("deadline", today).not("deadline", "is", null);
}

async function run() {
  const { count, error: cErr } = await expiredQuery(
    s.from("postings").select("*", { count: "exact", head: true }),
  );
  if (cErr) throw cErr;
  console.log(`오늘(${today}) 기준 만료 공고: ${count}건`);

  // 소스별 분포(무엇이 지워지는지 사람이 보고 판단)
  const bySrc = {};
  for (let from = 0; ; from += 1000) {
    const { data, error } = await expiredQuery(
      s.from("postings").select("source,deadline").range(from, from + 999),
    );
    if (error) throw error;
    for (const r of data) bySrc[r.source] = (bySrc[r.source] || 0) + 1;
    if (data.length < 1000) break;
  }
  console.log("  소스별:", JSON.stringify(bySrc));

  if (!APPLY) {
    console.log("dry-run입니다. 실제로 지우려면 --apply 를 붙이세요.");
    return;
  }
  const { error: dErr } = await expiredQuery(s.from("postings").delete());
  if (dErr) throw dErr;
  console.log(`삭제 완료: ${count}건 제거.`);
}

run().catch((e) => { console.error("만료 삭제 실패:", e.message); process.exit(1); });
