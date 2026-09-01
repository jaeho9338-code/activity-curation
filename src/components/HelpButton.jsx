import { useState } from "react";

// 처음 온 사람을 위한 간단 사용 안내. "?" 버튼을 누르면 팝오버로 핵심 사용법을 보여준다.
// 배경(backdrop)을 누르면 닫힌다. 상태·데이터를 안 건드리는 순수 UI라 로컬 상태만 쓴다.
export default function HelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="help">
      <button
        className="help-btn"
        aria-label="사용 안내"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <>
          <div className="help-backdrop" onClick={() => setOpen(false)} />
          <div className="help-pop" role="dialog" aria-label="사용 안내">
            <h4>이렇게 쓰면 돼요</h4>
            <ul>
              <li>
                <b>AI 추천</b> — 원하는 걸 문장으로 적으면(예: "서울 사는 경영 3학년, 대기업 대외활동 추천") 지원 가능한 것 중에 딱 맞는 걸 골라줘요.
              </li>
              <li>
                <b>내 조건</b> — 학년·전공·지역을 넣으면 지원 가능한 게 위로 올라와요. <span className="hl-ok">초록=가능</span>, <span className="hl-review">주황=확인 필요</span>, <span className="hl-no">빨강=불가</span>.
              </li>
              <li>
                <b>즐겨찾기 ★</b> — 이 브라우저에만 저장돼요. 다른 기기나 사람에게는 안 보여요.
              </li>
              <li>
                <b>항상 최신</b> — 마감 지난 공고는 자동으로 걸러지고 매일 아침 새 공고가 채워져요.
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
