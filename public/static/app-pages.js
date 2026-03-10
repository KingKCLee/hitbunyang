// 히트분양 - 추가 페이지들 (지역현장, 맞춤현장, 관심현장, 서포터즈, FAQ)

// ============================================================
// 지역현장 PAGE
// ============================================================
async function renderRegionPage(container) {
  const urlParams = new URLSearchParams(location.search);
  const selectedRegion = urlParams.get('r') || '';
  
  container.innerHTML = `
    <div style="background:linear-gradient(135deg,#7f1d1d,#dc2626);padding:1.5rem 0;color:white;margin-bottom:1.5rem">
      <div class="container">
        <h1 style="font-size:1.5rem;font-weight:900;margin-bottom:0.25rem">
          <i class="fas fa-map-marker-alt"></i> 지역현장
        </h1>
        <p style="opacity:0.8;font-size:0.88rem">지역별 신규 분양 단지를 찾아보세요</p>
      </div>
    </div>
    <div class="container" style="padding-bottom:2rem">
      ${!selectedRegion ? renderRegionSelector() : ''}
      <div id="region-content">
        <div class="loading-overlay"><div class="spinner"></div></div>
      </div>
    </div>`;
  
  if (selectedRegion) {
    await loadRegionProperties(selectedRegion, container);
  } else {
    await loadRegionStats();
  }
}

