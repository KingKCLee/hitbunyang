// 히트분양 - 히트랭킹(/ranking), 커뮤니티(/community), TV(/tv), 광고안내(/ad-info), 맞춤현장(/match) 페이지

// ============================================================
// 히트랭킹 페이지 (/ranking)
// ============================================================
async function renderRankingPageContent(container) {
  const params = new URLSearchParams(location.search);
  const tab = params.get('tab') || 'sites';

  container.innerHTML = `
  <div class="ranking-page">
    <div class="ranking-header">
      <div class="container">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <i class="fas fa-trophy" style="font-size:1.5rem;color:#fcd34d"></i>
          <div>
            <h1 class="sites-page-title">히트랭킹</h1>
            <p class="sites-page-subtitle">히트지수 기반 실시간 현장 · 대행사 랭킹</p>
          </div>
        </div>
      </div>
    </div>
    <div class="container" style="padding-top:1.5rem;padding-bottom:3rem">
      <div class="tab-list">
        <button class="tab-item ${tab==='sites'?'active':''}" onclick="setRankingTab('sites')">
          <i class="fas fa-building"></i> 현장 TOP 50
        </button>
        <button class="tab-item ${tab==='agency'?'active':''}" onclick="setRankingTab('agency')">
          <i class="fas fa-users"></i> 대행사 랭킹
        </button>
        <button class="tab-item ${tab==='trend'?'active':''}" onclick="setRankingTab('trend')">
          <i class="fas fa-chart-line"></i> 트렌드
        </button>
      </div>
      <div id="ranking-content">
        <div class="loading-overlay"><div class="spinner"></div></div>
      </div>
    </div>
  </div>`;

  window.setRankingTab = function(t) {
    const p = new URLSearchParams(location.search);
    p.set('tab', t);
    history.replaceState({}, '', '/ranking?' + p.toString());
    loadRankingTab(t);
  };

  loadRankingTab(tab);
}

async function loadRankingTab(tab) {
  const el = document.getElementById('ranking-content');
  if (!el) return;
  el.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;

  // Update active tab
  document.querySelectorAll('.tab-item').forEach((btn, i) => {
    const tabs = ['sites','agency','trend'];
    btn.classList.toggle('active', tabs[i] === tab);
  });

  if (tab === 'sites') await loadRankingSites(el);
  else if (tab === 'agency') loadRankingAgency(el);
  else loadRankingTrend(el);
}

