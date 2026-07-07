// 자격 매칭 로직 (순수 함수 — UI와 분리해서 테스트/설명하기 쉽게)
//
// 규칙: eligibility의 각 조건은 "빈 배열/null = 무관". 무관이 아니면 내 조건이
// 허용 범위 안에 들어야 통과. 하나라도 실패하면 지원 불가로 판정하고,
// 어떤 조건에서 걸렸는지(reasons)를 함께 돌려준다.
//
// @param {import('./data/activities').Activity} activity
// @param {{grade:number, major:string, region:string, income:number}} profile
// @returns {{eligible: boolean, failed: string[]}}
export function matchActivity(activity, profile) {
  const e = activity.eligibility;
  const failed = [];

  if (e.grades.length > 0 && !e.grades.includes(profile.grade)) {
    failed.push(`학년(${e.grades.join("·")}학년 대상)`);
  }
  if (e.majors.length > 0 && !e.majors.includes(profile.major)) {
    failed.push(`전공(${e.majors.join("·")} 대상)`);
  }
  if (e.regions.length > 0 && !e.regions.includes(profile.region)) {
    failed.push(`지역(${e.regions.join("·")} 대상)`);
  }
  if (e.incomeMax !== null && profile.income > e.incomeMax) {
    failed.push(`소득분위(${e.incomeMax}분위 이하 대상)`);
  }

  return { eligible: failed.length === 0, failed };
}

// 전체 목록을 내 조건으로 나눠서 반환
export function splitByEligibility(activities, profile) {
  const eligible = [];
  const ineligible = [];
  for (const a of activities) {
    const r = matchActivity(a, profile);
    (r.eligible ? eligible : ineligible).push({ ...a, ...r });
  }
  return { eligible, ineligible };
}
