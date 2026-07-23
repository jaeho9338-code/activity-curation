// matchActivity()의 테스트. 이 함수는 이 서비스의 심장(공고 하나를 프로필과 대조해 판정)인데 테스트가
// 없었다. 이미 도는 함수라 이건 주로 회귀 테스트(동작 고정)지만, 경계 케이스를 찔러 실제 버그가 있으면
// 잡는 목적도 겸한다. 규칙은 match.js 주석 참고.
import { test } from "node:test";
import assert from "node:assert/strict";
import { matchActivity } from "./match.js";

// eligibility 기본틀(전부 무관). 각 테스트에서 필요한 필드만 덮어쓴다.
const base = { grades: [], majors: [], regions: [], enrollment: [], ageMin: null, ageMax: null, incomeMax: null, gpaMin: null };
const activity = (elig, parseStatus = "curated") => ({ parseStatus, eligibility: { ...base, ...elig } });

test("어긋난 조건 없으면 eligible", () => {
  const r = matchActivity(activity({ grades: [3] }), { grade: 3 });
  assert.equal(r.status, "eligible");
  assert.deepEqual(r.failed, []);
});

test("parseStatus가 needs_review면 판정 안 하고 review", () => {
  const r = matchActivity(activity({ grades: [1] }, "needs_review"), { grade: 3 });
  assert.equal(r.status, "review");
});

test("공고 조건이 무관([])이면 통과", () => {
  const r = matchActivity(activity({ grades: [] }), { grade: 3 });
  assert.equal(r.status, "eligible");
});

test("프로필에서 미선택(null)인 조건은 계산에서 제외", () => {
  const r = matchActivity(activity({ grades: [1] }), { grade: null });
  assert.equal(r.status, "eligible");
});

test("학년만 1급간 차이면 거의 가능(near)", () => {
  const r = matchActivity(activity({ grades: [3] }), { grade: 2 });
  assert.equal(r.status, "near");
  assert.equal(r.failed[0].label, "학년");
});

test("학년이 2급간 이상 차이면 지원 불가(ineligible)", () => {
  const r = matchActivity(activity({ grades: [4] }), { grade: 2 });
  assert.equal(r.status, "ineligible");
});

test("전공 하나만 어긋나면 거의 가능(학년 아닌 조건도 1개 차이는 near)", () => {
  const r = matchActivity(activity({ majors: ["IT"] }), { major: "경영" });
  assert.equal(r.status, "near");
});

test("두 조건 이상 어긋나면 지원 불가", () => {
  const r = matchActivity(activity({ majors: ["IT"], regions: ["서울"] }), { major: "경영", region: "부산" });
  assert.equal(r.status, "ineligible");
  assert.equal(r.failed.length, 2);
});

test("나이: 최소 미만이면 어긋남", () => {
  const r = matchActivity(activity({ ageMin: 20 }), { age: 19 });
  assert.equal(r.status, "near");
  assert.equal(r.failed[0].label, "나이");
});

test("나이: 경계값(정확히 최소)은 통과", () => {
  const r = matchActivity(activity({ ageMin: 20, ageMax: 30 }), { age: 20 });
  assert.equal(r.status, "eligible");
});

test("나이: 경계값(정확히 최대)은 통과", () => {
  const r = matchActivity(activity({ ageMin: 20, ageMax: 30 }), { age: 30 });
  assert.equal(r.status, "eligible");
});

test("소득분위: 경계값(정확히 상한)은 통과(이하)", () => {
  const r = matchActivity(activity({ incomeMax: 8 }), { income: 8 });
  assert.equal(r.status, "eligible");
});

test("학점: 경계값(정확히 하한)은 통과(이상)", () => {
  const r = matchActivity(activity({ gpaMin: 3.5 }), { gpa: 3.5 });
  assert.equal(r.status, "eligible");
});

test("나이: 최대 초과면 어긋남", () => {
  const r = matchActivity(activity({ ageMin: 20, ageMax: 30 }), { age: 31 });
  assert.equal(r.status, "near");
});

test("소득분위: 상한 초과면 어긋남", () => {
  const r = matchActivity(activity({ incomeMax: 8 }), { income: 9 });
  assert.equal(r.status, "near");
});

test("학점: 하한 미만이면 어긋남", () => {
  const r = matchActivity(activity({ gpaMin: 3.5 }), { gpa: 3.2 });
  assert.equal(r.status, "near");
});

// 경계 케이스: eligibility가 통째로 null인 공고(수집기 이상). 터지지 않고 확인 필요로 가야 한다.
test("eligibility가 null이면 터지지 않고 review", () => {
  const bad = { parseStatus: "curated", eligibility: null };
  let r;
  assert.doesNotThrow(() => { r = matchActivity(bad, { grade: 3 }); });
  assert.equal(r.status, "review");
  assert.deepEqual(r.failed, []);
});

// 경계 케이스: eligibility는 객체인데 배열 필드 하나가 null(수집기가 필드 하나만 빠뜨린 경우).
// 통째로 null만 막으면 여기서 여전히 터진다 - 이게 red로 나오면 필드 단위 방어를 추가한다.
test("eligibility 배열 필드 하나가 null이어도 터지지 않는다", () => {
  const partial = { parseStatus: "curated", eligibility: { ...base, grades: null } };
  assert.doesNotThrow(() => matchActivity(partial, { grade: 3 }));
});