async function loadRankingSites(el) {
  const r = await api.get('/properties/best?limit=50');
  const properties = r.ok ? r.data : [];

  // Generate demo if empty
  const demoData = properties.length ? properties : generateDemoProperties(50);

  el.innerHTML = `
  <div class="ranking-info-bar">
    <div class="ranking-info-item">
      <i class="fas fa-fire" style="color:#dc2626"></i>
      <span>히트지수 80+ = 🔥 히트</span>
    </div>
    <div class="ranking-info-item">
      <i class="fas fa-bolt" style="color:#f97316"></i>
      <span>50~79 = ⚡ 인기</span>
    </div>
    <div class="ranking-info-item">
      <i class="fas fa-arrow-up" style="color:#3b82f6"></i>
      <span>~49 = 📈 상승</span>
    </div>
    <div style="margin-left:auto;font-size:0.8rem;color:#6b7280">
      매 시간 업데이트 · ${new Date().toLocaleTimeString('ko-KR', {hour:'2-digit',minute:'2-digit'})} 기준
    </div>
  </div>
  <div class="ranking-table">
    <div class="ranking-table-header">
      <span class="rank-col">순위</span>
      <span class="name-col">현장명</span>
      <span class="region-col desktop-only">지역</span>
      <span class="score-col">히트지수</span>
      <span class="change-col desktop-only">변동</span>
      <span class="views-col desktop-only">조회수</span>
    </div>
    ${demoData.map((p, i) => {
      const score = calcHitScore(p);
      const color = getHitScoreColor(score);
      const label = getHitScoreLabel(score);
      const change = Math.floor(Math.random() * 5) - 2;
      const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`;
      return `
      <div class="ranking-row ${i < 3 ? 'ranking-top3' : ''}" onclick="navigate('/properties/${p.id||1}')">
        <span class="rank-col">
          <span class="rank-num ${i < 3 ? ['gold','silver','bronze'][i] : ''}">${rankIcon}</span>
        </span>
        <span class="name-col">
          <div class="ranking-name">${escapeHtml(p.title || '힐스테이트 판교역 퍼스트')}</div>
          ${p.subtitle ? `<div class="ranking-sub">${escapeHtml(p.subtitle)}</div>` : ''}
        </span>
        <span class="region-col desktop-only">
          <span class="region-tag" style="background:${getRegionColor(p.region)}15;color:${getRegionColor(p.region)};border:1px solid ${getRegionColor(p.region)}30">
            ${escapeHtml(p.region || '서울')}
          </span>
        </span>
        <span class="score-col">
          <div class="ranking-score-wrap">
            <span class="ranking-score-num" style="color:${color}">${score}</span>
            <div class="ranking-score-bar">
              <div style="width:${score}%;background:${color};height:100%;border-radius:3px"></div>
            </div>
            <span class="ranking-score-label" style="color:${color}">${label}</span>
          </div>
        </span>
        <span class="change-col desktop-only">
          <span class="rank-change ${change > 0 ? 'up' : change < 0 ? 'down' : 'same'}">
            ${change > 0 ? `▲${change}` : change < 0 ? `▼${Math.abs(change)}` : '→'}
          </span>
        </span>
        <span class="views-col desktop-only" style="font-size:0.85rem;color:#6b7280">
          ${(p.view_count||Math.floor(Math.random()*10000)).toLocaleString()}
        </span>
      </div>`;
    }).join('')}
  </div>`;
}

function generateDemoProperties(count) {
  const names = ['힐스테이트 판교역','래미안 원펜타스','DMC SK뷰아이파크','더샵 퍼스트파크','롯데캐슬 시그니처',
    '광교 아이파크','힐스테이트 용인','포레나 부산','자이 더 엘리언트','SK뷰 위례',
    'e편한세상 파크센트럴','대우 푸르지오','아이파크 시티','두산위브 제니스','서해그랑블'];
  const regions = ['서울','경기북부','경기남부','인천','부산','대구','광주','대전','충청','전라','경상','강원'];
  const types = ['apartment','officetel','commercial'];
  
  return Array.from({length: count}, (_, i) => ({
    id: i + 1,
    title: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i/names.length)+1}차` : ''),
    subtitle: '프리미엄 분양 현장',
    region: regions[i % regions.length],
    property_type: types[i % types.length],
    view_count: Math.floor(Math.random() * 20000) + 100,
    inquiry_count: Math.floor(Math.random() * 200) + 5,
    share_count: Math.floor(Math.random() * 100),
    is_new: i < 5,
    is_hot: i < 10,
    ad_type: i < 3 ? 'hit' : i < 8 ? 'premium' : 'free',
    price_min: (3 + i * 0.5) * 100000000,
    price_max: (5 + i * 0.7) * 100000000,
  }));
}

