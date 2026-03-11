// 히트분양 - 홈페이지 v6 (분양라인 스타일 전면 개편)
// 첫화면 = 광고등급별 구인공고 목록 (프리미엄→슈페리어→베이직→일반)
// 각 카드에 상세 구인정보 (수수료, 일비, 시행사 등) 표시

// ============================================================
// HOME PAGE
// ============================================================
async function renderHomePage(container) {
  container.innerHTML = `
    ${renderHeroSection()}
    <div id="home-content">
      <div class="loading-overlay" style="min-height:400px"><div class="spinner"></div></div>
    </div>`;
  
  const [visitorRes, homeRes] = await Promise.all([
    api.get('/visitors'),
    api.get('/home'),
  ]);
  
  if (visitorRes.ok) {
    const todayEl = document.getElementById('visitor-count-today');
    if (todayEl) animateNumber(todayEl, visitorRes.data.today || 0, 1000);
  }
  
  if (!homeRes.ok) {
    document.getElementById('home-content').innerHTML = `
      <div class="container" style="padding:3rem 1rem">
        <div class="empty-state"><div class="empty-state-icon">⚠️</div><div>데이터를 불러오는데 실패했습니다.</div></div>
      </div>`;
    return;
  }
  
  const { bestProperties, newProperties, featuredJobs,
          premiumJobs, superiorJobs, basicJobs, normalJobs,
          latestNews, banners, stats } = homeRes.data;
  
  const topBanners = (banners || []).filter(b => b.position === 'top');
  
  document.getElementById('home-content').innerHTML = `
    <!-- 카테고리 그리드 -->
    <div class="home-section" style="background:#fff;padding:2rem 0 1.5rem;border-bottom:1px solid #eaf2ff">
      <div class="container">
        ${renderCategoryGrid()}
      </div>
    </div>

    <!-- ★ 핵심: 광고등급별 구인공고 목록 (분양라인 스타일) -->
    ${renderAdJobsSection(premiumJobs || [], superiorJobs || [], basicJobs || [], normalJobs || [])}

    <!-- 히트 TOP 5 -->
    ${renderHitTop5(bestProperties)}

    <!-- 통계 위젯 -->
    <div class="container" style="padding-top:2rem;padding-bottom:1rem">
      ${renderStatsWidget(stats, visitorRes.data?.today || 0)}
    </div>
    <!-- 신규 등록 단지 -->
    <div class="container" style="padding-bottom:2rem">
      ${renderNewProperties(newProperties)}
    </div>
    <!-- 히트맵 + TV 미니 위젯 -->
    <div class="home-section" style="background:#f4f8ff;padding:2rem 0">
      <div class="container">
        ${renderHomeMiniWidgets()}
      </div>
    </div>
    <!-- 뉴스 + 커뮤니티 + 채용 -->
    <div class="container" style="padding:2rem 0 3rem">
      ${renderHomeBottomSection(latestNews, featuredJobs)}
    </div>
    <!-- 광고 CTA -->
    <div class="container" style="padding-bottom:2.5rem">
      ${renderAdCta()}
    </div>
  `;
  
  // 숫자 애니메이션
  const statMap = {
    'stat-total-props': stats?.total_properties || 314124,
    'stat-total-jobs': stats?.total_jobs || 52381,
    'stat-total-members': stats?.total_members || 128456,
    'stat-today-visitors': visitorRes.data?.today || 0,
  };
  Object.entries(statMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) animateNumber(el, val, 1800);
  });
}