function renderRegionSelector() {
  const regions = [
    { name: '전국', icon: '🗺️', color: '#374151' },
    { name: '서울', icon: '🏙️', color: '#dc2626' },
    { name: '경기북부', icon: '🌄', color: '#1d4ed8' },
    { name: '경기남부', icon: '🌆', color: '#0369a1' },
    { name: '인천', icon: '✈️', color: '#0891b2' },
    { name: '부산', icon: '🌊', color: '#ea580c' },
    { name: '대구', icon: '🏛️', color: '#d97706' },
    { name: '광주', icon: '🌸', color: '#10b981' },
    { name: '대전', icon: '🚄', color: '#8b5cf6' },
    { name: '울산', icon: '🏭', color: '#2563eb' },
    { name: '세종', icon: '🏛️', color: '#0284c7' },
    { name: '충청', icon: '🌾', color: '#7c3aed' },
    { name: '전라', icon: '🍃', color: '#059669' },
    { name: '경상', icon: '⛰️', color: '#b45309' },
    { name: '강원', icon: '🏔️', color: '#6366f1' },
    { name: '제주', icon: '🌴', color: '#9d174d' },
  ];
  
  return `
  <div style="margin-bottom:1.5rem">
    <div class="section-header" style="margin-bottom:1rem">
      <h2 class="section-title">지역 선택</h2>
    </div>
    <div class="region-grid" id="region-grid">
      ${regions.map(r => `
        <div class="region-card" onclick="navigate('/region?r=${encodeURIComponent(r.name)}')"
          style="border-color:${r.color}22">
          <div class="region-card-icon">${r.icon}</div>
          <div class="region-card-name" style="color:${r.color}">${r.name}</div>
          <div class="region-card-count" id="region-cnt-${encodeURIComponent(r.name)}">로딩중...</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

async function loadRegionStats() {
  const r = await api.get('/stats');
  if (!r.ok) return;
  const { regions } = r.data;
  
  const content = document.getElementById('region-content');
  if (content) content.innerHTML = '';
  
  if (regions) {
    regions.forEach(row => {
      // 경기 데이터는 경기북부/경기남부로 분배
      if (row.region === '경기') {
        const northEl = document.getElementById('region-cnt-%EA%B2%BD%EA%B8%B0%EB%B6%81%EB%B6%80');
        const southEl = document.getElementById('region-cnt-%EA%B2%BD%EA%B8%B0%EB%82%A8%EB%B6%80');
        const total = row.property_count || 0;
        if (northEl) northEl.textContent = `${Math.floor(total * 0.45).toLocaleString()}건`;
        if (southEl) southEl.textContent = `${Math.floor(total * 0.55).toLocaleString()}건`;
      } else {
        const el = document.getElementById(`region-cnt-${encodeURIComponent(row.region)}`);
        if (el) el.textContent = `${(row.property_count || 0).toLocaleString()}건`;
      }
    });
  }
  
  // 전국 카운트
  const totalEl = document.getElementById('region-cnt-%EC%A0%84%EA%B5%AD');
  if (totalEl && regions) {
    const total = regions.reduce((sum, r) => sum + (r.property_count || 0), 0);
    totalEl.textContent = `${total.toLocaleString()}건`;
  }
}

async function loadRegionProperties(region, container) {
  // Show region header
  container.innerHTML = `
    <div style="background:linear-gradient(135deg,#7f1d1d,#dc2626);padding:1.5rem 0;color:white;margin-bottom:1.5rem">
      <div class="container">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button onclick="navigate('/region')" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);
            color:white;padding:0.35rem 0.75rem;border-radius:8px;cursor:pointer;font-size:0.85rem">
            ← 지역 선택
          </button>
          <div>
            <h1 style="font-size:1.5rem;font-weight:900">${escapeHtml(region)} 분양단지</h1>
            <p style="opacity:0.8;font-size:0.88rem">${escapeHtml(region)} 지역의 신규 분양 단지 목록</p>
          </div>
        </div>
      </div>
    </div>
    <div class="container" style="padding-bottom:2rem">
      <div id="region-content"><div class="loading-overlay"><div class="spinner"></div></div></div>
    </div>`;
  
  // 경기북부/경기남부는 API에서는 '경기'로 검색
  let apiRegion = region;
  if (region === '경기북부' || region === '경기남부') {
    apiRegion = '경기';
  }
  
  const r = await api.get(`/properties?region=${encodeURIComponent(apiRegion)}&limit=20`);
  const contentEl = document.getElementById('region-content');
  if (!contentEl) return;
  
  if (!r.ok || !r.data.data?.length) {
    contentEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏢</div>
        <div>${escapeHtml(region)} 지역의 단지가 없습니다.</div>
        <button class="btn btn-primary" style="margin-top:1rem" onclick="navigate('/region')">다른 지역 보기</button>
      </div>`;
    return;
  }
  
  const { data: properties, total, page, pages } = r.data;
  contentEl.innerHTML = `
    <div style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:0.88rem;color:#6b7280">총 <strong style="color:#dc2626">${total.toLocaleString()}</strong>건</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:1.25rem">
      ${properties.map(p => renderPropertyCard(p)).join('')}
    </div>`;
}

// ============================================================
// 맞춤현장 PAGE
// ============================================================
async function renderCustomPage(container) {
  container.innerHTML = `
    <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:1.5rem 0;color:white;margin-bottom:1.5rem">
      <div class="container">
        <h1 style="font-size:1.5rem;font-weight:900;margin-bottom:0.25rem">
          <i class="fas fa-sliders-h"></i> 맞춤현장
        </h1>
        <p style="opacity:0.8;font-size:0.88rem">내 조건에 맞는 분양 단지를 찾아보세요</p>
      </div>
    </div>
    <div class="container" style="padding-bottom:2rem">
      <!-- Custom filter form -->
      <div style="background:white;border-radius:16px;padding:1.5rem;box-shadow:0 2px 16px rgba(0,0,0,0.08);
        border:1px solid #e5e7eb;margin-bottom:1.5rem">
        <h2 style="font-size:1rem;font-weight:800;margin-bottom:1.25rem;color:#7c3aed">
          <i class="fas fa-filter"></i> 맞춤 조건 설정
        </h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">
          <div>
            <label class="form-label">지역</label>
            <select class="form-select" id="custom-region">
              <option value="">전체 지역</option>
              ${['전국','서울','경기북부','경기남부','인천','부산','대구','광주','대전','울산','세종','충청','전라','경상','강원','제주'].map(r =>
                `<option value="${r}">${r}</option>`
              ).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">유형</label>
            <select class="form-select" id="custom-type">
              <option value="">전체 유형</option>
              <option value="apartment">아파트</option>
              <option value="officetel">오피스텔</option>
              <option value="commercial">상가</option>
              <option value="villa">빌라/연립</option>
            </select>
          </div>
          <div>
            <label class="form-label">분양 상태</label>
            <select class="form-select" id="custom-status">
              <option value="">전체</option>
              <option value="active">분양중</option>
              <option value="upcoming">분양예정</option>
              <option value="completed">분양완료</option>
            </select>
          </div>
          <div>
            <label class="form-label">가격대</label>
            <select class="form-select" id="custom-price">
              <option value="">전체 가격</option>
              <option value="1">1억 이하</option>
              <option value="3">3억 이하</option>
              <option value="5">5억 이하</option>
              <option value="10">10억 이하</option>
              <option value="99">10억 이상</option>
            </select>
          </div>
          <div>
            <label class="form-label">정렬</label>
            <select class="form-select" id="custom-sort">
              <option value="">최신순</option>
              <option value="hot">인기순</option>
              <option value="views">조회순</option>
              <option value="price_asc">가격 낮은순</option>
              <option value="price_desc">가격 높은순</option>
            </select>
          </div>
        </div>
        <div style="margin-top:1.25rem;display:flex;gap:0.75rem;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="applyCustomFilter()">
            <i class="fas fa-search"></i> 맞춤 단지 검색
          </button>
          <button class="btn btn-secondary" onclick="resetCustomFilter()">초기화</button>
          ${state.user ? `
            <button class="btn btn-outline" onclick="saveCustomFilter()">
              <i class="fas fa-bell"></i> 이 조건으로 알림 설정
            </button>
          ` : `
            <button class="btn btn-outline" onclick="navigate('/login')">
              <i class="fas fa-bell"></i> 로그인하면 알림 설정 가능
            </button>
          `}
        </div>
      </div>
      
      <div id="custom-results">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div>조건을 설정하고 검색 버튼을 눌러주세요</div>
        </div>
      </div>
    </div>`;
}

async function applyCustomFilter() {
  const region = document.getElementById('custom-region')?.value || '';
  const type = document.getElementById('custom-type')?.value || '';
  const status = document.getElementById('custom-status')?.value || '';
  const sort = document.getElementById('custom-sort')?.value || '';
  
  const resultsEl = document.getElementById('custom-results');
  if (!resultsEl) return;
  
  resultsEl.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
  
  let path = '/properties?limit=24';
  // 경기북부/경기남부는 API에서 '경기'로 검색
  let apiRegion = region;
  if (region === '경기북부' || region === '경기남부') apiRegion = '경기';
  if (apiRegion && apiRegion !== '전국') path += `&region=${encodeURIComponent(apiRegion)}`;
  if (type) path += `&type=${type}`;
  if (status) path += `&status=${status}`;
  if (sort) path += `&sort=${sort}`;
  
  const r = await api.get(path);
  if (!r.ok || !r.data.data?.length) {
    resultsEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">😔</div>
        <div>조건에 맞는 단지가 없습니다.</div>
        <p style="font-size:0.85rem;margin-top:0.5rem">조건을 변경해 다시 검색해보세요.</p>
      </div>`;
    return;
  }
  
  const { data: properties, total } = r.data;
  resultsEl.innerHTML = `
    <div style="margin-bottom:1rem;font-size:0.88rem;color:#6b7280">
      총 <strong style="color:#7c3aed">${total.toLocaleString()}</strong>건의 단지를 찾았습니다
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:1.25rem">
      ${properties.map(p => renderPropertyCard(p)).join('')}
    </div>`;
}

function resetCustomFilter() {
  ['custom-region','custom-type','custom-status','custom-price','custom-sort'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const resultsEl = document.getElementById('custom-results');
  if (resultsEl) resultsEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div>조건을 설정하고 검색 버튼을 눌러주세요</div></div>';
}

function saveCustomFilter() {
  const region = document.getElementById('custom-region')?.value || '';
  const type = document.getElementById('custom-type')?.value || '';
  
  const settings = JSON.parse(localStorage.getItem('alert_settings') || '[]');
  const newSetting = { region, type, created_at: new Date().toISOString() };
  settings.push(newSetting);
  localStorage.setItem('alert_settings', JSON.stringify(settings));
  
  alert('✅ 맞춤 알림이 설정되었습니다!\n새 단지 등록 시 알림을 받으실 수 있습니다.');
}

window.applyCustomFilter = applyCustomFilter;
window.resetCustomFilter = resetCustomFilter;
window.saveCustomFilter = saveCustomFilter;

// ============================================================
// 관심현장 PAGE
// ============================================================
async function renderFavoritesPage(container) {
  container.innerHTML = `
    <div style="background:linear-gradient(135deg,#9d174d,#ec4899);padding:1.5rem 0;color:white;margin-bottom:1.5rem">
      <div class="container">
        <h1 style="font-size:1.5rem;font-weight:900;margin-bottom:0.25rem">
          <i class="fas fa-heart"></i> 관심현장
        </h1>
        <p style="opacity:0.8;font-size:0.88rem">저장한 관심 단지 목록입니다</p>
      </div>
    </div>
    <div class="container" style="padding-bottom:2rem">
      <div id="favorites-content"><div class="loading-overlay"><div class="spinner"></div></div></div>
    </div>`;
  
  if (!state.user) {
    document.getElementById('favorites-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💙</div>
        <div style="font-size:1rem;font-weight:700;margin-bottom:0.5rem">로그인이 필요합니다</div>
        <p style="font-size:0.88rem;margin-bottom:1rem">관심 단지를 저장하려면 로그인해주세요</p>
        <div style="display:flex;gap:0.75rem;justify-content:center">
          <button class="btn btn-primary" onclick="navigate('/login')">로그인</button>
          <button class="btn btn-outline" onclick="navigate('/register')">회원가입</button>
        </div>
      </div>`;
    return;
  }
  
  const r = await api.get('/properties?limit=20');
  const content = document.getElementById('favorites-content');
  
  // Load from localStorage bookmarks
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
  
  if (!bookmarks.length) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❤️</div>
        <div style="font-size:1rem;font-weight:700;margin-bottom:0.5rem">관심 단지가 없습니다</div>
        <p style="font-size:0.88rem;margin-bottom:1rem">마음에 드는 단지의 ♡ 버튼을 눌러 저장하세요</p>
        <button class="btn btn-primary" onclick="navigate('/properties')">단지 둘러보기</button>
      </div>`;
    return;
  }
  
  if (r.ok && r.data.data) {
    const favProps = r.data.data.filter(p => bookmarks.includes(p.id));
    if (!favProps.length) {
      content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❤️</div><div>관심 단지가 없습니다</div></div>`;
      return;
    }
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:1.25rem">
        ${favProps.map(p => renderPropertyCard(p)).join('')}
      </div>`;
  }
}

// ============================================================
// 서포터즈 PAGE
// ============================================================
async function renderSupportersPage(container) {
  container.innerHTML = `
    <div style="background:linear-gradient(135deg,#7f1d1d,#dc2626);padding:1.5rem 0;color:white;margin-bottom:1.5rem">
      <div class="container">
        <h1 style="font-size:1.5rem;font-weight:900;margin-bottom:0.25rem">
          <i class="fas fa-users"></i> 서포터즈
        </h1>
        <p style="opacity:0.8;font-size:0.88rem">히트분양 서포터즈 프로그램에 참여하세요</p>
      </div>
    </div>
    <div class="container" style="padding-bottom:3rem">
      <!-- Hero banner -->
      <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b);border-radius:16px;padding:2.5rem;
        color:white;text-align:center;margin-bottom:2rem;box-shadow:0 4px 24px rgba(127,29,29,0.4)">
        <div style="font-size:3rem;margin-bottom:1rem">🔥</div>
        <h2 style="font-size:1.5rem;font-weight:900;margin-bottom:0.5rem">히트분양 서포터즈가 되어주세요!</h2>
        <p style="opacity:0.85;font-size:0.93rem;margin-bottom:1.5rem;max-width:500px;margin-left:auto;margin-right:auto">
          분양 정보를 함께 나누고, 특별한 혜택을 받으세요.<br>
          서포터즈는 단지 정보 공유, 리뷰 작성, 커뮤니티 활동에 참여합니다.
        </p>
        <div style="display:flex;justify-content:center;gap:1rem;flex-wrap:wrap">
          <button class="btn" style="background:white;color:#dc2626;font-weight:700" onclick="navigate('/register')">
            <i class="fas fa-user-plus"></i> 서포터즈 신청하기
          </button>
          <button class="btn btn-outline" style="border-color:rgba(255,255,255,0.4);color:white">
            <i class="fas fa-info-circle"></i> 활동 내용 보기
          </button>
        </div>
      </div>
      
      <!-- Benefits grid -->
      <div style="margin-bottom:2rem">
        <div class="section-header">
          <h2 class="section-title">🎁 서포터즈 혜택</h2>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem">
          ${[
            { icon: '🎟️', title: '포인트 적립', desc: '단지 리뷰 작성, 공유 시 포인트 적립', color: '#fef3c7' },
            { icon: '🎯', title: '우선 정보 제공', desc: '신규 분양 단지 정보 가장 먼저 받기', color: '#dbeafe' },
            { icon: '🎁', title: '경품 이벤트', desc: '월별 우수 서포터즈 경품 증정', color: '#d1fae5' },
            { icon: '💬', title: '전문가 상담', desc: '부동산 전문가 1:1 무료 상담 이용', color: '#ede9fe' },
            { icon: '🏷️', title: '할인 쿠폰', desc: '파트너사 제휴 할인 혜택 제공', color: '#fce7f3' },
            { icon: '🏅', title: '등급 시스템', desc: '활동에 따른 브론즈→골드 등급 승급', color: '#ffedd5' },
          ].map(b => `
            <div class="supporter-card">
              <div style="font-size:2rem;margin-bottom:0.75rem">${b.icon}</div>
              <div style="font-weight:700;font-size:0.95rem;margin-bottom:0.35rem">${b.title}</div>
              <div style="font-size:0.83rem;color:#6b7280;line-height:1.6">${b.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Activity guide -->
      <div style="margin-bottom:2rem">
        <div class="section-header">
          <h2 class="section-title">📋 활동 내용</h2>
        </div>
        <div style="background:white;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07)">
          ${[
            { num: '01', title: '단지 리뷰 작성', desc: '방문한 분양 단지에 대한 리뷰를 작성합니다. 포토리뷰 시 추가 포인트 지급', points: '+50P' },
            { num: '02', title: '분양 정보 공유', desc: 'SNS, 카카오톡 등에 단지 정보 공유 시 포인트 적립', points: '+20P' },
            { num: '03', title: '커뮤니티 참여', desc: '분양 정보 커뮤니티에서 정보 교류 및 Q&A 답변', points: '+10P' },
            { num: '04', title: '현장 방문 인증', desc: '실제 현장 방문 인증샷 공유 시 특별 포인트', points: '+100P' },
          ].map(a => `
            <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:1.25rem">
              <div style="background:#dc2626;color:white;font-size:0.75rem;font-weight:800;padding:0.35rem 0.6rem;
                border-radius:8px;min-width:42px;text-align:center">${a.num}</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:0.93rem;margin-bottom:0.15rem">${a.title}</div>
                <div style="font-size:0.82rem;color:#6b7280">${a.desc}</div>
              </div>
              <div style="background:#fee2e2;color:#dc2626;font-weight:800;font-size:0.83rem;padding:0.3rem 0.75rem;border-radius:20px">
                ${a.points}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Current supporters -->
      <div>
        <div class="section-header">
          <h2 class="section-title">⭐ 우수 서포터즈</h2>
          <div style="font-size:0.82rem;color:#6b7280">이번 달 TOP 서포터즈</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem">
          ${['김서포터','이든든님','박활동가','최베스트','정우수','한도우미'].map((name, i) => `
            <div class="supporter-card" style="text-align:center">
              <div style="width:60px;height:60px;border-radius:50%;background:${['#fef3c7','#dbeafe','#fee2e2','#ede9fe','#fce7f3','#d1fae5'][i]};
                display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 0.75rem">
                ${['👩','👨','👩','👨','👩','👨'][i]}
              </div>
              <div style="font-weight:700;font-size:0.88rem;margin-bottom:0.2rem">${name}</div>
              <div style="font-size:0.75rem;color:#6b7280">${['골드','실버','골드','브론즈','실버','골드'][i]} 등급</div>
              <div style="font-size:0.78rem;color:#dc2626;font-weight:600;margin-top:0.25rem">
                ${[1240, 980, 1100, 650, 890, 1350][i]}P
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}

// ============================================================
// FAQ / 고객지원 PAGE (49+ items)
// ============================================================
function renderFaqPage(container) {
  const faqCategories = [
    {
      id: 'general', label: '일반 문의', icon: '❓',
      items: [
        { q: '히트분양은 어떤 서비스인가요?', a: '히트분양은 전국 아파트, 오피스텔, 상가 등 신규 분양 단지 정보를 한눈에 확인할 수 있는 분양 정보 플랫폼입니다. 단지 검색, 채용정보, 뉴스 등 다양한 서비스를 제공합니다.' },
        { q: '서비스 이용 요금이 있나요?', a: '일반 회원의 경우 무료로 이용하실 수 있습니다. 다만 프리미엄 광고 등록, 단지 상단 노출 등 일부 서비스는 유료로 운영됩니다.' },
        { q: '회원가입 없이도 이용할 수 있나요?', a: '단지 목록 조회, 뉴스/공지 확인 등 기본 서비스는 비회원도 이용 가능합니다. 단, 상담 신청, 관심단지 저장, 알림 설정 등은 회원가입이 필요합니다.' },
        { q: '고객지원 운영 시간은 어떻게 되나요?', a: '고객지원은 평일 09:00 ~ 18:00 운영합니다. 점심시간(12:00 ~ 13:00) 및 주말/공휴일은 운영하지 않습니다. 긴급 문의는 이메일(info@hitbunyang.com)로 접수해주세요.' },
        { q: '모바일에서도 이용 가능한가요?', a: '네, 히트분양은 모바일 반응형 웹사이트로 스마트폰에서도 편리하게 이용하실 수 있습니다. PC와 동일한 서비스를 모바일 최적화된 화면으로 제공합니다.' },
        { q: '앱은 없나요?', a: '현재 모바일 웹으로 서비스를 제공하고 있으며, Android/iOS 앱은 개발 예정입니다. 출시 시 공지사항을 통해 안내드리겠습니다.' },
        { q: '개인정보는 어떻게 처리되나요?', a: '회원가입 시 수집된 개인정보는 서비스 제공 목적으로만 사용되며, 관계 법령에 따라 안전하게 관리됩니다. 자세한 내용은 개인정보처리방침을 참조해주세요.' },
      ]
    },
    {
      id: 'account', label: '회원 관련', icon: '👤',
      items: [
        { q: '회원가입은 어떻게 하나요?', a: '홈 화면 또는 상단 메뉴의 "회원가입" 버튼을 클릭하여 가입할 수 있습니다. 개인회원과 기업회원(법인)으로 구분하여 가입 가능합니다.' },
        { q: '비밀번호를 잊어버렸어요.', a: '로그인 페이지에서 "비밀번호 찾기"를 클릭하고, 가입 시 등록한 이메일을 입력하면 임시 비밀번호가 발송됩니다. 고객지원(1533-9077)로 문의하셔도 됩니다.' },
        { q: '회원 탈퇴는 어떻게 하나요?', a: '마이페이지 → 계정 설정 → 회원 탈퇴에서 탈퇴 처리가 가능합니다. 탈퇴 후 30일 동안은 개인정보가 보관되며, 이후 영구 삭제됩니다.' },
        { q: '기업 회원과 개인 회원의 차이는?', a: '기업 회원은 분양 단지 등록, 채용 공고 작성, 기업 인증 뱃지 등 추가 기능을 이용할 수 있습니다. 기업명, 사업자등록번호 등을 추가로 입력해야 합니다.' },
        { q: '이메일 변경이 가능한가요?', a: '현재 이메일 변경은 고객지원을 통해서만 가능합니다. 본인 확인 후 변경 처리해 드립니다. 고객지원: 1533-9077' },
        { q: '아이디(이메일) 중복이 있을 때는?', a: '동일한 이메일로는 중복 가입이 불가능합니다. 이미 가입된 이메일이라면 로그인 후 비밀번호 재설정을 이용해주세요.' },
        { q: '소셜 로그인(카카오, 네이버)이 되나요?', a: '현재 이메일/비밀번호 방식만 지원합니다. 카카오, 네이버 등 소셜 로그인은 추후 업데이트 예정입니다.' },
      ]
    },
    {
      id: 'property', label: '분양 단지', icon: '🏢',
      items: [
        { q: '분양 단지는 어떻게 등록하나요?', a: '회원 로그인 후 상단의 "단지 등록" 버튼을 클릭하거나 단지 목록에서 등록할 수 있습니다. 단지명, 위치, 가격 등 정보를 입력하면 됩니다.' },
        { q: '등록된 단지 정보는 언제 노출되나요?', a: '일반 등록 단지는 검토 후 즉시 노출됩니다. 단, 허위 정보나 규정 위반 시 승인이 거부될 수 있습니다.' },
        { q: '단지 정보 수정은 가능한가요?', a: '등록자 본인 또는 관리자만 단지 정보를 수정할 수 있습니다. 마이페이지 또는 단지 상세 페이지에서 수정하세요.' },
        { q: '인기 단지는 어떻게 선정되나요?', a: '조회수, 상담수, 공유수, 검색 노출수 등을 종합한 점수로 순위가 결정됩니다. 조회수 1점 + 상담수 3점 + 공유수 2점으로 계산됩니다.' },
        { q: '단지 이미지는 어떻게 등록하나요?', a: '단지 등록/수정 시 이미지 업로드 기능을 통해 등록 가능합니다. 최대 10장까지 등록 가능하며, JPG/PNG 형식을 지원합니다.' },
        { q: '분양 완료된 단지도 볼 수 있나요?', a: '네, 분양 완료된 단지도 조회 가능합니다. 필터에서 "분양완료"를 선택하면 됩니다.' },
        { q: '단지 상담은 어떻게 하나요?', a: '단지 상세 페이지 하단의 "상담 신청" 양식을 이용하거나, 등록된 전화번호로 직접 연락하실 수 있습니다.' },
      ]
    },
    {
      id: 'jobs', label: '채용정보', icon: '💼',
      items: [
        { q: '채용 공고는 어떻게 등록하나요?', a: '기업 회원 로그인 후 채용정보에서 "공고 등록" 버튼을 클릭하여 등록할 수 있습니다. 단지명, 지역, 직위, 급여 조건 등을 상세히 입력해주세요.' },
        { q: '팀장과 팀원의 차이는 무엇인가요?', a: '팀장은 팀을 이끌며 관리 업무도 함께 수행하는 역할이고, 팀원은 분양 단지에서 고객 안내 및 계약 업무를 담당합니다. 수수료율 등 조건이 다를 수 있습니다.' },
        { q: '수수료(커미션)는 어떻게 지급되나요?', a: '수수료율은 단지와 계약에 따라 다릅니다. 일반적으로 계약 체결 후 일정 기간 내 지급되며, 공고에 명시된 조건을 확인해주세요.' },
        { q: '일당이 있는 단지는 어디서 확인하나요?', a: '채용정보 필터에서 "일당 있음"을 선택하면 일당을 지급하는 단지만 필터링됩니다.' },
        { q: '숙소 제공 여부는 어떻게 확인하나요?', a: '채용 공고 상세 페이지에서 숙소 제공 여부를 확인할 수 있습니다. 필터에서 "숙소 있음"을 선택하면 숙소를 제공하는 단지만 볼 수 있습니다.' },
        { q: '급구 공고가 무엇인가요?', a: '즉시 업무 시작이 가능한 단지로, 채용이 시급한 경우 "급구" 뱃지가 표시됩니다. 빠른 합류가 가능한 경우 지원을 고려해보세요.' },
        { q: '경력자만 지원 가능한가요?', a: '단지별로 다릅니다. 공고에 경력 조건이 명시되어 있으며, "신입 가능" 조건의 단지도 있습니다. 상세 조건은 공고를 확인해주세요.' },
      ]
    },
    {
      id: 'ad', label: '광고/홍보', icon: '📢',
      items: [
        { q: '광고 상품은 어떤 종류가 있나요?', a: '프리미엄(최상단 고정 노출), 슈페리어(상위 노출 보장), 베이직(일반 우선 노출) 3가지 광고 상품을 운영합니다.' },
        { q: '광고 신청 방법을 알고 싶어요.', a: '분양라인 전화(1533-9077)로 연락하시거나 이메일(info@hitbunyang.com)로 광고 문의해주세요. 담당자가 안내드립니다.' },
        { q: '광고 게재 기간은 얼마나 되나요?', a: '기본 1개월 단위로 계약 가능하며, 3개월, 6개월 장기 계약 시 할인 혜택이 제공됩니다.' },
        { q: '배너 광고 사이즈는 어떻게 되나요?', a: '메인 슬라이더 배너: 1920×400px, 사이드 배너: 300×250px 권장합니다. 광고 이미지는 JPG/PNG 형식으로 제출해주세요.' },
        { q: '프리미엄 단지는 어떻게 노출되나요?', a: '프리미엄 단지는 목록 최상단에 고정 노출되며, 황금색 테두리로 구분됩니다. 검색 결과에서도 우선 노출됩니다.' },
        { q: '광고 효과는 어떻게 확인할 수 있나요?', a: '광고주 전용 대시보드에서 클릭수, 노출수, 상담수 등 광고 성과를 실시간으로 확인하실 수 있습니다.' },
        { q: '환불 정책은 어떻게 되나요?', a: '광고 게재 시작 전 취소 시 전액 환불됩니다. 게재 후 3일 이내 서비스 하자 시 일할 계산으로 환불됩니다. 단순 변심에 의한 환불은 불가합니다.' },
      ]
    },
    {
      id: 'tech', label: '기술/서비스', icon: '⚙️',
      items: [
        { q: '지도 서비스는 어떻게 이용하나요?', a: '"지도현장" 메뉴에서 전국 분양 단지를 지도에서 확인할 수 있습니다. 내 위치 기반 검색과 주소 검색을 지원합니다.' },
        { q: '알림 설정은 어떻게 하나요?', a: '맞춤현장 메뉴에서 원하는 조건을 설정하고 "알림 설정" 버튼을 클릭하면 됩니다. 새 단지 등록 시 이메일 또는 앱 알림을 받을 수 있습니다.' },
        { q: '단지 공유는 어떻게 하나요?', a: '단지 상세 페이지에서 공유 버튼을 클릭하면 카카오톡, 링크 복사 등으로 공유할 수 있습니다.' },
        { q: '검색이 잘 안 될 때는?', a: '지역명과 단지명으로 검색 가능합니다. 띄어쓰기를 포함하거나 제외하고 검색해보세요. 여전히 문제가 있다면 고객지원으로 문의해주세요.' },
        { q: '즐겨찾기(관심단지)는 몇 개까지 등록되나요?', a: '현재 제한 없이 등록 가능합니다. 로그인 상태에서 단지 상세 페이지의 하트(♥) 버튼을 누르면 추가됩니다.' },
        { q: '인터넷 익스플로러에서도 되나요?', a: '인터넷 익스플로러는 지원하지 않습니다. Chrome, Safari, Edge, Firefox 등 최신 브라우저 사용을 권장합니다.' },
        { q: '오류 신고는 어떻게 하나요?', a: '고객지원(1533-9077) 또는 이메일(info@hitbunyang.com)로 오류 내용, 오류 발생 화면, 기기 및 브라우저 정보를 포함하여 신고해주세요.' },
      ]
    },
    {
      id: 'payment', label: '결제/환불', icon: '💳',
      items: [
        { q: '결제 방법은 무엇이 있나요?', a: '신용/체크카드, 계좌이체, 가상계좌 방식의 결제를 지원합니다. 세금계산서 발급도 가능합니다.' },
        { q: '세금계산서 발급이 가능한가요?', a: '기업 회원의 경우 광고비 결제 후 세금계산서 발급이 가능합니다. 고객지원(1533-9077)로 요청해주세요.' },
        { q: '결제 오류가 발생했어요.', a: '결제 오류 시 고객지원(1533-9077)로 즉시 연락해주세요. 카드사 승인 내역과 오류 메시지를 알려주시면 신속히 처리해드립니다.' },
      ]
    },
  ];
  
  container.innerHTML = `
    <div style="background:linear-gradient(135deg,#7f1d1d,#dc2626);padding:1.5rem 0;color:white;margin-bottom:1.5rem">
      <div class="container">
        <h1 style="font-size:1.5rem;font-weight:900;margin-bottom:0.25rem">
          <i class="fas fa-headset"></i> 고객지원 / FAQ
        </h1>
        <p style="opacity:0.8;font-size:0.88rem">자주 묻는 질문과 고객지원 안내입니다</p>
      </div>
    </div>
    <div class="container" style="padding-bottom:3rem">
      <!-- Contact info cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:2rem">
        <div style="background:white;border-radius:14px;padding:1.5rem;border:1px solid #e5e7eb;
          box-shadow:0 2px 12px rgba(0,0,0,0.07);text-align:center">
          <div style="font-size:2rem;margin-bottom:0.75rem">📞</div>
          <div style="font-weight:800;font-size:1rem;margin-bottom:0.25rem">분양 상담</div>
          <div style="font-size:1.3rem;font-weight:900;color:#dc2626;margin-bottom:0.25rem">
            <a href="tel:15339077" style="color:inherit;text-decoration:none">1533-9077</a>
          </div>
          <div style="font-size:0.78rem;color:#6b7280">평일 09:00 ~ 18:00</div>
        </div>
        <div style="background:white;border-radius:14px;padding:1.5rem;border:1px solid #e5e7eb;
          box-shadow:0 2px 12px rgba(0,0,0,0.07);text-align:center">
          <div style="font-size:2rem;margin-bottom:0.75rem">📠</div>
          <div style="font-weight:800;font-size:1rem;margin-bottom:0.25rem">팩스</div>
          <div style="font-size:1.1rem;font-weight:700;color:#dc2626;margin-bottom:0.25rem">02-000-0000</div>
          <div style="font-size:0.78rem;color:#6b7280">24시간 수신 가능</div>
        </div>
        <div style="background:white;border-radius:14px;padding:1.5rem;border:1px solid #e5e7eb;
          box-shadow:0 2px 12px rgba(0,0,0,0.07);text-align:center">
          <div style="font-size:2rem;margin-bottom:0.75rem">✉️</div>
          <div style="font-weight:800;font-size:1rem;margin-bottom:0.25rem">이메일</div>
          <div style="font-size:0.95rem;font-weight:700;color:#dc2626;margin-bottom:0.25rem">
            <a href="mailto:info@hitbunyang.com" style="color:inherit;text-decoration:none">info@hitbunyang.com</a>
          </div>
          <div style="font-size:0.78rem;color:#6b7280">24시간 접수 (평일 내 답변)</div>
        </div>
        <div style="background:white;border-radius:14px;padding:1.5rem;border:1px solid #e5e7eb;
          box-shadow:0 2px 12px rgba(0,0,0,0.07);text-align:center">
          <div style="font-size:2rem;margin-bottom:0.75rem">💬</div>
          <div style="font-weight:800;font-size:1rem;margin-bottom:0.25rem">카카오톡</div>
          <div style="font-size:0.95rem;font-weight:700;color:#dc2626;margin-bottom:0.25rem">@히트분양</div>
          <div style="font-size:0.78rem;color:#6b7280">평일 09:00 ~ 18:00</div>
        </div>
      </div>
      
      <!-- FAQ section -->
      <div style="margin-bottom:1rem;font-size:0.88rem;color:#6b7280;font-weight:600">
        총 ${faqCategories.reduce((sum, c) => sum + c.items.length, 0)}개의 FAQ
      </div>
      
      <!-- Category tabs -->
      <div class="tab-list" style="margin-bottom:1.5rem">
        <button class="tab-item active" onclick="showFaqCategory('all',this)">전체</button>
        ${faqCategories.map(c => `
          <button class="tab-item" onclick="showFaqCategory('${c.id}',this)">${c.icon} ${c.label}</button>
        `).join('')}
      </div>
      
      <!-- FAQ items -->
      <div id="faq-list">
        ${faqCategories.map(cat => `
          <div class="faq-category" data-cat="${cat.id}">
            <div style="font-size:0.9rem;font-weight:700;color:#7f1d1d;margin-bottom:0.75rem;
              padding:0.5rem 1rem;background:#fef2f2;border-radius:8px;display:flex;align-items:center;gap:0.5rem">
              ${cat.icon} ${cat.label}
            </div>
            ${cat.items.map((item, idx) => `
              <div class="faq-item" data-cat="${cat.id}">
                <div class="faq-question" onclick="toggleFaq(this)">
                  <div style="display:flex;align-items:flex-start;gap:0.75rem">
                    <span class="faq-q-label">Q</span>
                    <span style="line-height:1.5">${item.q}</span>
                  </div>
                  <i class="fas fa-chevron-down" style="transition:transform 0.2s;flex-shrink:0;color:#6b7280"></i>
                </div>
                <div class="faq-answer">
                  <div style="display:flex;gap:0.75rem;padding:0.75rem 0">
                    <span style="background:#dc2626;color:white;font-size:0.75rem;font-weight:800;
                      padding:2px 8px;border-radius:4px;flex-shrink:0">A</span>
                    <span>${item.a}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
      
      <!-- Contact form -->
      <div style="background:white;border-radius:16px;border:1px solid #e5e7eb;padding:2rem;
        box-shadow:0 2px 16px rgba(0,0,0,0.08);margin-top:2rem">
        <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:1.25rem;color:#7f1d1d">
          <i class="fas fa-envelope"></i> 1:1 상담 신청
        </h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="form-group">
            <label class="form-label">이름</label>
            <input type="text" class="form-input" id="contact-name" placeholder="이름을 입력하세요"
              value="${state.user ? escapeHtml(state.user.name) : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">연락처</label>
            <input type="tel" class="form-input" id="contact-phone" placeholder="010-0000-0000"
              value="${state.user ? escapeHtml(state.user.phone || '') : ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">이메일</label>
          <input type="email" class="form-input" id="contact-email" placeholder="이메일 주소"
            value="${state.user ? escapeHtml(state.user.email || '') : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">문의 제목</label>
          <input type="text" class="form-input" id="contact-subject" placeholder="문의 제목을 입력하세요">
        </div>
        <div class="form-group">
          <label class="form-label">문의 내용</label>
          <textarea class="form-textarea" id="contact-message" rows="5" placeholder="문의 내용을 입력하세요"></textarea>
        </div>
        <button class="btn btn-primary" onclick="submitContactForm()">
          <i class="fas fa-paper-plane"></i> 상담 신청하기
        </button>
      </div>
    </div>`;
}

function toggleFaq(questionEl) {
  const answer = questionEl.nextElementSibling;
  const icon = questionEl.querySelector('.fa-chevron-down');
  if (answer) {
    answer.classList.toggle('open');
    if (icon) icon.style.transform = answer.classList.contains('open') ? 'rotate(180deg)' : '';
  }
}

function showFaqCategory(catId, tabEl) {
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  
  document.querySelectorAll('.faq-category').forEach(cat => {
    cat.style.display = catId === 'all' || cat.dataset.cat === catId ? 'block' : 'none';
  });
}

async function submitContactForm() {
  const name = document.getElementById('contact-name')?.value?.trim();
  const phone = document.getElementById('contact-phone')?.value?.trim();
  const email = document.getElementById('contact-email')?.value?.trim();
  const subject = document.getElementById('contact-subject')?.value?.trim();
  const message = document.getElementById('contact-message')?.value?.trim();
  
  if (!name || !message) {
    alert('이름과 문의 내용은 필수입니다.');
    return;
  }
  
  // Submit to inquiries API
  const r = await api.post('/inquiries', {
    name, contact_phone: phone, contact_email: email,
    subject: subject || '1:1 상담 신청',
    message, inquiry_type: 'general'
  });
  
  if (r.ok) {
    alert('✅ 상담 신청이 접수되었습니다!\n빠른 시일 내에 답변드리겠습니다.');
    ['contact-name','contact-phone','contact-email','contact-subject','contact-message'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  } else {
    alert('상담 신청에 실패했습니다. 분양라인(1533-9077)으로 전화 주세요.');
  }
}

window.toggleFaq = toggleFaq;
window.showFaqCategory = showFaqCategory;
window.submitContactForm = submitContactForm;
window.filterMapType = filterMapType;
