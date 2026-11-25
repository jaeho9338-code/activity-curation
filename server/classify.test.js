import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyActivity } from "./classify.js";

test("실측 동아리성 공고는 동아리로", () => {
  for (const t of [
    "[HACK:ON] 해커온 크루 1기 모집",
    "[보컬] K-pop 커버 여밴드 달래 멤버 모집",
    "POPERS 크루원 모집",
    "AI영.재 CLUB [ AI 영상 제작 1기 ]",
    "[오디션없음] 먼지 쌓인 악기, 다시 꺼낼 시간! 메리오케스트라 청춘 12기 단원 모집",
    "공모전 동아리 SPECTER 팀원 모집",
  ]) assert.equal(classifyActivity(t), "동아리", t);
});

test("링커리어 동아리 유형(2)은 프로그램 신호 없으면 동아리", () => {
  assert.equal(classifyActivity("코딩 커뮤니티 브릿지[BRIDGE] 3기 모집", "브릿지", 2), "동아리");
  assert.equal(classifyActivity("바자르 공식 서포터즈 4기 모집", "바자르", 2), "대외활동");
});

test("봉사 성격은 봉사로", () => {
  assert.equal(classifyActivity("[굿네이버스] 아동권리옹호캠페인 자원봉사자", "굿네이버스"), "봉사");
  assert.equal(classifyActivity("교육봉사단체 세종 우리누리 19기 멘토 모집"), "봉사");
});

test("기관 프로그램은 대외활동 유지", () => {
  for (const t of [
    "삼성생명금융서비스 금융 실무체험 프로그램 3기 (~10/31)",
    "[버터샵] 서포터즈 버터크루 1기 모집",
    "국내 No.1 인터뷰 전문 언론 'CEO저널' 대학생 기자단 20기 추가 모집",
    "[유엔협회세계연맹] Field Training Program in Geneva 6기 참가자 모집",
  ]) assert.equal(classifyActivity(t, "", 1), "대외활동", t);
});
