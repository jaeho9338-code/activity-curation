import { test } from "node:test";
import assert from "node:assert/strict";
import { isSamePosting, DedupIndex } from "./dedupe.js";

const d = "2026-12-01";
test("주최기관 대괄호만 다른 같은 공고는 중복", () => {
  assert.ok(isSamePosting({ title: "제24회 KPR 대학생 PR 아이디어 공모전", deadline: d }, { title: "[KPR] 제24회 KPR 대학생 PR 아이디어 공모전", deadline: d }));
  assert.ok(isSamePosting({ title: "대학생 철강 홍보 서포터즈", deadline: d }, { title: "[한국철강협회] 대학생 철강 홍보 서포터즈 1기 모집", deadline: d }));
});

test("마감일이 다르거나 없으면 중복 아님", () => {
  assert.ok(!isSamePosting({ title: "2026 뮤직텔링 부산 공모전", deadline: d }, { title: "2026 뮤직텔링 부산 공모전", deadline: "2026-12-02" }));
  assert.ok(!isSamePosting({ title: "2026 뮤직텔링 부산 공모전", deadline: null }, { title: "2026 뮤직텔링 부산 공모전", deadline: null }));
});

test("주제만 비슷한 다른 공모전은 중복 아님", () => {
  assert.ok(!isSamePosting({ title: "2026년 대국민 재정교육 아이디어 공모전", deadline: d }, { title: "2026년 K-Petro 대국민 혁신 아이디어 공모전", deadline: d }));
  assert.ok(!isSamePosting({ title: "서울 로컬브랜드 AI 숏폼 공모전", deadline: d }, { title: "서울 로컬브랜드 AI 기반 콘텐츠 마케팅 공모전", deadline: d }));
});

test("DedupIndex는 같은 마감일 안에서만 찾는다", () => {
  const idx = new DedupIndex();
  idx.add({ title: "[밀리의서재] 2026 밀리로드 출간 공모전 시즌 4", deadline: d });
  assert.ok(idx.has({ title: "2026 밀리로드 출간 공모전 시즌 4", deadline: d }));
  assert.ok(!idx.has({ title: "2026 밀리로드 출간 공모전 시즌 4", deadline: "2027-01-01" }));
});
