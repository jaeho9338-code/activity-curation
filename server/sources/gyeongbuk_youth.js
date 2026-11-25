// 청년e끌림(경북청년포털, gbyouth.go.kr) 경북 자체 청년정책 API. 부산·서울 게시판과 달리 이 포털은
// 지원대상(policyScl)이 구조화된 필드로 따로 오는 정책 DB라, 부분 자유문장 파싱 없이도 바로 curated로 쓴다.
// list.json은 CSRF 보호가 있어 먼저 목록 페이지를 GET해 세션 쿠키+토큰을 받고, 그 세션으로 POST한다.
import { fileURLToPath } from "url";

const BASE = "https://gbyouth.go.kr";
const MN = "2379"; // 경북청년정책 메뉴
const UA = "Mozilla/5.0 (compatible; ActivityCurationBot/0.1; personal project, links to source)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 세션 쿠키 + CSRF 토큰을 한 번 받아 모듈 안에서 재사용한다(요청마다 새로 받을 필요 없음).
let session = null;
async function getSession() {
  if (session) return session;
  const res = await fetch(`${BASE}/policy/list.tc?mn=${MN}&pageIndex=1`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`경북청년 세션 ${res.status}`);
  const html = await res.text();
  const cookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  const csrf = html.match(/<meta name="_csrf" content="([^"]*)"/)?.[1];
  if (!cookie || !csrf) throw new Error("경북청년 세션/CSRF 토큰을 못 받음");
  session = { cookie, csrf };
  return session;
}

// 정책 목록 한 페이지(type=1: 경북청년정책 탭). 반환: [{ no, title, org, deadline, applyEnd, target }]
export async function fetchList(page = 1) {
  const { cookie, csrf } = await getSession();
  const res = await fetch(`${BASE}/policy/list.json`, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRF-TOKEN": csrf,
      Cookie: cookie,
      Referer: `${BASE}/policy/list.tc?mn=${MN}`,
    },
    body: new URLSearchParams({ mn: MN, pageIndex: String(page), pageNo: "0", type: "1", searchCondition: "1", searchPolicyNm: "" }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`경북청년 목록 ${res.status}`);
  const data = await res.json();
  // 상세는 모달(JS)이라 고정 URL이 없어, 공개 GET으로 바로 열리는 detail.modal을 원문 링크로 쓴다(no로 유일).
  return (data.resultList || []).map((r) => ({
    no: r.no,
    title: r.policyNm,
    org: r.operInstNm || r.sprvsnInstNm || "",
    deadline: /^\d{4}-\d{2}-\d{2}/.test(r.aplyEndDt || "") ? r.aplyEndDt.slice(0, 10) : (r.policyEndYmd || null),
    target: r.policyScl || "",
    content: r.policyCn || "",
    sourceUrl: `${BASE}/policy/detail.modal?no=${r.no}&templateRoot=/resources/templates/front`,
  }));
}

export function toRaw(item) {
  return {
    source_url: item.sourceUrl,
    raw_title: item.title,
    org: item.org,
    deadline: item.deadline,
    raw_text: `${item.target} ${item.content}`.replace(/\s+/g, " ").trim(),
    scraped_at: new Date().toISOString(),
  };
}

// 직접 실행: 목록을 찍어 경북 정책이 나오는지 확인.
//   node sources/gyeongbuk_youth.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const list = await fetchList(1);
  console.log(`경북청년포털(gbyouth) 정책 ${list.length}건 (1페이지)\n`);
  for (const it of list) console.log(`  [${it.deadline || "상시"}] ${it.title.slice(0, 42)}  (${it.org})`);
  await sleep(100);
}
