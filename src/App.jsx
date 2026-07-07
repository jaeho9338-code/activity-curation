import { useState } from "react";
import { ACTIVITIES, MAJORS, REGIONS } from "./data/activities";
import { splitByEligibility } from "./match";
import "./App.css";

const USER_MAJORS = MAJORS.filter((m) => m !== "무관");
const USER_REGIONS = REGIONS.filter((r) => r !== "전국");

export default function App() {
  // 내 조건 (프로필)
  const [profile, setProfile] = useState({
    grade: 3,
    major: "공학",
    region: "수도권",
    income: 5,
  });

  const set = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

  const { eligible, ineligible } = splitByEligibility(ACTIVITIES, profile);

  return (
    <main>
      <header className="head">
        <h1>대외활동 큐레이션</h1>
        <p>내 조건을 입력하면, 지원 가능한 활동만 골라줍니다.</p>
      </header>

      <section className="form">
        <label>
          학년
          <select value={profile.grade} onChange={(e) => set("grade", Number(e.target.value))}>
            {[1, 2, 3, 4].map((g) => (
              <option key={g} value={g}>{g}학년</option>
            ))}
          </select>
        </label>
        <label>
          전공
          <select value={profile.major} onChange={(e) => set("major", e.target.value)}>
            {USER_MAJORS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          지역
          <select value={profile.region} onChange={(e) => set("region", e.target.value)}>
            {USER_REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          소득분위
          <select value={profile.income} onChange={(e) => set("income", Number(e.target.value))}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}분위</option>
            ))}
          </select>
        </label>
      </section>

      <section>
        <h2 className="section-title ok">지원 가능 ({eligible.length})</h2>
        <ul className="list">
          {eligible.map((a) => (
            <li key={a.id} className="card">
              <div className="card-top">
                <span className="cat">{a.category}</span>
                <span className="deadline">~{a.deadline}</span>
              </div>
              <a className="title" href={a.url} target="_blank" rel="noopener">{a.title}</a>
              <p className="org">{a.org} · {a.source}</p>
            </li>
          ))}
          {eligible.length === 0 && <li className="empty">조건에 맞는 활동이 없습니다.</li>}
        </ul>
      </section>

      <section>
        <h2 className="section-title no">지원 불가 ({ineligible.length})</h2>
        <ul className="list">
          {ineligible.map((a) => (
            <li key={a.id} className="card muted">
              <span className="title-muted">{a.title}</span>
              <p className="reason">막힌 조건: {a.failed.join(", ")}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
