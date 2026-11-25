import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { splitByMatch } from "../match";
import { matchesQuery } from "../search";
import { daysLeft, isPast } from "../deadline";
import { CATEGORIES } from "../constants";
import ConditionPanel from "../components/ConditionPanel";
import ResultSection from "../components/ResultSection";
import Card from "../components/Card";
import Hero from "../components/Hero";
import RecommendBox from "../components/RecommendBox";
import BottomBar from "../components/BottomBar";

// 홈 화면. App이 가진 state를 Outlet context(props)로 받아서 조건 입력 + 결과를 보여준다.
export default function HomePage() {
  const c = useOutletContext();
  const navigate = useNavigate();
  const [showIneligible, setShowIneligible] = useState(false);

  // 적용된 검색어 + 카테고리 + 즐겨찾기만 필터. 마감 지난 건 제외. 데이터는 App이 불러온 c.postings.
  const q = c.applied.query.trim();
  const live = c.postings
    .filter((a) => !isPast(a.deadline))
    .filter((a) => matchesQuery(a, q))
    .filter((a) => c.cats.has(a.category))
    .filter((a) => !c.favOnly || c.favorites.has(a.id));

  const { eligible, review, near, ineligible } = splitByMatch(live, c.matchProfile);
  // 대기업 활동이 소규모 단체 서포터즈 사이에 묻힌다는 피드백으로, 정렬 전에 대기업 여부를 우선 기준으로 둔다.
  const bySort = c.sortBy === "recent"
    ? (a, b) => (a.postedAt < b.postedAt ? 1 : a.postedAt > b.postedAt ? -1 : 0)
    : (a, b) => daysLeft(a.deadline) - daysLeft(b.deadline);
  const byMajorCorpThen = (a, b) => (b.majorCorp - a.majorCorp) || bySort(a, b);
  [eligible, review, near, ineligible].forEach((arr) => arr.sort(byMajorCorpThen));
  // 대기업·준중형 이상 주최 활동은 별도 칸으로 뺀다(지원 불가 제외). 중복 표시를 막으려고 원래 칸에서는 뺀다.
  const isBig = (a) => a.majorCorp && a.category !== "공모전" && a.category !== "지자체";
  const big = [...eligible, ...review, ...near].filter(isBig).sort(bySort);
  const notBig = (arr) => arr.filter((a) => !isBig(a));
  const total = eligible.length + review.length + near.length + ineligible.length;

  const openDetail = (item) => navigate(`/activity/${item.id}`);

  // 히어로용: 마감 안 지난 전체 공고 수(규모)와 마지막 수집 시각(신선도). 필터와 무관하게 전체 기준.
  const liveCount = c.postings.filter((a) => !isPast(a.deadline)).length;
  const lastCollected = c.postings.reduce((max, a) => (a.collectedAt > max ? a.collectedAt : max), "");

  return (
    <>
      <Hero count={liveCount} updatedAt={lastCollected} />
      {!c.loading && !c.loadError && (
        <RecommendBox postings={c.postings} favorites={c.favorites} onToggleFav={c.toggleFav} onOpen={openDetail} />
      )}
      <ConditionPanel
        profile={c.profile} setField={c.setField}
        showScholarship={c.showScholarship} setShowScholarship={c.setShowScholarship}
        query={c.query} setQuery={c.setQuery} runSearch={c.runSearch}
      />

      {c.loading ? (
        <p className="empty">공고를 불러오는 중…</p>
      ) : c.loadError ? (
        <p className="empty">공고를 불러오지 못했어요: {c.loadError.message}</p>
      ) : (
        <section className="results">
          <div className="filters">
            {CATEGORIES.map((cat) => (
              <button key={cat} className={"chip" + (c.cats.has(cat) ? " on" : "")} onClick={() => c.toggleCat(cat)}>{cat}</button>
            ))}
            <button className={"chip fav-chip" + (c.favOnly ? " on" : "")} onClick={() => c.setFavOnly((f) => !f)}>★ 즐겨찾기만</button>
          </div>

          <div className="result-head">
            <div className="summary">
              <span className="s-eligible">가능 {eligible.length}</span>
              <span className="s-review">확인 필요 {review.length}</span>
              {near.length > 0 && <span className="s-near">거의 가능 {near.length}</span>}
            </div>
            <select className="sort-select" value={c.sortBy} onChange={(e) => c.setSortBy(e.target.value)}>
              <option value="deadline">마감 임박순</option>
              <option value="recent">최신 등록순</option>
            </select>
          </div>

          <ResultSection id="sec-big" title="대기업·준중형 이상 활동" items={big} cls="big" favorites={c.favorites} onToggleFav={c.toggleFav} onOpen={openDetail} />
          <ResultSection id="sec-eligible" title="지원 가능" items={notBig(eligible)} cls="eligible" favorites={c.favorites} onToggleFav={c.toggleFav} onOpen={openDetail} />
          <ResultSection id="sec-review" title="확인 필요" items={notBig(review)} cls="review" favorites={c.favorites} onToggleFav={c.toggleFav} onOpen={openDetail} />
          <ResultSection id="sec-near" title="거의 가능 (조건 하나만 맞추면)" items={notBig(near)} cls="near" favorites={c.favorites} onToggleFav={c.toggleFav} onOpen={openDetail} />

          {ineligible.length > 0 && (
            <div id="sec-ineligible" className="section ineligible">
              <button className="fold" onClick={() => setShowIneligible((s) => !s)}>
                지원 불가 {ineligible.length}건 {showIneligible ? "접기" : "펼치기"}
              </button>
              {showIneligible && (
                <div className="cards">
                  {ineligible.map((it) => (
                    <Card key={it.id} item={it} fav={c.favorites.has(it.id)} onToggleFav={() => c.toggleFav(it.id)} onOpen={() => openDetail(it)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {total === 0 && <p className="empty">조건에 맞는 공고가 없어요. 필터나 검색어를 바꿔보세요.</p>}
        </section>
      )}
      {!c.loading && !c.loadError && total > 0 && (
        <BottomBar
          counts={{ eligible: eligible.length, review: review.length, near: near.length, ineligible: ineligible.length }}
          onJumpIneligible={() => setShowIneligible(true)}
        />
      )}
    </>
  );
}