// ============================================================
// A: HERO SECTION — 다방 스타일 네이비
// ============================================================
function renderHeroSection() {
  const regions = ['전국','서울','경기북부','경기남부','인천','부산','대구','광주','대전','충청','전라','경상','강원','제주','울산','세종'];
  return `
  <section class="hero-section">
    <div class="container" style="position:relative;z-index:1">
      <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:2.5rem;align-items:center">
        <div>
          <!-- 뱃지 -->
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap">
            <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.15);
              border:1px solid rgba(255,255,255,0.25);border-radius:20px;padding:4px 12px;
              font-size:0.78rem;color:white;font-weight:700">
              <span style="width:7px;height:7px;border-radius:50%;background:#5ba3ff;animation:pulse 1.5s infinite"></span>
              LIVE
            </span>
            <span style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);
              border-radius:20px;padding:4px 12px;font-size:0.78rem;color:rgba(255,255,255,0.9);font-weight:600">
              🏆 대한민국 NO.1 분양정보 플랫폼
            </span>
          </div>
          
          <!-- 타이틀 -->
          <h1 style="font-size:2.4rem;font-weight:900;color:white;line-height:1.25;letter-spacing:-1.5px;margin-bottom:0.75rem">
            전국 신규 분양단지<br>
            <span style="color:#90caf9">구인정보</span>를 한눈에!
          </h1>
          <p style="font-size:1rem;color:rgba(255,255,255,0.75);margin-bottom:1.75rem;font-weight:400">
            아파트 · 오피스텔 · 상가 분양 | 팀장 · 팀원 채용
          </p>
          
          <!-- 검색바 -->
          <div style="background:white;border-radius:14px;padding:5px;display:flex;align-items:center;
            gap:5px;box-shadow:0 8px 32px rgba(0,0,0,0.2);margin-bottom:1rem">
            <select id="hero-region-sel" style="border:none;outline:none;padding:0.65rem 0.75rem;
              font-size:0.88rem;color:#0e1f40;background:transparent;cursor:pointer;font-family:inherit;
              border-right:1px solid #d6e4ff;min-width:90px">
              <option value="">전체 지역</option>
              ${['서울','경기북부','경기남부','인천','부산','대구','광주','대전','울산','세종','충청','전라','경상','강원','제주'].map(r =>
                `<option value="${r}">${r}</option>`).join('')}
            </select>
            <input type="text" id="hero-search" placeholder="현장명, 지역명으로 검색..."
              onkeydown="if(event.key==='Enter')doHeroSearch()"
              style="flex:1;border:none;outline:none;padding:0.65rem 1rem;
                font-size:0.9rem;color:#0e1f40;background:transparent">
            <button onclick="doHeroSearch()" style="background:#1c7cff;color:white;border:none;
              padding:0.65rem 1.5rem;border-radius:10px;cursor:pointer;font-weight:700;
              font-size:0.9rem;white-space:nowrap;transition:background 0.2s;font-family:inherit">
              <i class="fas fa-search"></i> 검색
            </button>
          </div>
          
          <!-- 지역 빠른 선택 -->
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
            ${regions.map(r => `
              <button onclick="navigate('/sites?region=${encodeURIComponent(r)}')"
                style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);
                  color:rgba(255,255,255,0.85);padding:5px 12px;border-radius:20px;
                  font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit"
                onmouseover="this.style.background='rgba(255,255,255,0.22)'"
                onmouseout="this.style.background='rgba(255,255,255,0.12)'">${r}</button>
            `).join('')}
          </div>
        </div>
        
        <!-- 우측: 실시간 카드 -->
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <!-- 실시간 현황 -->
          <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);
            border-radius:16px;padding:1.25rem;backdrop-filter:blur(10px)">
            <div style="font-size:0.82rem;font-weight:700;color:rgba(255,255,255,0.7);
              margin-bottom:1rem;display:flex;align-items:center;gap:0.4rem">
              <i class="fas fa-chart-line"></i> 실시간 현황
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem">
              ${[
                {icon:'👁️', label:'오늘 방문자', id:'visitor-count-today', val:'-'},
                {icon:'🏢', label:'등록 단지', id:'stat-total-props-hero', val:'314,124'},
                {icon:'💼', label:'채용 공고', id:'stat-total-jobs-hero', val:'52,381'},
              ].map(s => `
                <div style="text-align:center">
                  <div style="font-size:1.1rem;margin-bottom:0.25rem">${s.icon}</div>
                  <div id="${s.id}" style="font-size:1.3rem;font-weight:900;color:white;line-height:1">${s.val}</div>
                  <div style="font-size:0.72rem;color:rgba(255,255,255,0.6);margin-top:3px">${s.label}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- 히트지수 카드 -->
          <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
            border-radius:16px;padding:1.25rem">
            <div style="font-size:0.82rem;font-weight:700;color:rgba(255,255,255,0.7);
              margin-bottom:0.75rem;display:flex;align-items:center;gap:0.4rem">
              <i class="fas fa-fire" style="color:#e57373"></i> 히트지수란?
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.15);border-radius:3px;margin-bottom:0.75rem;overflow:hidden">
              <div style="height:100%;width:85%;background:linear-gradient(90deg,#1c7cff,#ff3b3b);border-radius:3px"></div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.75rem">
              ${['📊 조회수','💬 문의수','🔗 공유수','⭐ 광고등급','🏢 대행사평점'].map(t =>
                `<span style="background:rgba(255,255,255,0.1);padding:3px 10px;border-radius:20px;
                  font-size:0.73rem;color:rgba(255,255,255,0.8)">${t}</span>`
              ).join('')}
            </div>
            <button onclick="navigate('/ranking')" style="background:rgba(255,255,255,0.15);
              color:white;border:1px solid rgba(255,255,255,0.25);padding:0.5rem 1rem;
              border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;
              transition:all 0.2s;font-family:inherit"
              onmouseover="this.style.background='rgba(255,255,255,0.25)'"
              onmouseout="this.style.background='rgba(255,255,255,0.15)'">
              랭킹 보러가기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
  <style>
    @media(max-width:768px){
      .hero-section .container > div { grid-template-columns:1fr!important; }
      .hero-section .container > div > div:last-child { display:none!important; }
    }
  </style>`;
}

function doHeroSearch() {
  const q = document.getElementById('hero-search')?.value?.trim();
  const r = document.getElementById('hero-region-sel')?.value;
  let url = '/sites';
  const params = new URLSearchParams();
  if (q) params.set('search', q);
  if (r) params.set('region', r);
  navigate(url + (params.toString() ? '?' + params.toString() : ''));
}
window.doHeroSearch = doHeroSearch;

// ============================================================
// 카테고리 그리드
// ============================================================
function renderCategoryGrid() {
  const cats = [
    { icon: '🏙️', name: '아파트', sub: '분양/입주', color: '#e8f2ff', route: '/sites?type=apartment' },
    { icon: '🏢', name: '오피스텔', sub: '주거형/업무형', color: '#fce4ec', route: '/sites?type=officetel', badge: '인기' },
    { icon: '🏪', name: '상가', sub: '근린/복합', color: '#fff9c4', route: '/sites?type=commercial' },
    { icon: '🏭', name: '지식산업센터', sub: '업무/공장', color: '#e8f5e9', route: '/sites?type=industrial' },
    { icon: '🏨', name: '생활숙박', sub: '레지던스', color: '#ede7f6', route: '/sites?type=hotel' },
    { icon: '🗺️', name: '히트맵', sub: '지도로 찾기', color: '#e1f5fe', route: '/hitmap', badge: 'NEW' },
    { icon: '🏆', name: '히트랭킹', sub: 'TOP 50', color: '#fff3e0', route: '/ranking', badge: 'HOT' },
    { icon: '✨', name: '맞춤현장', sub: 'AI 매칭', color: '#f3e5f5', route: '/match', badge: 'AI' },
  ];
  return `
  <div style="margin-bottom:0.5rem;display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:0.82rem;color:#4a5980;font-weight:500">
      <i class="fas fa-fire" style="color:#e53935;margin-right:4px"></i>
      전국 <strong style="color:#1c7cff">314,124개</strong> 분양 단지 정보
    </div>
    <a style="font-size:0.82rem;color:#1c7cff;font-weight:600;cursor:pointer"
      onclick="navigate('/sites')">전체보기 →</a>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.85rem">
    ${cats.map(c => `
      <div onclick="navigate('${c.route}')"
        style="background:${c.color};border-radius:14px;padding:1.2rem 0.75rem;text-align:center;
          cursor:pointer;border:1.5px solid transparent;transition:all 0.2s;position:relative;
          box-shadow:0 1px 4px rgba(28,124,255,0.08)"
        onmouseover="this.style.borderColor='#5ba3ff';this.style.transform='translateY(-3px)';this.style.boxShadow='0 6px 18px rgba(28,124,255,0.14)'"
        onmouseout="this.style.borderColor='transparent';this.style.transform='translateY(0)';this.style.boxShadow='0 1px 4px rgba(28,124,255,0.08)'">
        ${c.badge ? `<span style="position:absolute;top:7px;right:7px;background:#e53935;color:white;
          font-size:0.58rem;font-weight:800;padding:2px 5px;border-radius:4px">${c.badge}</span>` : ''}
        <div style="font-size:1.8rem;margin-bottom:0.4rem">${c.icon}</div>
        <div style="font-size:0.88rem;font-weight:700;color:#0e1f40;margin-bottom:2px">${c.name}</div>
        <div style="font-size:0.72rem;color:#4a5980">${c.sub}</div>
      </div>
    `).join('')}
  </div>`;
}

// ============================================================
// ★ 핵심: 광고등급별 구인공고 목록 (분양라인 메인 스타일)
// ============================================================
function renderAdJobsSection(premiumJobs, superiorJobs, basicJobs, normalJobs) {
  const allSections = [];

  // 프리미엄
  if (premiumJobs.length > 0) {
    allSections.push(renderAdTierSection(
      '★ 프리미엄 현장',
      '분양 수수료 최상위 현장',
      premiumJobs,
      { bg: 'linear-gradient(135deg,#fff8e1,#fffde7)', border: '#ffd54f', badgeColor: '#f57f17',
        headerBg: 'linear-gradient(90deg,#f57f17,#ff6f00)', dot: '#f9a825', tier: 'premium' }
    ));
  }
  // 슈페리어
  if (superiorJobs.length > 0) {
    allSections.push(renderAdTierSection(
      '◆ 슈페리어 현장',
      '검증된 우량 분양 현장',
      superiorJobs,
      { bg: 'linear-gradient(135deg,#f3e5f5,#fce4ec)', border: '#ce93d8', badgeColor: '#6a1b9a',
        headerBg: 'linear-gradient(90deg,#6a1b9a,#8e24aa)', dot: '#ab47bc', tier: 'superior' }
    ));
  }
  // 베이직
  if (basicJobs.length > 0) {
    allSections.push(renderAdTierSection(
      '◎ 베이직 현장',
      '안정적인 분양 현장',
      basicJobs,
      { bg: 'linear-gradient(135deg,#e8f5e9,#f1f8e9)', border: '#a5d6a7', badgeColor: '#2e7d32',
        headerBg: 'linear-gradient(90deg,#2e7d32,#388e3c)', dot: '#66bb6a', tier: 'basic' }
    ));
  }
  // 일반 (AD 미등록)
  if (normalJobs.length > 0) {
    allSections.push(renderAdTierSection(
      'AD 분양 현장',
      '분양현장 구인공고',
      normalJobs,
      { bg: '#f8fafc', border: '#d1d5db', badgeColor: '#4b5563',
        headerBg: 'linear-gradient(90deg,#374151,#4b5563)', dot: '#9ca3af', tier: 'normal' }
    ));
  }

  if (allSections.length === 0) return '';

  return `
  <div style="background:#f4f8ff;padding:2rem 0 2.5rem">
    <div class="container">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
        <div>
          <h2 style="font-size:1.3rem;font-weight:900;color:#0e1f40;margin-bottom:0.25rem">
            💼 분양현장 구인공고
          </h2>
          <p style="font-size:0.82rem;color:#6b7280">광고 등급순 · 각 현장의 수수료·일비·담당자 정보를 바로 확인하세요</p>
        </div>
        <a onclick="navigate('/sites?tab=jobs');return false" href="/sites?tab=jobs"
          style="font-size:0.82rem;color:#1c7cff;font-weight:700;text-decoration:none;
            display:flex;align-items:center;gap:0.3rem;white-space:nowrap">
          전체 공고 <i class="fas fa-chevron-right"></i>
        </a>
      </div>
      ${allSections.join('')}
    </div>
  </div>`;
}

function renderAdTierSection(title, subtitle, jobs, style) {
  const { bg, border, badgeColor, headerBg, dot, tier } = style;
  const showCount = tier === 'normal' ? 6 : jobs.length; // 일반은 6개만, 나머지 전부
  const visibleJobs = jobs.slice(0, showCount);
  const hasMore = jobs.length > showCount;

  return `
  <div style="margin-bottom:1.5rem">
    <!-- 섹션 헤더 -->
    <div style="background:${headerBg};border-radius:12px 12px 0 0;padding:0.75rem 1.25rem;
      display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:0.6rem">
        <span style="width:8px;height:8px;border-radius:50%;background:white;
          box-shadow:0 0 6px rgba(255,255,255,0.8);display:inline-block"></span>
        <span style="font-weight:800;color:white;font-size:0.95rem">${title}</span>
        <span style="font-size:0.75rem;color:rgba(255,255,255,0.7)">${subtitle}</span>
        <span style="background:rgba(255,255,255,0.2);color:white;font-size:0.72rem;
          padding:1px 8px;border-radius:10px;font-weight:700">${jobs.length}건</span>
      </div>
      <a onclick="navigate('/sites?tab=jobs');return false" href="/sites?tab=jobs"
        style="color:rgba(255,255,255,0.85);font-size:0.78rem;text-decoration:none;font-weight:600">
        더보기 <i class="fas fa-chevron-right"></i>
      </a>
    </div>
    <!-- 카드 목록 -->
    <div style="background:${bg};border:1px solid ${border};border-top:none;border-radius:0 0 12px 12px;padding:0.75rem">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:0.75rem">
        ${visibleJobs.map(j => renderHomeJobCard(j, badgeColor)).join('')}
      </div>
      ${hasMore ? `
      <div style="text-align:center;margin-top:0.75rem">
        <button onclick="navigate('/sites?tab=jobs')"
          style="background:white;border:1px solid ${border};color:${badgeColor};
            padding:0.5rem 1.5rem;border-radius:8px;font-size:0.82rem;font-weight:700;
            cursor:pointer;font-family:inherit">
          + ${jobs.length - showCount}개 더보기
        </button>
      </div>` : ''}
    </div>
  </div>`;
}

// 홈 구인공고 카드 (분양라인 스타일 — 상세정보 표시)
function renderHomeJobCard(j, accentColor) {
  const badges = [];
  if (j.ad_type === 'premium') badges.push(`<span style="background:#fff8e1;color:#f57f17;border:1px solid #ffe082;font-size:0.65rem;font-weight:800;padding:1px 6px;border-radius:3px">★ 프리미엄</span>`);
  else if (j.ad_type === 'superior') badges.push(`<span style="background:#f3e5f5;color:#6a1b9a;border:1px solid #ce93d8;font-size:0.65rem;font-weight:800;padding:1px 6px;border-radius:3px">◆ 슈페리어</span>`);
  else if (j.ad_type === 'basic') badges.push(`<span style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;font-size:0.65rem;font-weight:800;padding:1px 6px;border-radius:3px">◎ 베이직</span>`);
  if (j.is_urgent) badges.push(`<span style="background:#ffebee;color:#c62828;border:1px solid #ffcdd2;font-size:0.65rem;font-weight:800;padding:1px 6px;border-radius:3px">🚨 급구</span>`);
  if (j.is_hot)    badges.push(`<span style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;font-size:0.65rem;font-weight:800;padding:1px 6px;border-radius:3px">🔥 HOT</span>`);
  if (j.is_best)   badges.push(`<span style="background:#e8f5e9;color:#1b5e20;border:1px solid #a5d6a7;font-size:0.65rem;font-weight:800;padding:1px 6px;border-radius:3px">💰 대박</span>`);

  // 급여 정보 태그
  const payTags = [];
  if (j.commission_rate)  payTags.push(`<span style="background:#fff8e1;color:#f57f17;border:1px solid #ffe082;font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:4px">수수료 ${j.commission_rate}%</span>`);
  if (j.daily_pay > 0)    payTags.push(`<span style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:4px">일비 ${Number(j.daily_pay).toLocaleString()}원</span>`);
  if (j.accommodation_pay > 0) payTags.push(`<span style="background:#e3f2fd;color:#0d47a1;border:1px solid #90caf9;font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:4px">숙소비 ${Number(j.accommodation_pay).toLocaleString()}원</span>`);

  // commission_note에서 핵심 수수료 정보 추출 (첫 줄)
  const commNote = j.commission_note ? j.commission_note.split('\n')[0].trim() : '';

  return `
  <div onclick="navigate('/jobs/${j.id}')"
    style="background:white;border-radius:10px;border:1px solid #e5e7eb;padding:0.9rem 1rem;
      cursor:pointer;transition:all 0.18s;box-shadow:0 1px 4px rgba(0,0,0,0.05)"
    onmouseover="this.style.borderColor='#93c5fd';this.style.boxShadow='0 4px 16px rgba(28,124,255,0.12)';this.style.transform='translateY(-2px)'"
    onmouseout="this.style.borderColor='#e5e7eb';this.style.boxShadow='0 1px 4px rgba(0,0,0,0.05)';this.style.transform='translateY(0)'">
    
    <!-- 상단: 배지 + 제목 -->
    <div style="margin-bottom:0.5rem">
      ${badges.length ? `<div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-bottom:0.4rem">${badges.join('')}</div>` : ''}
      <div style="font-size:0.92rem;font-weight:800;color:#111827;line-height:1.35;
        overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">
        ${escapeHtml(j.title)}
      </div>
    </div>

    <!-- 현장명 + 지역 -->
    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;flex-wrap:wrap">
      <span style="font-size:0.8rem;font-weight:700;color:#1e40af">
        <i class="fas fa-building" style="font-size:0.72rem"></i> ${escapeHtml(j.site_name || '-')}
      </span>
      <span style="font-size:0.75rem;color:#6b7280">
        <i class="fas fa-map-marker-alt" style="color:#ef4444;font-size:0.7rem"></i> ${escapeHtml(j.region)}
      </span>
      <span style="font-size:0.75rem;color:#6b7280">
        <i class="fas fa-users" style="color:#10b981;font-size:0.7rem"></i> ${getRankLabel(j.rank_type)}
      </span>
    </div>

    <!-- 수수료 + 급여 태그 -->
    ${payTags.length ? `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.5rem">${payTags.join('')}</div>` : ''}

    <!-- 수수료 노트 요약 (있을 때만) -->
    ${commNote ? `<div style="font-size:0.78rem;color:#92400e;background:#fef9c3;border-radius:5px;
      padding:0.3rem 0.6rem;margin-bottom:0.5rem;line-height:1.4;
      overflow:hidden;white-space:nowrap;text-overflow:ellipsis">
      💰 ${escapeHtml(commNote)}
    </div>` : ''}

    <!-- 구분선 + 사업자 정보 -->
    ${(j.enforcement_company || j.construction_company || j.agency_company) ? `
    <div style="border-top:1px solid #f3f4f6;padding-top:0.4rem;margin-top:0.4rem;
      font-size:0.74rem;color:#6b7280;display:flex;flex-wrap:wrap;gap:0.4rem">
      ${j.enforcement_company ? `<span><i class="fas fa-hammer" style="color:#9ca3af"></i> 시행 ${escapeHtml(j.enforcement_company)}</span>` : ''}
      ${j.construction_company ? `<span><i class="fas fa-hard-hat" style="color:#9ca3af"></i> 시공 ${escapeHtml(j.construction_company)}</span>` : ''}
      ${j.agency_company ? `<span><i class="fas fa-handshake" style="color:#9ca3af"></i> 대행 ${escapeHtml(j.agency_company)}</span>` : ''}
    </div>` : ''}

    <!-- 하단: 담당자 + 시간 -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.5rem;flex-wrap:wrap;gap:0.25rem">
      <div style="font-size:0.76rem;color:#374151;font-weight:600">
        <i class="fas fa-phone" style="color:#1e40af;font-size:0.68rem"></i>
        ${escapeHtml(j.contact_name)} ${escapeHtml(j.contact_phone)}
      </div>
      <div style="font-size:0.71rem;color:#9ca3af">${timeAgo(j.created_at)}</div>
    </div>
  </div>`;
}

// ============================================================
// B: 히트 TOP 5
// ============================================================
function renderHitTop5(properties) {
  if (!properties || !properties.length) return '';
  const top5 = properties.slice(0, 5);
  
  return `
  <div class="home-section" style="background:#fff;padding:2rem 0">
    <div class="container">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
        <h2 class="section-title">🔥 히트 TOP 5 <span style="font-size:0.82rem;font-weight:500;color:#4a5980;margin-left:0.5rem">히트지수 최고 현장</span></h2>
        <a class="section-link" href="/ranking" onclick="navigate('/ranking');return false">전체 랭킹 <i class="fas fa-chevron-right"></i></a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.85rem">
        ${top5.map((p, i) => renderHitTop5Card(p, i)).join('')}
      </div>
    </div>
  </div>`;
}

function renderHitTop5Card(p, rank) {
  const score = calcHitScore(p);
  const color = getHitScoreColor(score);
  const label = getHitScoreLabel(score);
  const rankMedals = ['🥇', '🥈', '🥉', '4위', '5위'];
  
  return `
  <div onclick="navigate('/properties/${p.id}')"
    style="background:white;border-radius:14px;overflow:hidden;border:1.5px solid #d6e4ff;
      cursor:pointer;transition:all 0.22s;box-shadow:0 2px 8px rgba(28,124,255,0.08);
      ${rank === 0 ? 'border-color:#1c7cff;box-shadow:0 4px 20px rgba(26,35,126,0.15)' : ''}"
    onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 28px rgba(28,124,255,0.18)'"
    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='${rank===0?'0 4px 20px rgba(26,35,126,0.15)':'0 2px 8px rgba(28,124,255,0.08)'}'">
    <div style="height:120px;background:${getPropertyBgImage(p.property_type)};
      display:flex;align-items:center;justify-content:center;position:relative">
      <i class="fas fa-building" style="color:rgba(255,255,255,0.45);font-size:2rem"></i>
      <div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.5);
        color:${rank<3?'#ffd54f':'white'};font-size:${rank<3?'1.1':'0.8'}rem;
        font-weight:800;padding:3px 8px;border-radius:6px">
        ${rankMedals[rank]}
      </div>
      <div style="position:absolute;top:8px;right:8px">
        <div style="position:relative;width:38px;height:38px">
          <svg viewBox="0 0 36 36" style="width:100%;height:100%;transform:rotate(-90deg)">
            <circle cx="18" cy="18" r="14" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
            <circle cx="18" cy="18" r="14" fill="none" stroke="${color}" stroke-width="3"
              stroke-dasharray="${score} ${100-score}" stroke-linecap="round"/>
          </svg>
          <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
            color:white;font-size:0.68rem;font-weight:900">${score}</span>
        </div>
      </div>
    </div>
    <div style="padding:0.8rem">
      <div style="display:flex;gap:0.3rem;margin-bottom:0.4rem;flex-wrap:wrap">
        <span style="background:rgba(26,35,126,0.08);color:#1c7cff;padding:2px 7px;
          border-radius:4px;font-size:0.68rem;font-weight:700">${escapeHtml(p.region)}</span>
        <span style="background:#f5f5f5;color:#666;padding:2px 7px;
          border-radius:4px;font-size:0.68rem">${getPropertyTypeLabel(p.property_type)}</span>
      </div>
      <div style="font-size:0.85rem;font-weight:700;color:#0e1f40;line-height:1.35;
        overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
        margin-bottom:0.4rem">${escapeHtml(p.title)}</div>
      <div style="font-size:0.9rem;font-weight:900;color:#1c7cff;margin-bottom:0.5rem">
        ${formatPriceRange(p.price_min, p.price_max)}
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="flex:1;height:4px;background:#d6e4ff;border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${score}%;background:${color};border-radius:2px;
            transition:width 0.6s ease"></div>
        </div>
        <span style="font-size:0.7rem;font-weight:800;color:${color}">${label}</span>
      </div>
    </div>
  </div>`;
}

// ============================================================
// STATS WIDGET
// ============================================================
function renderStatsWidget(stats, todayVisitors) {
  const items = [
    { id: 'stat-total-props', icon: '🏢', label: '총 등록 단지', val: stats?.total_properties || 314124, bg: '#e8f2ff', border: '#c5cbe8' },
    { id: 'stat-total-jobs', icon: '💼', label: '채용 공고', val: stats?.total_jobs || 52381, bg: '#e8f5e9', border: '#a5d6a7' },
    { id: 'stat-total-members', icon: '👥', label: '누적 회원수', val: stats?.total_members || 128456, bg: '#ede7f6', border: '#ce93d8' },
    { id: 'stat-today-visitors', icon: '👁️', label: '오늘 방문자', val: todayVisitors || 0, bg: '#e1f5fe', border: '#81d4fa' },
  ];
  return `
  <div class="stats-widget">
    <div class="stats-grid">
      ${items.map(item => `
        <div class="stats-item" style="background:${item.bg};border:1.5px solid ${item.border}">
          <div class="stats-item-icon">${item.icon}</div>
          <div class="stats-item-value" id="${item.id}">0</div>
          <div class="stats-item-label">${item.label}</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

// ============================================================
// NEW PROPERTIES
// ============================================================
function renderNewProperties(properties) {
  if (!properties || !properties.length) return '';
  return `
  <div class="section-header">
    <h2 class="section-title">🆕 신규 등록 단지</h2>
    <a class="section-link" href="/sites" onclick="navigate('/sites');return false">전체보기 <i class="fas fa-chevron-right"></i></a>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem">
    ${properties.slice(0,8).map(p => renderPropertyCard(p)).join('')}
  </div>
  <style>
    @media(max-width:1024px){ .properties-grid-home { grid-template-columns:repeat(3,1fr)!important; } }
    @media(max-width:768px){ .properties-grid-home { grid-template-columns:repeat(2,1fr)!important; } }
    @media(max-width:480px){ .properties-grid-home { grid-template-columns:1fr!important; } }
  </style>`;
}

// ============================================================
// 미니 위젯 (히트맵 + TV)
// ============================================================
function renderHomeMiniWidgets() {
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
    <h2 class="section-title">🗺️ 히트맵 & 📺 히트TV</h2>
  </div>
  <div style="display:grid;grid-template-columns:3fr 2fr;gap:1rem">
    <div onclick="navigate('/hitmap')"
      style="background:linear-gradient(135deg,#1c7cff,#0057d9);border-radius:16px;
        padding:1.5rem;cursor:pointer;transition:transform 0.2s;min-height:200px;
        display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden"
      onmouseover="this.style.transform='translateY(-3px)'"
      onmouseout="this.style.transform='translateY(0)'">
      <div style="position:absolute;inset:0;opacity:0.06">
        ${Array.from({length:10}, (_,i) => `
          <div style="position:absolute;border-radius:50%;background:white;
            width:${[60,40,80,30,50,70,45,35,55,65][i]}px;height:${[60,40,80,30,50,70,45,35,55,65][i]}px;
            top:${[10,40,20,60,80,5,55,75,35,50][i]}%;left:${[15,60,80,20,45,70,35,85,55,10][i]}%"></div>
        `).join('')}
      </div>
      <div style="position:relative;z-index:1">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
          <span style="background:rgba(255,255,255,0.15);border-radius:10px;padding:0.5rem 0.75rem;font-size:1.2rem">🗺️</span>
          <div>
            <div style="font-size:1rem;font-weight:800;color:white">히트맵</div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.65)">지역별 히트지수 시각화</div>
          </div>
        </div>
        <div style="position:relative;height:80px;background:rgba(255,255,255,0.07);
          border-radius:10px;overflow:hidden;margin-bottom:0.75rem">
          ${[
            {c:'#ef5350',s:14,t:20,l:30},{c:'#ff7043',s:10,t:50,l:55},{c:'#42a5f5',s:12,t:30,l:75},
            {c:'#ef5350',s:9,t:65,l:20},{c:'#ff7043',s:11,t:15,l:60},{c:'#42a5f5',s:8,t:55,l:85},
          ].map(m => `
            <div style="position:absolute;width:${m.s}px;height:${m.s}px;background:${m.c};
              border-radius:50%;top:${m.t}%;left:${m.l}%;border:2px solid rgba(255,255,255,0.4);
              box-shadow:0 0 6px ${m.c}80"></div>
          `).join('')}
          <div style="position:absolute;bottom:6px;right:8px;font-size:0.65rem;color:rgba(255,255,255,0.5)">
            🔴 80+ &nbsp; 🟠 50~79 &nbsp; 🔵 ~49
          </div>
        </div>
      </div>
      <button style="background:rgba(255,255,255,0.18);color:white;border:1px solid rgba(255,255,255,0.25);
        padding:0.5rem 1rem;border-radius:8px;font-size:0.83rem;font-weight:600;cursor:pointer;
        width:fit-content;font-family:inherit;position:relative;z-index:1">
        히트맵 열기 →
      </button>
    </div>
    
    <div onclick="navigate('/tv')"
      style="background:white;border-radius:16px;border:1.5px solid #d6e4ff;
        padding:1.25rem;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(28,124,255,0.08)"
      onmouseover="this.style.borderColor='#5ba3ff';this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(28,124,255,0.14)'"
      onmouseout="this.style.borderColor='#d6e4ff';this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(28,124,255,0.08)'">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem">
        <span style="background:#ffebee;border-radius:10px;padding:0.45rem 0.65rem;font-size:1.1rem">📺</span>
        <div>
          <div style="font-size:0.95rem;font-weight:800;color:#0e1f40">히트분양TV</div>
          <div style="font-size:0.75rem;color:#4a5980">분양 현장 유튜브 채널</div>
        </div>
      </div>
      ${[
        {title:'[리뷰] 힐스테이트 판교역 현장 방문기', views:'12.4만'},
        {title:'2025 수도권 분양시장 전망 분석', views:'8.9만'},
        {title:'분양 팀장 되는 법 A to Z', views:'6.2만'},
      ].map(v => `
        <div style="display:flex;align-items:center;gap:0.65rem;padding:0.55rem 0;border-bottom:1px solid #eaf2ff">
          <div style="width:42px;height:32px;background:#ffebee;border-radius:6px;
            display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="fab fa-youtube" style="color:#e53935;font-size:0.9rem"></i>
          </div>
          <div style="flex:1;overflow:hidden">
            <div style="font-size:0.8rem;font-weight:600;overflow:hidden;white-space:nowrap;
              text-overflow:ellipsis;color:#0e1f40">${v.title}</div>
            <div style="font-size:0.71rem;color:#8fa3c8;margin-top:1px"><i class="fas fa-eye"></i> ${v.views}</div>
          </div>
        </div>
      `).join('')}
      <div style="text-align:center;margin-top:0.75rem">
        <button style="background:#ffebee;color:#e53935;border:1.5px solid #ffcdd2;
          padding:0.45rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:inherit">
          <i class="fab fa-youtube"></i> 채널 방문하기
        </button>
      </div>
    </div>
  </div>`;
}

// ============================================================
// 뉴스 + 커뮤니티 + 채용 (하단)
// ============================================================
function renderHomeBottomSection(newsList, jobs) {
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem">
    <!-- 뉴스 -->
    <div>
      <div class="section-header">
        <h2 class="section-title">📰 뉴스/공지</h2>
        <a class="section-link" href="/news" onclick="navigate('/news');return false">더보기 <i class="fas fa-chevron-right"></i></a>
      </div>
      <div style="background:white;border-radius:14px;border:1.5px solid #d6e4ff;overflow:hidden;box-shadow:0 2px 8px rgba(26,35,126,0.05)">
        ${newsList && newsList.length 
          ? newsList.map(n => `
            <div class="news-row" onclick="navigate('/news/${n.id}')" style="padding:0.75rem 1rem">
              <span class="news-type-badge news-type-${n.news_type}">${n.news_type==='notice'?'공지':n.news_type==='event'?'이벤트':'뉴스'}</span>
              ${n.is_pinned ? '<i class="fas fa-thumbtack" style="color:#f9a825;font-size:0.7rem"></i>' : ''}
              <span style="flex:1;font-size:0.85rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${escapeHtml(n.title)}</span>
              <span style="font-size:0.72rem;color:#8fa3c8;white-space:nowrap">${timeAgo(n.created_at)}</span>
            </div>`).join('')
          : `<div style="text-align:center;padding:2.5rem;color:#8fa3c8;font-size:0.85rem">
              <div style="font-size:2rem;margin-bottom:0.5rem">📋</div>공지사항이 없습니다
            </div>`
        }
      </div>
    </div>
    
    <!-- 커뮤니티 -->
    <div>
      <div class="section-header">
        <h2 class="section-title">💬 커뮤니티 HOT</h2>
        <a class="section-link" href="/community" onclick="navigate('/community');return false">더보기 <i class="fas fa-chevron-right"></i></a>
      </div>
      <div style="background:white;border-radius:14px;border:1.5px solid #d6e4ff;overflow:hidden;box-shadow:0 2px 8px rgba(26,35,126,0.05)">
        ${[
          {cat:'현장후기', catColor:'#1c7cff', catBg:'#e8f2ff', title:'래미안 원펜타스 계약 후기 공유합니다', likes:24, comments:8},
          {cat:'정보공유', catColor:'#2e7d32', catBg:'#e8f5e9', title:'2025년 하반기 분양 일정 총정리', likes:51, comments:15},
          {cat:'자유게시판', catColor:'#6a1b9a', catBg:'#ede7f6', title:'팀장 첫 달 수입 공개 (솔직 후기)', likes:38, comments:22},
          {cat:'Q&A', catColor:'#c62828', catBg:'#ffebee', title:'계약금 환급 조건이 어떻게 되나요?', likes:12, comments:6},
        ].map(p => `
          <div onclick="navigate('/community')"
            style="padding:0.8rem 1rem;border-bottom:1px solid #eaf2ff;cursor:pointer;transition:background 0.15s"
            onmouseover="this.style.background='#f4f8ff'"
            onmouseout="this.style.background='white'">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem">
              <span style="background:${p.catBg};color:${p.catColor};padding:2px 7px;
                border-radius:4px;font-size:0.69rem;font-weight:700;white-space:nowrap">${p.cat}</span>
              <span style="flex:1;font-size:0.83rem;font-weight:600;overflow:hidden;
                white-space:nowrap;text-overflow:ellipsis;color:#0e1f40">${p.title}</span>
            </div>
            <div style="display:flex;gap:0.75rem;font-size:0.72rem;color:#8fa3c8">
              <span><i class="fas fa-heart" style="color:#e57373"></i> ${p.likes}</span>
              <span><i class="fas fa-comment" style="color:#64b5f6"></i> ${p.comments}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <!-- 최신 채용 -->
    <div>
      <div class="section-header">
        <h2 class="section-title">🔥 HOT 채용</h2>
        <a class="section-link" href="/sites?tab=jobs" onclick="navigate('/sites?tab=jobs');return false">더보기 <i class="fas fa-chevron-right"></i></a>
      </div>
      ${!jobs || !jobs.length 
        ? `<div style="background:white;border-radius:14px;border:1.5px solid #d6e4ff;
              padding:2.5rem;text-align:center;color:#8fa3c8">
            <div style="font-size:2rem;margin-bottom:0.5rem">💼</div>채용 공고가 없습니다
          </div>`
        : `<div style="display:flex;flex-direction:column;gap:0.5rem">
            ${jobs.slice(0,5).map(j => renderJobCardMini(j)).join('')}
           </div>`
      }
    </div>
  </div>`;
}

function renderJobCardMini(job) {
  const badges = [];
  if (job.is_urgent) badges.push('<span class="badge badge-urgent">급구</span>');
  if (job.is_hot)    badges.push('<span class="badge badge-hot">HOT</span>');
  if (job.is_best)   badges.push('<span class="badge badge-best">대박</span>');
  return `
  <div class="job-card ${job.ad_type==='premium'?'ad-premium':''}" onclick="navigate('/jobs/${job.id}')">
    <div style="display:flex;gap:0.3rem;margin-bottom:0.25rem">${badges.join('')}</div>
    <div class="job-title text-clamp-2">${escapeHtml(job.title)}</div>
    <div style="display:flex;gap:0.5rem;margin-top:0.3rem;font-size:0.75rem;color:#4a5980;flex-wrap:wrap">
      <span><i class="fas fa-map-marker-alt" style="color:#1c7cff"></i> ${escapeHtml(job.region)}</span>
      ${job.commission_rate ? `<span><i class="fas fa-percent" style="color:#f9a825"></i> ${job.commission_rate}%</span>` : ''}
      ${job.daily_pay > 0 ? `<span><i class="fas fa-money-bill" style="color:#16a34a"></i> 일비 ${Number(job.daily_pay).toLocaleString()}원</span>` : ''}
    </div>
  </div>`;
}

// ============================================================
// AD CTA BANNER
// ============================================================
function renderAdCta() {
  return `
  <div style="background:linear-gradient(135deg,#1c7cff,#0057d9);border-radius:16px;
    padding:2rem 2.5rem;display:flex;align-items:center;justify-content:space-between;
    box-shadow:0 8px 32px rgba(28,124,255,0.28);flex-wrap:wrap;gap:1.5rem">
    <div>
      <div style="background:rgba(255,255,255,0.15);color:white;padding:3px 12px;
        border-radius:20px;font-size:0.75rem;font-weight:700;
        display:inline-block;margin-bottom:0.6rem;border:1px solid rgba(255,255,255,0.2)">
        💰 광고 안내
      </div>
      <div style="font-size:1.4rem;font-weight:900;color:white;margin-bottom:0.5rem;letter-spacing:-0.5px">
        내 분양단지를 히트지수 최상단에!
      </div>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
        ${[
          {t:'★ 프리미엄', sub:'최상단 노출', c:'#f9a825'},
          {t:'◆ 슈페리어', sub:'상단 노출', c:'#ab47bc'},
          {t:'◎ 베이직', sub:'기본 노출', c:'#66bb6a'},
          {t:'🆓 무료', sub:'2건/일', c:'#78909c'},
        ].map(a => `
          <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);
            border-radius:8px;padding:6px 14px;text-align:center">
            <div style="font-size:0.82rem;font-weight:700;color:white">${a.t}</div>
            <div style="font-size:0.72rem;color:rgba(255,255,255,0.6)">${a.sub}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.5rem">
      <button onclick="navigate('/ad-info')"
        style="background:white;color:#1c7cff;border:none;padding:0.75rem 1.75rem;
          border-radius:10px;font-size:0.92rem;font-weight:700;cursor:pointer;
          box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:all 0.2s;font-family:inherit"
        onmouseover="this.style.transform='translateY(-2px)'"
        onmouseout="this.style.transform='translateY(0)'">
        <i class="fas fa-info-circle"></i> 광고 상품 보기
      </button>
      <button onclick="navigate('/jobs/new')"
        style="background:rgba(255,255,255,0.15);color:white;
          border:1px solid rgba(255,255,255,0.3);padding:0.65rem 1.75rem;
          border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;
          transition:background 0.2s;font-family:inherit"
        onmouseover="this.style.background='rgba(255,255,255,0.25)'"
        onmouseout="this.style.background='rgba(255,255,255,0.15)'">
        <i class="fas fa-plus"></i> 구인 공고 등록
      </button>
    </div>
  </div>`;
}
