// 소스 간 같은 공고 판별. 콘코·링커리어가 같은 공모전을 따로 올리면서 한쪽에만 "[주최기관]"을 붙여
// 제목 일치 검사를 빠져나갔다(실측 85쌍, 2026-11). 대괄호를 통째로 지우면 "[부산] OO"·"[서울] OO" 같은
// 다른 공고가 합쳐지니, 마감일이 같고 짧은 쪽 제목의 핵심 단어가 80% 이상 긴 쪽에 들어 있을 때만 같은 공고로 본다.
// 흔한 말(공모전·모집·대학생 등)은 빼고 센다. 안 빼면 "대국민 재정교육 아이디어 공모전"과
// "K-Petro 대국민 혁신 아이디어 공모전"이 흔한 말만으로 겹쳐 같은 공고로 잡힌다.
const STOP = new Set(["공모전", "공모", "모집", "대학생", "아이디어", "안내", "참가자", "추가", "2026", "2026년", "2027", "2027년", "1기"]);
const words = (t) => new Set((t || "").replace(/[^0-9a-z가-힣]+/gi, " ").toLowerCase().split(" ").filter((w) => w.length >= 2 && !STOP.has(w)));

export function isSamePosting(a, b) {
  if (!a.deadline || a.deadline !== b.deadline) return false;
  const x = words(a.title), y = words(b.title);
  if (x.size < 2 || y.size < 2) return false;
  let k = 0;
  for (const w of x) if (y.has(w)) k++;
  return k / Math.min(x.size, y.size) >= 0.8;
}

// 마감일별로 묶어 두고 같은 마감일끼리만 비교한다(전체 쌍 비교는 수천 건에서 느림).
export class DedupIndex {
  constructor() { this.byDeadline = new Map(); }
  has(p) { return (this.byDeadline.get(p.deadline) || []).some((q) => isSamePosting(p, q)); }
  add(p) {
    if (!p.deadline) return;
    if (!this.byDeadline.has(p.deadline)) this.byDeadline.set(p.deadline, []);
    this.byDeadline.get(p.deadline).push(p);
  }
}