function loadRankingAgency(el) {
  const agencies = Array.from({length: 20}, (_, i) => ({
    name: ['한국분양대행', '히트분양팀', '전국1번지', '수도권분양', '프리미엄대행', 
           '블루오션분양', '스마트분양', '현장직판', '골든게이트', '탑클래스'][i % 10] + (i >= 10 ? ` ${i-9}지점` : ''),
    jobs: Math.floor(Math.random() * 30) + 5,
    avgScore: Math.floor(Math.random() * 30) + 60,
    reviews: (3.5 + Math.random() * 1.5).toFixed(1),
    members: Math.floor(Math.random() * 50) + 10,
  }));

  el.innerHTML = `
  <div class="agency-ranking">
    <div class="agency-ranking-desc">
      활성 채용 공고 수, 평균 히트지수, 멤버 리뷰 점수로 산정됩니다.
    </div>
    <div class="ranking-table">
      <div class="ranking-table-header">
        <span class="rank-col">순위</span>
        <span class="name-col">대행사명</span>
        <span style="min-width:60px;text-align:center">공고수</span>
        <span style="min-width:80px;text-align:center">평균 히트지수</span>
        <span style="min-width:80px;text-align:center desktop-only">리뷰점수</span>
      </div>
      ${agencies.map((a, i) => `
      <div class="ranking-row" style="cursor:default">
        <span class="rank-col">
          <span class="rank-num ${i < 3 ? ['gold','silver','bronze'][i] : ''}">${i < 3 ? ['🥇','🥈','🥉'][i] : i+1}</span>
        </span>
        <span class="name-col">
          <div class="ranking-name">${a.name}</div>
          <div class="ranking-sub">멤버 ${a.members}명</div>
        </span>
        <span style="min-width:60px;text-align:center;font-weight:700">${a.jobs}개</span>
        <span style="min-width:80px;text-align:center">
          <span style="color:${getHitScoreColor(a.avgScore)};font-weight:700">${a.avgScore}</span>
        </span>
        <span style="min-width:80px;text-align:center" class="desktop-only">
          <span style="color:#f59e0b">★</span> ${a.reviews}
        </span>
      </div>`).join('')}
    </div>
  </div>`;
}

