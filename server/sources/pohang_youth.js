// 포항청춘센터&청년창업플랫폼(pohang.go.kr/youthph) 공지 게시판. 대구-경북 생활권에서 대구·경북 다음으로
// 큰 시(포항)를 별도로 붙인다. 목록에 마감일이 없어(등록일만) 서울청년몽땅정보통과 같은 방식으로 다룬다.
import { load } from "cheerio";
import { fileURLToPath } from "url";

const BASE = "https://www.pohang.go.kr";
const UA = "Mozilla/5.0 (compatible; ActivityCurationBot/0.1; personal project, links to source)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`포항청춘센터 ${res.status}: ${url}`);
  return res.text();
}

// 목록 한 페이지(표). 반환: [{ idx, title, postedAt, sourceUrl }]
export async function fetchList(page = 1) {
  const $ = load(await getHtml(`${BASE}/youthph/notice/policy?page=${page}`));
  const items = [];
  $("table.board_t1 tbody tr").each((_, tr) => {
    const a = $(tr).find("a.title_cont").first();
    const href = a.attr("href");
    const idx = href?.match(/idx=(\d+)/)?.[1];
    if (!idx) return;
    items.push({
      idx,
      title: a.text().replace(/\s+/g, " ").trim(),
      postedAt: $(tr).find("td.date").text().trim(),
      sourceUrl: `${BASE}${href.replace(/&amp;/g, "&")}`,
    });
  });
  return items;
}

export function toRaw(item) {
  return {
    source_url: item.sourceUrl,
    raw_title: item.title,
    posted_at: item.postedAt,
    raw_text: item.title,
    scraped_at: new Date().toISOString(),
  };
}

// 직접 실행: 목록을 찍어 포항 청년 공지가 나오는지 확인.
//   node sources/pohang_youth.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const list = await fetchList(1);
  console.log(`포항청춘센터 공지 ${list.length}건\n`);
  for (const it of list) console.log(`  [${it.postedAt}] ${it.title.slice(0, 48)}`);
  await sleep(100);
}
