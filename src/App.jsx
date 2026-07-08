import { useState } from "react";
import { ACTIVITIES, MAJORS, REGIONS, ENROLLMENTS } from "./data/activities";
import { splitByMatch } from "./match";
import { isPast, ddayLabel, daysLeft } from "./deadline";
import "./App.css";

const GPA_OPTIONS = [4.5, 4.0, 3.5, 3.0, 2.5];

// 불가 사유별로 그 자리에서 바로 고칠 수 있는 컨트롤 매핑
const FIX = {
  학년: { key: "grade", opts: [1, 2, 3, 4], fmt: (v) => v + "학년", parse: Number },
  전공: { key: "major", opts: MAJORS, fmt: (v) => v, parse: String },
  지역: { key: "region", opts: REGIONS, fmt: (v) => v, parse: String },
  재학상태: { key: "enrollment", opts: ENROLLMENTS, fmt: (v) => v, parse: String },
  소득분위: { key: "income", opts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], fmt: (v) => v + "분위", parse: Number },
  학점: { key: "gpa", opts: GPA_OPTIONS, fmt: (v) => v.toFixed(1), parse: Number },
};

function InlineFix({ label, profile, set }) {
  const cfg = FIX[label];
  if (!cfg) return null;
  return (
    <select className="fix" value={profile[cfg.key] ?? ""} onChange={(e) => set(cfg.key, cfg.parse(e.target.value))}>
      {cfg.opts.map((o) => <option key={o} value={o}>{cfg.fmt(o)}</option>)}
    </select>
  );
}

export default function App() {
  // 내 조건. income·gpa는 null이면 "잘 모름" → 매칭에서 확인 필요로 처리된다.
  const [profile, setProfile] = useState({
    grade: 3,
    major: "공학",
    region: "수도권",
    enrollment: "재학",
    income: null,
    gpa: null,
  });
  const [showScholarship, setShowScholarship] = useState(false);

  const set = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

  // 장학 보기 토글: 끄면 소득·학점을 잘 모름으로 되돌린다
  const toggleScholarship = (on) => {
    setShowScholarship(on);
    if (!on) setProfile((p) => ({ ...p, income: null, gpa: null }));
  };

  // 마감 지난 공고는 목록에서 뺀다
  const visible = ACTIVITIES.filter((a) => !isPast(a.deadline));
  const { eligible, ineligible, review } = splitByMatch(visible, profile);

  return (
    <main>
      <header className="head">
        <h1>대외활동 큐레이션</h1>
        <p>내 조건을 입력하면, 지원 가능한 것만 골라줍니다. 모르는 항목은 잘 모름으로 두세요.</p>
      </header>

      <section className="form">
        <label>
          학년
          <select value={profile.grade} onChange={(e) => set("grade", Number(e.target.value))}>
            {[1, 2, 3, 4].map((g) => <option key={g} value={g}>{g}학년</option>)}
          </select>
        </label>
        <label>
          전공
          <select value={profile.major} onChange={(e) => set("major", e.target.value)}>
            {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label>
          지역
          <select value={profile.region} onChange={(e) => set("region", e.target.value)}>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>
          재학상태
          <select value={profile.enrollment} onChange={(e) => set("enrollment", e.target.value)}>
            {ENROLLMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        {showScholarship && (
          <>
            <label>
              소득분위
              <select
                value={profile.income ?? ""}
                onChange={(e) => set("income", e.target.value === "" ? null : Number(e.target.value))}
              >
                <option value="">잘 모름</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}분위</option>)}
              </select>
            </label>
            <label>
              학점
              <select
                value={profile.gpa ?? ""}
                onChange={(e) => set("gpa", e.target.value === "" ? null : Number(e.target.value))}
              >
                <option value="">잘 모름</option>
                {GPA_OPTIONS.map((v) => <option key={v} value={v}>{v.toFixed(1)}</option>)}
              </select>
            </label>
          </>
        )}
      </section>

      <label className="scholar-toggle">
        <input type="checkbox" checked={showScholarship} onChange={(e) => toggleScholarship(e.target.checked)} />
        장학·지원금도 볼래요 (소득분위·학점 입력)
      </label>

      <section>
        <h2 className="section-title ok">지원 가능 ({eligible.length})</h2>
        <ul className="list">
          {eligible.map((a) => (
            <li key={a.id} className="card">
              <div className="card-top">
                <span className="cat">{a.category}</span>
                <span className={"deadline" + (daysLeft(a.deadline) <= 7 ? " imminent" : "")}>{ddayLabel(a.deadline)}</span>
              </div>
              <a className="title" href={a.url} target="_blank" rel="noopener">{a.title}</a>
              <p className="org">{a.org} · {a.source}</p>
              <p className="evidence">근거: {a.eligibilityText}</p>
            </li>
          ))}
          {eligible.length === 0 && <li className="empty">조건에 맞는 활동이 없습니다.</li>}
        </ul>
      </section>

      <section>
        <h2 className="section-title review">확인 필요 ({review.length})</h2>
        <ul className="list">
          {review.map((a) => (
            <li key={a.id} className="card review-card">
              <div className="card-top">
                <span className="cat">{a.category}</span>
                <span className={"deadline" + (daysLeft(a.deadline) <= 7 ? " imminent" : "")}>{ddayLabel(a.deadline)}</span>
              </div>
              <a className="title" href={a.url} target="_blank" rel="noopener">{a.title}</a>
              <p className="note">확인 필요: {a.unknown.map((u) => `${u.label}(${u.req})`).join(", ")} — 잘 모름으로 판정 보류</p>
              <p className="evidence">근거: {a.eligibilityText}</p>
            </li>
          ))}
          {review.length === 0 && <li className="empty">확인이 필요한 활동이 없습니다.</li>}
        </ul>
      </section>

      <section>
        <h2 className="section-title no">지원 불가 ({ineligible.length})</h2>
        <ul className="list">
          {ineligible.map((a) => (
            <li key={a.id} className="card muted">
              <div className="card-top">
                <span className="title-muted">{a.title}</span>
                {a.failed.length === 1 && <span className="near">이것만 바꾸면 가능</span>}
              </div>
              <ul className="reasons">
                {a.failed.map((f) => (
                  <li key={f.label}>
                    <span className="rlabel">{f.label}</span>
                    <span className="req">요구 {f.req}</span>
                    <span className="mine">내 조건 {f.mine}</span>
                    {a.failed.length === 1 && <InlineFix label={f.label} profile={profile} set={set} />}
                  </li>
                ))}
              </ul>
              <p className="evidence">근거: {a.eligibilityText}</p>
            </li>
          ))}
          {ineligible.length === 0 && <li className="empty">막힌 활동이 없습니다.</li>}
        </ul>
      </section>
    </main>
  );
}
