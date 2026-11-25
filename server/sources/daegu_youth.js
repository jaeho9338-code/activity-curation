// 대구광역시 청년센터(dgyouth.kr) 공지사항 갤러리형 게시판. 부산·서울 통합공지의 대구 대응.
// 목록에 접수기간이 자유문장으로 박혀 있어(예: "접수기간 : 2026.09.18.(금)~2026.10.2.(목)") 정규식으로
// 끝 날짜를 마감으로 뽑는다. 자격 자유문장은 여기서 해석하지 않는다(이후 LLM/원문).
import { load } from "cheerio";
import { fileURLToPath } from "url";

const BASE = "http://www.dgyouth.kr";
const UA = "Mozilla/5.0 (compatible; ActivityCurationBot/0.1; personal project, links to source)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`대구청년센터 ${res.status}: ${url}`);
  return res.text();
}

// "2026.09.18.(금)~2026.10.2.(목)" 같은 문장에서 날짜를 모두 찾아 마지막(종료일)을 YYYY-MM-DD로 반환.
function lastDate(text) {
  const matches = [...(text || "").matchAll(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/g)];
  if (!matches.length) return null;
  const [, y, m, d] = matches[matches.length - 1];
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// 목록 한 페이지. 반환: [{ num, title, period, deadline, sourceUrl }]
export async function fetchList(page = 1) {
  const $ = load(await getHtml(`${BASE}/board/notice.asp?page=${page}`));
  const items = [];
  $("li.gallerylist01").each((_, li) => {
    const href = $(li).find("a").first().attr("href");
    const num = href?.match(/num=(\d+)/)?.[1];
    if (!num) return;
    // 제목 앞에 [공지][센터사업] 같은 분류 태그가 붙어와서, 실제 제목만 남기게 걷어낸다.
    const title = $(li).find("p.tit1").text().replace(/\s+/g, " ").replace(/^(\[[^\]]*\]\s*)+/, "").trim();
    const period = $(li).find("span.txt1").text().replace(/\s+/g, " ").trim();
    items.push({ num, title, period, deadline: lastDate(period), sourceUrl: `${BASE}/board/${href}` });
  });
  return items;
}

export function toRaw(item) {
  return {
    source_url: item.sourceUrl,
    raw_title: item.title,
    deadline: item.deadline,
    raw_text: `${item.title} ${item.period}`.replace(/\s+/g, " ").trim(),
    scraped_at: new Date().toISOString(),
  };
}

// 직접 실행: 목록을 찍어 대구 청년센터 공지가 나오는지 확인.
//   node sources/daegu_youth.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const list = await fetchList(1);
  console.log(`대구청년센터 공지 ${list.length}건\n`);
  for (const it of list) console.log(`  [${it.deadline || "상시"}] ${it.title.slice(0, 48)}`);
  await sleep(100);
}
