// deriveRegionFromDistrict()의 TDD 테스트. 구현(regionLookup.js)보다 먼저 쓴다.
//   node --test regionLookup.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveRegionFromDistrict } from "./regionLookup.js";

test("서울에만 있는 구 이름(영등포구)이 원문에 있으면 서울로 매핑된다", () => {
  assert.deepEqual(deriveRegionFromDistrict("영등포구민, 영등포구청 직원"), ["서울"]);
});

test("부산에만 있는 구 이름(해운대구)이 있으면 부산으로 매핑된다", () => {
  assert.deepEqual(deriveRegionFromDistrict("해운대구 거주자만 지원 가능"), ["부산"]);
});

test("여러 도시에 같은 이름이 있는 구(중구)는 판별하지 않는다(빈 배열)", () => {
  assert.deepEqual(deriveRegionFromDistrict("중구 주민만 지원 가능"), []);
});

test("구·군 이름이 아예 없으면 빈 배열(무관)", () => {
  assert.deepEqual(deriveRegionFromDistrict("전국 대학생 누구나 지원 가능"), []);
});

test("빈 값·null이면 안 터지고 빈 배열(무관)", () => {
  assert.deepEqual(deriveRegionFromDistrict(""), []);
  assert.deepEqual(deriveRegionFromDistrict(null), []);
});

test("서로 다른 시도의 구가 둘 다 있으면(드물지만) 둘 다 반환한다", () => {
  const result = deriveRegionFromDistrict("영등포구 또는 해운대구 거주자");
  assert.equal(result.includes("서울"), true);
  assert.equal(result.includes("부산"), true);
  assert.equal(result.length, 2);
});

// --- 시도명 직접 매칭 (이번에 광주·전남 오분류 버그로 추가) ---
test("시도명: '광주청년...'이면 광주로 매핑", () => {
  assert.deepEqual(deriveRegionFromDistrict("광주청년 일경험드림 사업"), ["광주"]);
});

test("시도명: 전라남도/전남 -> 전라(canonical)", () => {
  assert.deepEqual(deriveRegionFromDistrict("제11회 전라남도 친환경 디자인 공모전"), ["전라"]);
  assert.deepEqual(deriveRegionFromDistrict("전남 청년 대상"), ["전라"]);
});

test("시도명: 경상남도/경남 -> 경상, 충청북도/충북 -> 충청", () => {
  assert.deepEqual(deriveRegionFromDistrict("경상남도 지원"), ["경상"]);
  assert.deepEqual(deriveRegionFromDistrict("충북 거주자"), ["충청"]);
});

// --- 한 지역에만 있는 시명 매칭 ---
test("시명: 순천·여수 -> 전라, 창원 -> 경상, 천안 -> 충청", () => {
  assert.deepEqual(deriveRegionFromDistrict("순천시 시민주권 슬로건 공모전"), ["전라"]);
  assert.deepEqual(deriveRegionFromDistrict("여수 웨딩홀 영상 공모전"), ["전라"]);
  assert.deepEqual(deriveRegionFromDistrict("창원시 청년 모집"), ["경상"]);
  assert.deepEqual(deriveRegionFromDistrict("천안시 공모"), ["충청"]);
});

// --- 겹침 함정: 잘못 넣으면 새 버그가 되는 것들은 판별 안 함 ---
test("겹침: '고성'은 강원·경남 둘 다 있어 판별하지 않는다(빈 배열)", () => {
  assert.deepEqual(deriveRegionFromDistrict("고성군 공모전"), []);
});

test("기관 접두어(국립) 뒤 시명도 잡는다: 국립순천대학교 -> 전라", () => {
  assert.deepEqual(deriveRegionFromDistrict("국립순천대학교박물관 스테인드글라스 공모전"), ["전라"]);
});

test("여전히 '해운대구'의 '대구'는 오분류 안 한다(접두어 아님)", () => {
  assert.deepEqual(deriveRegionFromDistrict("해운대구 거주자만"), ["부산"]);
});

test("겹침: '경기도 광주시'는 광주광역시와 헷갈려 광주로 오분류하지 않는다", () => {
  // '광주'가 들어있어도 앞에 '경기'가 붙으면 경기 광주시라 광주(광역시)로 단정하지 않는다.
  const r = deriveRegionFromDistrict("경기도 광주시 청년 지원");
  assert.equal(r.includes("광주"), false);
});
