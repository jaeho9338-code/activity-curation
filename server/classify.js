// 대외활동 공고를 화면 카테고리(대외활동·봉사·동아리)로 다시 나눈다.
// 동아리는 지우지 않고(총망라) 기본 숨김 카테고리로 보낸다. 봉사는 대외활동과 따로 본다.
import { isClubNoise } from "./noiseFilter.js";

// 기관이 역할을 정해 뽑는 프로그램 신호. 링커리어 '동아리/서포터즈' 유형(2)에서 이게 있으면 대외활동으로 남긴다.
const PROGRAM = /서포터즈|기자단|앰버서더|앰배서더|에디터|리포터|홍보대사|체험단|리뷰단|멘토|인턴|원정대|프로그램|공모|경진|대회|교육|양성|국비|참가자|시민|창업|캠프|챌린지|어워즈|페스티벌|인증/;

// '부원/멤버' 말고도 크루·밴드·클럽으로 새는 사설 모임.
const CREW = /크루원|크루\s*모집|크루\s*\d+기|밴드|클럽|CLUB|멤버\s*모집|멤버를\s*모집|단원\s*모집/i;

// 봉사단·봉사자 모집 등 봉사 성격. '봉사' 단어가 제목에 있으면 봉사로 본다.
const VOLUNTEER = /봉사/;

// linkareerType: 링커리어 activityTypeID(2 = 동아리/서포터즈). 다른 소스는 넘기지 않는다.
export function classifyActivity(title, org = "", linkareerType = null) {
  const t = `${title || ""} ${org || ""}`;
  if (isClubNoise(t)) return "동아리";
  if (CREW.test(title || "") && !PROGRAM.test(title || "")) return "동아리";
  if (VOLUNTEER.test(title || "")) return "봉사";
  if (linkareerType === 2 && !PROGRAM.test(title || "")) return "동아리";
  return "대외활동";
}
