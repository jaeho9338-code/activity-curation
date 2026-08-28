import { supabase } from "../lib/supabase";

// 공고를 Supabase postings 테이블에서 전부 읽는다.
// Supabase select는 한 번에 최대 1000행만 준다. 총망라가 목표라 1000에서 잘리면 안 되므로,
// range로 페이지를 넘겨가며 끝까지 받아 합친다(수천 건은 브라우저 메모리로 감당, docs/schema.md 결정).
export async function loadPostings() {
  if (!supabase) throw new Error("Supabase 연결이 설정되지 않았어요. .env를 확인하세요.");
  const rows = [];
  const step = 1000;
  for (let from = 0; ; from += step) {
    const data = await fetchPage(from, step);
    rows.push(...data);
    if (data.length < step) break;
  }
  return rows.map(fromRow);
}

// 한 페이지를 받되, 일시적 네트워크 실패(모바일 끊김·순간 blip)로 전체 로드가 죽지 않게 몇 번 재시도한다.
// 매번 3.6MB를 4번 나눠 받는 구조라, 재시도 없이 한 요청만 실패해도 화면이 "load failed"로 죽던 걸 막는다.
async function fetchPage(from, step, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const { data, error } = await supabase.from("postings").select("*").range(from, from + step - 1);
      if (error) throw error;
      return data;
    } catch (e) {
      if (attempt >= tries) throw e;
      await new Promise((r) => setTimeout(r, 400 * attempt)); // 짧은 백오프 후 재시도
    }
  }
}

// Supabase row(스네이크 케이스) -> 화면이 쓰는 모양(mock과 동일). match.js를 그대로 쓰려고 맞춘다.
function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    org: row.org,
    category: row.category,
    track: row.track,
    source: row.source,
    url: row.url,
    deadline: row.deadline,
    postedAt: row.posted_at,
    collectedAt: row.created_at, // DB에 저장된 시각(수집 시각). 화면 신선도 표시용.
    parseStatus: row.parse_status,
    eligibility: row.eligibility,
    eligibilityText: row.eligibility?.text ?? row.eligibility_text ?? "",
  };
}
