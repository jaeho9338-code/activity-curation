// isClubNoise 회귀 테스트. 실제 DB에서 샜던 동아리·스터디 제목(걸러야 함)과
// 이력에 도움되는 것(서포터즈·공모전·지원사업 = 살려야 함)을 함께 고정한다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isClubNoise } from "./noiseFilter.js";

// 걸러내야 하는 것 (실측으로 대외활동에 샜던 캐주얼 동아리·스터디)
const NOISE_CASES = [
  "*토익 스터디 인원 모집",
  "[Adobe 디자인툴 스터디] 디자인툴 3대장 Photoshop, Illustrator",
  "[영상편집 스터디] 모여봐요 편집의 숲 3기 모집",
  "포토샵 스터디 [누끼의민족] 3기 모집",
  "방탈출 동아리 와방(WABANG)에서 방린이 !집중! 모집합니다!",
  "<말해보중> 중국어 회화 동아리",
  "Try : 버킷리스트 동아리",
  "대학생 여름 액티비티 동아리waterpool (워터풀)",
  "체크인 - 독서 습관 만들기 연합 동아리 3기",
  "로그아웃하고 싶은 날 찾게 되는 동아리 [LOG-OUT]",
  "동아리에 제휴처가 이렇게 많다고? 대학생 1위 동아리",
  "실전 마케팅 연합동아리 MARKETING:ON (마케팅온) 2기 멤버 모집",
];

// 살려야 하는 것 (이력에 도움되는 대외활동 - 서포터즈·공모전·지자체 지원사업)
const KEEP_CASES = [
  "2026년 디지털성범죄예방동아리 '부엉이서포터즈 3기' 추가 모집", // 서포터즈
  "콘텐츠 공모전 동아리 -TARGETer- 신입부원 모집 중입니다",       // 공모전
  "서울 동아리ON 대학생 동아리 지원사업 참여자 모집",             // 지원사업
  "청년 소모임 지원 프로그램",                                    // 소모임 지원
  "2026 대학생 마케팅 서포터즈 모집",                             // 서포터즈(동아리 아님)
  "제10회 전국 대학생 광고 공모전",                              // 공모전
];

test("캐주얼 동아리·스터디는 노이즈로 걸러진다", () => {
  for (const t of NOISE_CASES) assert.equal(isClubNoise(t), true, `걸러져야 함: ${t}`);
});

test("서포터즈·공모전·지원사업은 살린다", () => {
  for (const t of KEEP_CASES) assert.equal(isClubNoise(t), false, `살려야 함: ${t}`);
});