function loadRankingTrend(el) {
  el.innerHTML = `
  <div class="trend-section">
    <div class="trend-grid">
      <div class="trend-card">
        <div class="trend-card-title"><i class="fas fa-search"></i> 검색량 TOP 5 지역</div>
        ${['서울 강남', '경기 판교', '인천 송도', '부산 해운대', '경기 위례'].map((r, i) => `
          <div class="trend-item">
            <span class="trend-rank">${i+1}</span>
            <span class="trend-name">${r}</span>
            <div class="trend-bar-wrap">
              <div class="trend-bar" style="width:${100 - i * 15}%"></div>
            </div>
            <span class="trend-pct">${100 - i * 15}%</span>
          </div>`).join('')}
      </div>
      <div class="trend-card">
        <div class="trend-card-title"><i class="fas fa-percent"></i> 평균 수수료 추이</div>
        ${['1월','2월','3월','4월','5월','6월'].map((m, i) => {
          const rate = (3.2 + i * 0.15).toFixed(1);
          return `
          <div class="trend-item">
            <span class="trend-rank" style="font-weight:500;font-size:0.82rem">${m}</span>
            <div class="trend-bar-wrap">
              <div class="trend-bar" style="width:${(parseFloat(rate)/5)*100}%;background:#10b981"></div>
            </div>
            <span class="trend-pct" style="color:#10b981">${rate}%</span>
          </div>`;
        }).join('')}
      </div>
      <div class="trend-card">
        <div class="trend-card-title"><i class="fas fa-plus-circle"></i> 이번 주 신규 등록</div>
        ${['서울','경기북부','경기남부','인천','부산','대구','전라','경상'].map((r, i) => {
          const count = Math.floor(Math.random() * 50) + 10;
          return `
          <div class="trend-item">
            <span class="trend-rank" style="font-weight:500;font-size:0.82rem;color:${getRegionColor(r)}">${r}</span>
            <div class="trend-bar-wrap">
              <div class="trend-bar" style="width:${count/60*100}%;background:${getRegionColor(r)}"></div>
            </div>
            <span class="trend-pct">${count}건</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="trend-hot-keywords">
      <div class="trend-card-title" style="margin-bottom:0.75rem"><i class="fas fa-fire"></i> 실시간 인기 키워드</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
        ${['판교','강남','위례','송도','해운대','광교','동탄','세종','청라','분당','마곡','용산'].map((k, i) => `
          <button class="keyword-chip" onclick="navigate('/sites?search=${encodeURIComponent(k)}')" 
            style="font-size:${i < 3 ? 1.05 : 0.85}rem;font-weight:${i < 3 ? 700 : 500}">
            ${i < 3 ? '🔥' : ''} ${k}
          </button>`).join('')}
      </div>
    </div>
  </div>`;
}

// ============================================================
// 커뮤니티 페이지 (/community)
// ============================================================
function renderCommunityPageContent(container) {
  const params = new URLSearchParams(location.search);
  const tab = params.get('tab') || 'review';

  const tabs = [
    { id: 'review', label: '현장후기', icon: 'fa-star' },
    { id: 'free', label: '자유게시판', icon: 'fa-pen' },
    { id: 'info', label: '정보공유', icon: 'fa-info-circle' },
    { id: 'qa', label: 'Q&A', icon: 'fa-question-circle' },
  ];

  const demoPosts = {
    review: [
      { id: 1, title: '래미안 원펜타스 계약 완료 후기 (팀장 입장에서)', author: '김분양', date: '2025-06-01', views: 1243, likes: 87, comments: 34, stars: 5, badge: '현장후기' },
      { id: 2, title: '힐스테이트 판교역 첫날 방문 솔직 리뷰', author: '박대행', date: '2025-05-28', views: 876, likes: 56, comments: 21, stars: 4, badge: '현장후기' },
      { id: 3, title: '인천 송도 롯데캐슬 - 수수료 실제로 받아봤어요', author: '이팀원', date: '2025-05-25', views: 654, likes: 43, comments: 17, stars: 4, badge: '현장후기' },
      { id: 4, title: '위례신도시 SK뷰 대비 다른 현장 비교 후기', author: '최팀장', date: '2025-05-20', views: 1087, likes: 72, comments: 28, stars: 3, badge: '현장후기' },
    ],
    free: [
      { id: 5, title: '팀장 첫 달 수입 공개합니다 (솔직 후기)', author: '익명', date: '2025-06-02', views: 3421, likes: 156, comments: 87, badge: '자유게시판' },
      { id: 6, title: '분양 시장 요즘 어떤가요? 다들 얼마나 버세요', author: '분양러', date: '2025-05-30', views: 2198, likes: 98, comments: 64, badge: '자유게시판' },
      { id: 7, title: '새벽에 계약한 거 취소 통보 받았습니다... 도움 요청', author: '힘들어요', date: '2025-05-28', views: 1876, likes: 43, comments: 52, badge: '자유게시판' },
    ],
    info: [
      { id: 8, title: '2025 하반기 전국 분양 일정 총정리 (엑셀 첨부)', author: '정보왕', date: '2025-06-01', views: 5432, likes: 213, comments: 45, badge: '정보공유' },
      { id: 9, title: '계약금 5% vs 10% 차이 완벽 정리', author: '부동산전문가', date: '2025-05-27', views: 3214, likes: 145, comments: 38, badge: '정보공유' },
      { id: 10, title: '분양팀원→팀장 승진 조건 알아보기', author: '커리어업', date: '2025-05-23', views: 2876, likes: 121, comments: 29, badge: '정보공유' },
    ],
    qa: [
      { id: 11, title: '계약금 환급 조건이 정확히 어떻게 되나요?', author: '궁금해요', date: '2025-06-02', views: 432, likes: 12, comments: 6, answered: true, badge: 'Q&A' },
      { id: 12, title: '팀원 경력 없어도 지원 가능한가요?', author: '새내기', date: '2025-06-01', views: 287, likes: 8, comments: 4, answered: true, badge: 'Q&A' },
      { id: 13, title: '수수료 계약 전에 미리 확인해야 할 게 있나요?', author: '신입팀원', date: '2025-05-31', views: 376, likes: 15, comments: 9, answered: false, badge: 'Q&A' },
    ],
  };

  container.innerHTML = `
  <div class="community-page">
    <div class="community-header">
      <div class="container">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <i class="fas fa-comments" style="font-size:1.5rem;color:white;opacity:0.9"></i>
          <div>
            <h1 class="sites-page-title">커뮤니티</h1>
            <p class="sites-page-subtitle">현장 후기, 정보 공유, Q&A를 함께해요</p>
          </div>
        </div>
      </div>
    </div>
    <div class="container" style="padding-top:1.5rem;padding-bottom:3rem">
      <div class="community-layout">
        <div class="community-main">
          <div class="tab-list">
            ${tabs.map(t => `
              <button class="tab-item ${tab===t.id?'active':''}" onclick="setCommunityTab('${t.id}')">
                <i class="fas ${t.icon}"></i> ${t.label}
              </button>`).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <span style="font-size:0.88rem;color:#6b7280">
              총 ${demoPosts[tab]?.length || 0}개 게시물
            </span>
            ${state.user ? `
              <button class="btn btn-primary btn-sm" onclick="openWriteModal && openWriteModal()">
                <i class="fas fa-pen"></i> 글쓰기
              </button>` : `
              <button class="btn btn-outline btn-sm" onclick="navigate('/login')">
                <i class="fas fa-sign-in-alt"></i> 로그인 후 글쓰기
              </button>`}
          </div>
          <div id="community-posts">
            ${renderCommunityPosts(demoPosts[tab] || [], tab)}
          </div>
        </div>
        <aside class="community-sidebar">
          <div class="community-widget">
            <div class="community-widget-title">🔥 HOT 게시물</div>
            ${demoPosts.free.slice(0,3).map(p => `
              <div class="community-hot-item">
                <span class="community-cat-badge" style="font-size:0.68rem">${p.badge}</span>
                <span class="community-hot-title">${p.title}</span>
                <span class="community-hot-stat"><i class="fas fa-heart"></i> ${p.likes}</span>
              </div>`).join('')}
          </div>
          <div class="community-widget">
            <div class="community-widget-title">📌 공지사항</div>
            <div style="font-size:0.82rem;color:#6b7280;line-height:1.8">
              <div>· 커뮤니티 이용 규칙 안내</div>
              <div>· 허위 후기 신고 안내</div>
              <div>· 우수 후기 포인트 지급</div>
            </div>
          </div>
          <div class="community-widget community-widget-cta" onclick="navigate('/ranking')">
            <div style="font-size:1.5rem;margin-bottom:0.5rem">🏆</div>
            <div style="font-weight:700;margin-bottom:0.25rem">히트랭킹 보기</div>
            <div style="font-size:0.8rem;opacity:0.7">현장 TOP 50 확인</div>
          </div>
        </aside>
      </div>
    </div>
  </div>`;

  window.setCommunityTab = function(t) {
    const p = new URLSearchParams(location.search);
    p.set('tab', t);
    history.replaceState({}, '', '/community?' + p.toString());
    document.querySelectorAll('.tab-item').forEach((btn, i) => {
      btn.classList.toggle('active', ['review','free','info','qa'][i] === t);
    });
    document.getElementById('community-posts').innerHTML = renderCommunityPosts(demoPosts[t] || [], t);
  };
}

function renderCommunityPosts(posts, tab) {
  if (!posts.length) return `<div class="empty-state"><div class="empty-state-icon">💬</div><div>게시물이 없습니다</div></div>`;
  return posts.map(p => `
  <div class="community-post-card" onclick="alert('준비 중입니다.')">
    <div class="community-post-header">
      <div style="display:flex;gap:0.4rem;align-items:center">
        <span class="community-cat-badge">${p.badge}</span>
        ${p.answered !== undefined ? `<span class="badge ${p.answered ? 'badge-green' : 'badge-orange'}">${p.answered ? '답변완료' : '미답변'}</span>` : ''}
        ${p.stars ? `<span style="color:#f59e0b;font-size:0.8rem">${'★'.repeat(p.stars)}${'☆'.repeat(5-p.stars)}</span>` : ''}
      </div>
      <span class="community-post-meta">${p.date}</span>
    </div>
    <div class="community-post-title">${p.title}</div>
    <div class="community-post-footer">
      <span class="community-post-author"><i class="fas fa-user-circle"></i> ${p.author}</span>
      <div class="community-post-stats">
        <span><i class="fas fa-eye"></i> ${p.views.toLocaleString()}</span>
        <span><i class="fas fa-heart"></i> ${p.likes}</span>
        <span><i class="fas fa-comment"></i> ${p.comments}</span>
      </div>
    </div>
  </div>`).join('');
}

// ============================================================
// 히트분양TV 페이지 (/tv)
// ============================================================
function renderTvPageContent(container) {
  const params = new URLSearchParams(location.search);
  const cat = params.get('cat') || 'all';

  const categories = [
    { id: 'all', label: '전체', icon: 'fa-play-circle' },
    { id: 'review', label: '현장리뷰', icon: 'fa-video' },
    { id: 'market', label: '시장분석', icon: 'fa-chart-bar' },
    { id: 'guide', label: '분양가이드', icon: 'fa-book' },
    { id: 'interview', label: '인터뷰', icon: 'fa-microphone' },
  ];

  const demoVideos = [
    { id: 'dQw4w9WgXcQ', title: '[현장리뷰] 힐스테이트 판교역 퍼스트 현장 방문 브이로그', channel: '히트분양TV', views: '12.4만', date: '2025-05-28', cat: 'review', site: '힐스테이트 판교역' },
    { id: 'dQw4w9WgXcQ', title: '2025 하반기 수도권 분양시장 전망 완전 분석', channel: '히트분양TV', views: '8.9만', date: '2025-05-25', cat: 'market', site: null },
    { id: 'dQw4w9WgXcQ', title: '분양 팀장이 되는 법 A to Z | 수수료 협상 꿀팁', channel: '히트분양TV', views: '6.2만', date: '2025-05-20', cat: 'guide', site: null },
    { id: 'dQw4w9WgXcQ', title: '[인터뷰] 월 수입 1000만원 분양 팀장의 비결', channel: '히트분양TV', views: '5.4만', date: '2025-05-18', cat: 'interview', site: null },
    { id: 'dQw4w9WgXcQ', title: '[현장리뷰] 래미안 원펜타스 - 서초 한강뷰 프리미엄', channel: '히트분양TV', views: '9.1만', date: '2025-05-15', cat: 'review', site: '래미안 원펜타스' },
    { id: 'dQw4w9WgXcQ', title: '인천 검단 신도시 분양 시장 현황 분석', channel: '히트분양TV', views: '3.8만', date: '2025-05-12', cat: 'market', site: null },
    { id: 'dQw4w9WgXcQ', title: '분양 팀원 → 팀장 승진 로드맵', channel: '히트분양TV', views: '4.2만', date: '2025-05-10', cat: 'guide', site: null },
    { id: 'dQw4w9WgXcQ', title: '[인터뷰] 10년 차 분양 베테랑이 말하는 시장 변화', channel: '히트분양TV', views: '2.9만', date: '2025-05-08', cat: 'interview', site: null },
  ];

  const filtered = cat === 'all' ? demoVideos : demoVideos.filter(v => v.cat === cat);

  container.innerHTML = `
  <div class="tv-page">
    <div class="tv-header">
      <div class="container">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <i class="fab fa-youtube" style="font-size:1.8rem;color:#ff0000"></i>
          <div>
            <h1 class="sites-page-title">히트분양TV</h1>
            <p class="sites-page-subtitle">분양 현장 리뷰 · 시장 분석 · 가이드 영상</p>
          </div>
        </div>
      </div>
    </div>
    <div class="container" style="padding-top:1.5rem;padding-bottom:3rem">
      <!-- 카테고리 탭 -->
      <div class="tab-list" style="margin-bottom:1.5rem">
        ${categories.map(c => `
          <button class="tab-item ${cat===c.id?'active':''}" onclick="setTvCat('${c.id}')">
            <i class="fas ${c.icon}"></i> ${c.label}
          </button>`).join('')}
      </div>
      <!-- 영상 그리드 -->
      <div class="tv-grid">
        ${filtered.map(v => `
          <div class="tv-card" onclick="openVideoModal('${v.id}', '${escapeHtml(v.title)}')">
            <div class="tv-thumb">
              <img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg" alt="${escapeHtml(v.title)}" 
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
                style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0">
              <div style="display:none;position:absolute;inset:0;background:linear-gradient(135deg,#7f1d1d,#dc2626);align-items:center;justify-content:center">
                <i class="fas fa-play" style="font-size:2rem;color:rgba(255,255,255,0.8)"></i>
              </div>
              <div class="tv-play-btn"><i class="fas fa-play"></i></div>
              <span class="tv-cat-badge">${categories.find(c => c.id === v.cat)?.label || v.cat}</span>
            </div>
            <div class="tv-card-body">
              <div class="tv-card-title">${escapeHtml(v.title)}</div>
              ${v.site ? `<button class="tv-site-link" onclick="event.stopPropagation();navigate('/sites?search=${encodeURIComponent(v.site)}')">
                <i class="fas fa-link"></i> ${v.site} 현장 보기
              </button>` : ''}
              <div class="tv-card-meta">
                <span><i class="fas fa-eye"></i> ${v.views}</span>
                <span>${v.date}</span>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </div>
  <!-- 영상 모달 -->
  <div id="video-modal" class="modal-overlay" style="display:none" onclick="closeVideoModal()">
    <div class="modal-content" style="max-width:800px;padding:0;border-radius:12px;overflow:hidden" onclick="event.stopPropagation()">
      <div style="position:relative;padding-bottom:56.25%;height:0">
        <iframe id="video-iframe" src="" frameborder="0" allow="autoplay;encrypted-media" allowfullscreen
          style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe>
      </div>
      <div style="padding:1rem;display:flex;justify-content:space-between;align-items:center">
        <div id="video-modal-title" style="font-weight:700;font-size:0.95rem"></div>
        <button onclick="closeVideoModal()" class="btn btn-secondary btn-sm">닫기</button>
      </div>
    </div>
  </div>`;

  window.setTvCat = function(c) {
    const p = new URLSearchParams(location.search);
    p.set('cat', c);
    history.replaceState({}, '', '/tv?' + p.toString());
    renderTvPage(document.getElementById('main-content'));
  };

  window.openVideoModal = function(id, title) {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    const titleEl = document.getElementById('video-modal-title');
    if (modal && iframe) {
      modal.style.display = 'flex';
      iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
      if (titleEl) titleEl.textContent = title;
    }
  };

  window.closeVideoModal = function() {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    if (modal) modal.style.display = 'none';
    if (iframe) iframe.src = '';
  };
}

// ============================================================
// 광고안내 페이지 (/ad-info)
// ============================================================
function renderAdInfoPageContent(container) {
  container.innerHTML = `
  <div class="adinfo-page">
    <div class="adinfo-header">
      <div class="container" style="text-align:center;padding:3rem 1rem">
        <div class="adinfo-header-badge">💰 광고 안내</div>
        <h1 class="adinfo-title">히트분양 광고 상품</h1>
        <p class="adinfo-subtitle">히트지수 시스템으로 최고의 노출 효과를 경험하세요</p>
      </div>
    </div>
    <div class="container" style="padding-bottom:3rem">
      <!-- 상품 카드 3종 -->
      <div class="adinfo-products-grid">
        ${[
          {
            name: '🔥 히트AD', price: '50만원', period: '/월',
            color: '#dc2626', bg: 'linear-gradient(135deg,#7f1d1d,#dc2626)',
            badge: '최고 노출',
            features: [
              '홈페이지 히어로 슬롯 고정 노출',
              '히트맵 마커 강조 표시',
              '히트지수 +15점 보너스',
              '현장찾기 최상단 고정',
              '배너 슬라이더 우선 배치',
              '월간 리포트 제공',
            ]
          },
          {
            name: '⭐ 프리미엄', price: '30만원', period: '/월',
            color: '#f59e0b', bg: 'linear-gradient(135deg,#78350f,#f59e0b)',
            badge: '인기',
            features: [
              '섹션 상단 우선 노출',
              '히트지수 +8점 보너스',
              '현장찾기 상위 노출',
              '카드 하이라이트 테두리',
              '주간 노출 현황 제공',
            ]
          },
          {
            name: '📌 스탠다드', price: '10만원', period: '/월',
            color: '#8b5cf6', bg: 'linear-gradient(135deg,#4c1d95,#8b5cf6)',
            badge: '기본',
            features: [
              '카드 하이라이트 배경',
              '히트지수 +4점 보너스',
              '일반 노출 보장',
              '기본 통계 제공',
            ]
          },
        ].map((p, i) => `
          <div class="adinfo-product-card ${i===0?'adinfo-product-featured':''}">
            ${i===0 ? '<div class="adinfo-featured-badge">BEST</div>' : ''}
            <div class="adinfo-product-header" style="background:${p.bg}">
              <div class="adinfo-product-name">${p.name}</div>
              <div class="adinfo-product-price">${p.price}<span>${p.period}</span></div>
              <div class="adinfo-product-badge">${p.badge}</div>
            </div>
            <div class="adinfo-product-body">
              <ul class="adinfo-feature-list">
                ${p.features.map(f => `<li><i class="fas fa-check" style="color:${p.color}"></i> ${f}</li>`).join('')}
              </ul>
              <button class="adinfo-apply-btn" style="background:${p.color}" onclick="navigate('/support')">
                신청하기 →
              </button>
            </div>
          </div>`).join('')}
      </div>

      <!-- 무료 상품 -->
      <div class="adinfo-free-card">
        <div class="adinfo-free-left">
          <div class="adinfo-free-name">🆓 무료 등록</div>
          <div class="adinfo-free-desc">하루 2건까지 무료 등록 가능합니다.</div>
        </div>
        <div class="adinfo-free-features">
          <span>✓ 기본 현장 등록</span>
          <span>✓ 하루 2건 제한</span>
          <span>✓ 기본 노출</span>
        </div>
        <button class="btn btn-outline" onclick="navigate('/properties/new')">무료 등록하기</button>
      </div>

      <!-- 히트지수 설명 -->
      <div class="adinfo-hit-explain">
        <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:1.5rem;text-align:center">
          📊 히트지수 점수 구성
        </h2>
        <div class="adinfo-hit-grid">
          ${[
            { label: '조회수', max: 30, color: '#3b82f6', desc: '조회 1회당 0.1점 (최대 30점)' },
            { label: '문의수', max: 30, color: '#dc2626', desc: '문의 1건당 3점 (최대 30점)' },
            { label: '공유수', max: 20, color: '#10b981', desc: '공유 1회당 2점 (최대 20점)' },
            { label: '광고등급', max: 15, color: '#f59e0b', desc: '히트AD +15 / 프리미엄 +8 / 스탠다드 +4' },
            { label: '신규보너스', max: 5, color: '#8b5cf6', desc: '등록 후 7일 +5점' },
          ].map(item => `
            <div class="adinfo-hit-item">
              <div class="adinfo-hit-item-header">
                <span style="font-weight:700">${item.label}</span>
                <span style="color:${item.color};font-weight:800">최대 ${item.max}점</span>
              </div>
              <div class="adinfo-hit-bar-track">
                <div class="adinfo-hit-bar-fill" style="width:${item.max}%;background:${item.color}"></div>
              </div>
              <div style="font-size:0.78rem;color:#6b7280">${item.desc}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- 문의 CTA -->
      <div class="adinfo-cta">
        <h3>광고 문의 / 견적 요청</h3>
        <p>궁금한 점이 있으시면 언제든지 연락해 주세요.</p>
        <div class="adinfo-cta-contacts">
          <div class="adinfo-cta-contact"><i class="fas fa-phone"></i> 1533-9077</div>
          <div class="adinfo-cta-contact"><i class="fas fa-envelope"></i> info@hitbunyang.com</div>
        </div>
        <button class="btn btn-primary btn-lg" onclick="navigate('/support')">
          <i class="fas fa-headset"></i> 1:1 광고 문의하기
        </button>
      </div>
    </div>
  </div>`;
}

// ============================================================
// 맞춤현장 페이지 (/match) - 커스텀 + 알림 설정
// ============================================================
// renderCustomPage는 app-pages.js에서 이미 정의됨 → 여기서는 enhanced version

// ============================================================
// Window bindings
// ============================================================
window.renderRankingPageContent = renderRankingPageContent;
window.renderCommunityPageContent = renderCommunityPageContent;
window.renderTvPageContent = renderTvPageContent;
window.renderAdInfoPageContent = renderAdInfoPageContent;
