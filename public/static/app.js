// 히트분양 - 메인 앱 (상태관리, 유틸, 라우터) v4

// ============================================================
// STATE MANAGEMENT
// ============================================================
const state = {
  user: null,
  token: null,
  currentPage: '/',
  loading: false,
  visitorCount: 0,
};

function loadState() {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('auth_user');
  if (token && user) {
    try {
      state.token = token;
      state.user = JSON.parse(user);
    } catch(e) { clearAuth(); }
  }
}

function saveAuth(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

function clearAuth() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

// ============================================================
// API CLIENT
// ============================================================
const api = {
  async request(method, path, data) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    const options = { method, headers };
    if (data) options.body = JSON.stringify(data);
    try {
      const res = await fetch(`/api${path}`, options);
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) { clearAuth(); renderApp(); }
      return { ok: res.ok, status: res.status, data: json };
    } catch(e) {
      return { ok: false, status: 0, data: { error: '네트워크 오류' } };
    }
  },
  get: (path) => api.request('GET', path),
  post: (path, data) => api.request('POST', path, data),
  put: (path, data) => api.request('PUT', path, data),
  delete: (path) => api.request('DELETE', path),
};

// ============================================================
// UTILITIES
// ============================================================
function formatPrice(price) {
  if (!price) return '협의';
  if (price >= 100000000) {
    const eok = Math.floor(price / 100000000);
    const man = Math.floor((price % 100000000) / 10000);
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
  }
  return `${Math.floor(price / 10000).toLocaleString()}만원`;
}

function formatPriceRange(min, max) {
  if (!min && !max) return '가격 협의';
  if (!max || min === max) return formatPrice(min);
  return `${formatPrice(min)} ~ ${formatPrice(max)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return formatDate(dateStr);
}

function getPropertyTypeLabel(type) {
  const map = { apartment: '아파트', officetel: '오피스텔', commercial: '상가', villa: '빌라/연립', land: '토지', other: '기타' };
  return map[type] || type;
}

function getRankLabel(rank) {
  const map = { team_leader: '팀장', team_member: '팀원', any: '팀장/팀원' };
  return map[rank] || rank;
}

function getRegionColor(region) {
  const map = {
    '서울': '#dc2626', '경기북부': '#1d4ed8', '경기남부': '#0369a1',
    '인천': '#0891b2', '부산': '#ea580c', '충청': '#7c3aed',
    '전라': '#059669', '경상': '#b45309', '강원': '#6366f1',
    '대구': '#d97706', '광주': '#10b981', '대전': '#8b5cf6',
    '울산': '#2563eb', '세종': '#0284c7', '전국': '#374151',
    '경기': '#1d4ed8',
  };
  return map[region] || '#374151';
}

function getPropertyBgImage(type) {
  const colors = {
    apartment: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    officetel: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    commercial: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    villa: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    land: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    other: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  };
  return colors[type] || colors.other;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function nl2br(str) {
  if (!str) return '';
  return escapeHtml(str).replace(/\n/g, '<br>');
}

function animateNumber(el, target, duration = 1500) {
  const start = 0;
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * eased);
    el.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// 히트지수 계산 (0~100)
function calcHitScore(p) {
  if (!p) return 0;
  const views = Math.min((p.view_count || 0) / 10, 30);       // max 30점
  const inquiries = Math.min((p.inquiry_count || 0) * 3, 30); // max 30점
  const shares = Math.min((p.share_count || 0) * 2, 20);      // max 20점
  const adBonus = p.ad_type === 'premium' ? 15 : p.ad_type === 'superior' ? 8 : p.ad_type === 'standard' ? 4 : 0; // max 15점
  const newBonus = p.is_new ? 5 : 0; // max 5점
  return Math.min(Math.round(views + inquiries + shares + adBonus + newBonus), 100);
}

function getHitScoreColor(score) {
  if (score >= 80) return '#dc2626';
  if (score >= 50) return '#f97316';
  return '#3b82f6';
}

function getHitScoreLabel(score) {
  if (score >= 80) return '🔥 히트';
  if (score >= 60) return '⚡ 인기';
  if (score >= 40) return '📈 상승';
  return '🆕 신규';
}

// 히트지수 게이지 HTML
function renderHitGauge(score, size = 'sm') {
  const color = getHitScoreColor(score);
  const label = getHitScoreLabel(score);
  if (size === 'lg') {
    return `
    <div class="hit-gauge-lg">
      <div class="hit-gauge-circle" style="--score:${score};--color:${color}">
        <svg viewBox="0 0 36 36" class="hit-gauge-svg">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" stroke-width="3"/>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="${color}" stroke-width="3"
            stroke-dasharray="${score} ${100 - score}"
            stroke-dashoffset="25" stroke-linecap="round"/>
        </svg>
        <div class="hit-gauge-value" style="color:${color}">${score}</div>
      </div>
      <div class="hit-gauge-label">${label}</div>
    </div>`;
  }
  return `
  <div class="hit-score-badge" style="--color:${color}" title="히트지수 ${score}점">
    <div class="hit-score-bar-wrap">
      <div class="hit-score-bar" style="width:${score}%;background:${color}"></div>
    </div>
    <span class="hit-score-num" style="color:${color}">${score}</span>
  </div>`;
}

// ============================================================
// ROUTER
// ============================================================
function getRoutes() {
  return {
    '/': renderHomePage,
    // 현장찾기 관련
    '/sites': renderSitesPage,
    '/properties': renderPropertiesPage,
    '/properties/new': renderPropertyFormPage,
    '/properties/:id': renderPropertyDetailPage,
    // 히트맵
    '/hitmap': renderHitmapPage,
    '/map': renderMapPage,
    // 히트랭킹
    '/ranking': renderRankingPage,
    // 맞춤현장
    '/match': renderMatchPage,
    '/custom': renderCustomPage,
    // 커뮤니티
    '/community': renderCommunityPage,
    // 히트분양TV
    '/tv': renderTvPage,
    // 뉴스
    '/news': renderNewsPage,
    '/news/:id': renderNewsDetailPage,
    // 광고안내
    '/ad-info': renderAdInfoPage,
    // 고객센터
    '/support': renderSupportPage,
    '/faq': renderFaqPage,
    // 채용
    '/jobs': renderJobsPage,
    '/jobs/new': renderJobFormPage,
    '/jobs/:id': renderJobDetailPage,
    // 회원
    '/login': renderLoginPage,
    '/register': renderRegisterPage,
    '/auth': renderAuthPage,
    '/mypage': renderMyPage,
    '/my': renderMyPage,
    // 기타
    '/region': renderRegionPage,
    '/favorites': renderFavoritesPage,
    '/supporters': renderSupportersPage,
    '/admin': renderAdminPage,
  };
}

function matchRoute(path) {
  const routes = getRoutes();
  if (routes[path]) return { fn: routes[path], params: {} };
  for (const [pattern, fn] of Object.entries(routes)) {
    if (pattern === path) return { fn, params: {} };
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    if (patternParts.length !== pathParts.length) continue;
    const params = {};
    let match = true;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        match = false; break;
      }
    }
    if (match) return { fn, params };
  }
  return null;
}

function navigate(path) {
  history.pushState({}, '', path);
  state.currentPage = path;
  renderApp();
  window.scrollTo(0, 0);
}

window.navigate = navigate;

window.addEventListener('popstate', () => {
  state.currentPage = location.pathname;
  renderApp();
});

// ============================================================
// RENDER APP
// ============================================================
function renderApp() {
  const appEl = document.getElementById('app');
  if (!appEl) return;
  const path = location.pathname;
  
  appEl.innerHTML = renderNavbar() + '<main id="main-content"></main>' + renderFooter() + renderFloatingButtons();
  
  const route = matchRoute(path);
  const main = document.getElementById('main-content');
  if (!main) return;
  
  if (route) {
    route.fn(main, route.params);
  } else {
    main.innerHTML = `<div class="container" style="padding:4rem 1rem;text-align:center">
      <div style="font-size:5rem;margin-bottom:1rem">😕</div>
      <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:0.5rem">페이지를 찾을 수 없습니다</h2>
      <p style="color:#6b7280;margin-bottom:1.5rem">요청하신 페이지가 존재하지 않습니다.</p>
      <button class="btn btn-primary" onclick="navigate('/')">홈으로 돌아가기</button>
    </div>`;
  }
  
  document.querySelectorAll('[data-nav-path]').forEach(el => {
    const navPath = el.getAttribute('data-nav-path');
    const isActive = navPath === '/' ? path === '/' : path.startsWith(navPath);
    el.classList.toggle('active', isActive);
  });

  // 스크롤 → TOP 버튼 표시/숨김
  initScrollTopBtn();
}

// ============================================================
// 플로팅 버튼 (글쓰기 + TOP)
// ============================================================
function renderFloatingButtons() {
  return `
  <!-- 플로팅 버튼 -->
  <div class="fab-container" id="fab-container">
    <!-- 글쓰기 -->
    <button class="fab fab-write" id="fab-write" onclick="openWriteModal()" title="글쓰기">
      <i class="fas fa-pen"></i>
      <span class="fab-label">글쓰기</span>
    </button>
    <!-- TOP -->
    <button class="fab fab-top" id="fab-top" onclick="scrollToTop()" title="맨 위로" style="display:none">
      <i class="fas fa-chevron-up"></i>
      <span class="fab-label">TOP</span>
    </button>
  </div>

  <!-- 글쓰기 모달 -->
  <div class="modal-overlay" id="write-modal" style="display:none" onclick="if(event.target===this)closeWriteModal()">
    <div class="modal-content" style="max-width:600px;width:95%;max-height:90vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:1.25rem 1.5rem;border-bottom:1px solid #d6e4ff;position:sticky;top:0;
        background:white;z-index:1;border-radius:16px 16px 0 0">
        <h3 style="font-size:1.1rem;font-weight:800;color:#0e1f40">
          <i class="fas fa-pen" style="color:#1c7cff;margin-right:0.4rem"></i> 글쓰기
        </h3>
        <button onclick="closeWriteModal()"
          style="background:none;border:none;font-size:1.4rem;color:#8fa3c8;cursor:pointer;line-height:1">×</button>
      </div>
      <div style="padding:1.5rem">
        <!-- 카테고리 선택 -->
        <div style="margin-bottom:1rem">
          <label style="font-size:0.83rem;font-weight:700;color:#374151;display:block;margin-bottom:0.4rem">
            카테고리 <span style="color:#e53935">*</span>
          </label>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
            ${[
              {id:'review', label:'현장후기', icon:'⭐'},
              {id:'free',   label:'자유게시판', icon:'💬'},
              {id:'info',   label:'정보공유', icon:'📢'},
              {id:'qa',     label:'Q&A', icon:'❓'},
            ].map(c => `
              <button class="write-cat-btn" data-cat="${c.id}" onclick="selectWriteCat('${c.id}',this)"
                style="padding:0.45rem 0.9rem;border-radius:20px;font-size:0.82rem;font-weight:600;
                  border:1.5px solid #d6e4ff;background:white;color:#6b7280;cursor:pointer;
                  font-family:inherit;transition:all 0.15s">
                ${c.icon} ${c.label}
              </button>`).join('')}
          </div>
          <input type="hidden" id="write-cat-value" value="free">
        </div>
        <!-- 제목 -->
        <div style="margin-bottom:1rem">
          <label style="font-size:0.83rem;font-weight:700;color:#374151;display:block;margin-bottom:0.4rem">
            제목 <span style="color:#e53935">*</span>
          </label>
          <input type="text" id="write-title" class="form-input"
            placeholder="제목을 입력해주세요"
            style="width:100%"
            maxlength="100">
          <div style="text-align:right;font-size:0.72rem;color:#8fa3c8;margin-top:2px">
            <span id="write-title-count">0</span>/100
          </div>
        </div>
        <!-- 현장 연결 (선택) -->
        <div style="margin-bottom:1rem">
          <label style="font-size:0.83rem;font-weight:700;color:#374151;display:block;margin-bottom:0.4rem">
            관련 현장 <span style="font-size:0.75rem;color:#8fa3c8;font-weight:400">(선택)</span>
          </label>
          <input type="text" id="write-site" class="form-input"
            placeholder="예: 래미안 원펜타스, 힐스테이트 판교역..."
            style="width:100%">
        </div>
        <!-- 내용 -->
        <div style="margin-bottom:1.25rem">
          <label style="font-size:0.83rem;font-weight:700;color:#374151;display:block;margin-bottom:0.4rem">
            내용 <span style="color:#e53935">*</span>
          </label>
          <textarea id="write-content" class="form-input"
            placeholder="내용을 입력해주세요&#10;&#10;• 현장 후기는 실제 방문/계약 경험을 솔직하게 작성해 주세요&#10;• 욕설·비방·허위정보는 삭제될 수 있습니다"
            rows="8"
            maxlength="2000"
            style="width:100%;resize:vertical;min-height:200px"
            oninput="document.getElementById('write-content-count').textContent=this.value.length"></textarea>
          <div style="text-align:right;font-size:0.72rem;color:#8fa3c8;margin-top:2px">
            <span id="write-content-count">0</span>/2000
          </div>
        </div>
        <!-- 익명 선택 -->
        <div style="margin-bottom:1.5rem;display:flex;align-items:center;gap:0.5rem">
          <input type="checkbox" id="write-anonymous" style="width:16px;height:16px;cursor:pointer;accent-color:#1c7cff">
          <label for="write-anonymous" style="font-size:0.83rem;color:#374151;cursor:pointer;font-weight:500">
            익명으로 작성
          </label>
        </div>
        <!-- 버튼 -->
        <div style="display:flex;gap:0.75rem">
          <button onclick="closeWriteModal()"
            style="flex:1;padding:0.75rem;border-radius:10px;border:1.5px solid #d6e4ff;
              background:white;color:#6b7280;font-size:0.9rem;font-weight:600;cursor:pointer;
              font-family:inherit">
            취소
          </button>
          <button onclick="submitPost()"
            style="flex:2;padding:0.75rem;border-radius:10px;border:none;
              background:linear-gradient(135deg,#1c7cff,#5ba3ff);color:white;
              font-size:0.9rem;font-weight:700;cursor:pointer;font-family:inherit;
              box-shadow:0 4px 12px rgba(28,124,255,0.3)">
            <i class="fas fa-paper-plane"></i> 등록하기
          </button>
        </div>
        <p style="text-align:center;font-size:0.75rem;color:#8fa3c8;margin-top:0.75rem">
          <i class="fas fa-lock"></i> 게시물은 커뮤니티 이용약관에 따라 관리됩니다
        </p>
      </div>
    </div>
  </div>`;
}

// 스크롤 TOP 버튼 초기화
function initScrollTopBtn() {
  const topBtn = document.getElementById('fab-top');
  if (!topBtn) return;
  window.onscroll = null;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      topBtn.style.display = 'flex';
    } else {
      topBtn.style.display = 'none';
    }
  }, { passive: true });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 글쓰기 모달 열기
function openWriteModal() {
  if (!state.user) {
    if (confirm('로그인이 필요합니다. 로그인 페이지로 이동할까요?')) {
      navigate('/login');
    }
    return;
  }
  const modal = document.getElementById('write-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // 기본 카테고리 선택 표시
    const defaultBtn = document.querySelector('.write-cat-btn[data-cat="free"]');
    if (defaultBtn) selectWriteCat('free', defaultBtn);
    setTimeout(() => document.getElementById('write-title')?.focus(), 100);
  }
}

function closeWriteModal() {
  const modal = document.getElementById('write-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    // 폼 초기화
    const ids = ['write-title','write-content','write-site'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('write-title-count').textContent = '0';
    document.getElementById('write-content-count').textContent = '0';
    const anon = document.getElementById('write-anonymous');
    if (anon) anon.checked = false;
  }
}

function selectWriteCat(catId, btn) {
  document.querySelectorAll('.write-cat-btn').forEach(b => {
    b.style.background = 'white';
    b.style.color = '#6b7280';
    b.style.borderColor = '#d6e4ff';
  });
  if (btn) {
    btn.style.background = '#e8f2ff';
    btn.style.color = '#1c7cff';
    btn.style.borderColor = '#1c7cff';
  }
  const inp = document.getElementById('write-cat-value');
  if (inp) inp.value = catId;
}

async function submitPost() {
  const title   = document.getElementById('write-title')?.value?.trim();
  const content = document.getElementById('write-content')?.value?.trim();
  const cat     = document.getElementById('write-cat-value')?.value || 'free';
  const site    = document.getElementById('write-site')?.value?.trim();
  const anon    = document.getElementById('write-anonymous')?.checked;

  if (!title)   { alert('제목을 입력해주세요.'); document.getElementById('write-title')?.focus(); return; }
  if (!content) { alert('내용을 입력해주세요.'); document.getElementById('write-content')?.focus(); return; }
  if (content.length < 10) { alert('내용을 10자 이상 입력해주세요.'); return; }

  const submitBtn = document.querySelector('#write-modal button[onclick="submitPost()"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 등록 중...'; }

  try {
    const res = await api.post('/api/community/posts', { title, content, category: cat, related_site: site || null, is_anonymous: anon });
    if (res.ok) {
      closeWriteModal();
      showToast('✅ 게시물이 등록되었습니다!', 'success');
      // 커뮤니티 탭으로 이동
      setTimeout(() => navigate('/community?tab=' + cat), 500);
    } else {
      showToast(res.data?.error || '등록 중 오류가 발생했습니다.', 'error');
    }
  } catch(e) {
    // 백엔드 미연동 시 데모 처리
    closeWriteModal();
    showToast('✅ 게시물이 등록되었습니다! (데모)', 'success');
    setTimeout(() => navigate('/community?tab=' + cat), 500);
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 등록하기'; }
  }
}

// 토스트 알림
function showToast(msg, type = 'info') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    document.body.appendChild(toast);
  }
  const colors = { success: '#2e7d32', error: '#c62828', info: '#1c7cff', warning: '#f9a825' };
  toast.style.cssText = `
    position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
    background:${colors[type]||colors.info};color:white;
    padding:0.75rem 1.5rem;border-radius:12px;font-size:0.88rem;font-weight:600;
    box-shadow:0 4px 20px rgba(0,0,0,0.25);z-index:99999;
    animation:slideUp 0.3s ease;white-space:nowrap;max-width:90vw;text-align:center
  `;
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
window.showToast = showToast;

// ============================================================
// NAVBAR (새 메뉴 구조)
// ============================================================
function renderNavbar() {
  const user = state.user;
  const path = location.pathname;
  
  // 새 메인 메뉴 구조
  const mainMenus = [
    { label: '현장찾기', path: '/sites', icon: 'fa-search-location', hot: false },
    { label: '히트맵', path: '/hitmap', icon: 'fa-fire-alt', hot: true },
    { label: '히트랭킹', path: '/ranking', icon: 'fa-trophy', hot: true },
    { label: '맞춤현장', path: '/match', icon: 'fa-magic', hot: false },
    { label: '커뮤니티', path: '/community', icon: 'fa-comments', hot: false },
    { label: '히트TV', path: '/tv', icon: 'fa-play-circle', hot: false },
  ];

  const subMenus = [
    { label: '뉴스', path: '/news', icon: 'fa-newspaper' },
    { label: '채용정보', path: '/jobs', icon: 'fa-briefcase' },
    { label: '광고안내', path: '/ad-info', icon: 'fa-ad' },
    { label: '고객센터', path: '/support', icon: 'fa-headset' },
  ];

  return `
  <nav class="navbar" id="main-navbar">
    <div class="navbar-inner">
      <div class="navbar-top">
        <a class="navbar-brand" href="/" onclick="navigate('/');return false">
          <img src="/static/logo.png" alt="히트분양" class="brand-logo-img">
          <div class="brand-text-wrap">
            <span class="brand-hit">히트</span><span class="brand-bun">분양</span>
            <span class="brand-tag">HITBUNYANG.COM</span>
          </div>
        </a>
        <div class="navbar-search desktop-only">
          <div class="search-wrap">
            <input type="text" id="nav-search-input" placeholder="현장명, 지역으로 검색..." 
              onkeydown="if(event.key==='Enter'){doNavSearch();}" autocomplete="off">
            <button onclick="doNavSearch()"><i class="fas fa-search"></i></button>
          </div>
        </div>
        <div class="navbar-actions">
          ${user ? `
            <span class="user-name-badge"><i class="fas fa-user-circle"></i> ${escapeHtml(user.name)}</span>
            ${user.user_type === 'admin' ? `<a class="nav-action-btn" onclick="navigate('/admin');return false" href="/admin"><i class="fas fa-cog"></i></a>` : ''}
            <a class="nav-action-btn" onclick="navigate('/my');return false" href="/my"><i class="fas fa-user"></i> MY</a>
            <button class="nav-action-btn" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i></button>
          ` : `
            <a class="nav-action-btn" onclick="navigate('/login');return false" href="/login">로그인</a>
            <a class="nav-action-btn accent" onclick="navigate('/register');return false" href="/register">무료가입</a>
          `}
          <button id="mobile-toggle" class="mobile-toggle-btn" onclick="toggleMobileMenu()" aria-label="메뉴">
            <i class="fas fa-bars"></i>
          </button>
        </div>
      </div>
      <!-- 메인 메뉴 바 -->
      <div class="navbar-bottom desktop-only">
        ${mainMenus.map(m => `
          <a class="main-nav-item ${(m.path === '/' ? path === '/' : path.startsWith(m.path)) ? 'active' : ''}" 
            href="${m.path}" onclick="navigate('${m.path}');return false" data-nav-path="${m.path}">
            <i class="fas ${m.icon}"></i> ${m.label}
            ${m.hot ? `<span class="nav-hot-badge">NEW</span>` : ''}
          </a>
        `).join('')}
        <div class="nav-divider"></div>
        ${subMenus.map(m => `
          <a class="main-nav-item sub ${path.startsWith(m.path) ? 'active' : ''}" 
            href="${m.path}" onclick="navigate('${m.path}');return false" data-nav-path="${m.path}">
            <i class="fas ${m.icon}"></i> ${m.label}
          </a>
        `).join('')}
        <a class="nav-hit-score-link desktop-only" href="/ranking" onclick="navigate('/ranking');return false">
          <i class="fas fa-fire" style="color:#fcd34d"></i> 히트지수란?
        </a>
      </div>
    </div>
    <!-- Mobile menu -->
    <div id="mobile-menu" class="mobile-menu">
      <div class="mobile-search">
        <input type="text" id="mobile-search-input" placeholder="현장명, 지역으로 검색..." 
          onkeydown="if(event.key==='Enter'){doMobileSearch();}">
        <button onclick="doMobileSearch()"><i class="fas fa-search"></i></button>
      </div>
      <div class="mobile-menu-section">
        <div class="mobile-menu-section-title">메인 서비스</div>
        <div class="mobile-menu-grid">
          ${mainMenus.map(m => `
            <a class="mobile-menu-item ${(m.path === '/' ? path === '/' : path.startsWith(m.path)) ? 'active' : ''}"
              href="${m.path}" onclick="navigate('${m.path}');toggleMobileMenu();return false">
              <i class="fas ${m.icon}"></i>
              <span>${m.label}</span>
              ${m.hot ? `<em class="mobile-hot">NEW</em>` : ''}
            </a>
          `).join('')}
        </div>
      </div>
      <div class="mobile-menu-section">
        <div class="mobile-menu-section-title">더보기</div>
        <div class="mobile-menu-grid">
          ${subMenus.map(m => `
            <a class="mobile-menu-item ${path.startsWith(m.path) ? 'active' : ''}"
              href="${m.path}" onclick="navigate('${m.path}');toggleMobileMenu();return false">
              <i class="fas ${m.icon}"></i>
              <span>${m.label}</span>
            </a>
          `).join('')}
          <a class="mobile-menu-item ${path === '/' ? 'active' : ''}"
            href="/" onclick="navigate('/');toggleMobileMenu();return false">
            <i class="fas fa-home"></i><span>홈</span>
          </a>
        </div>
      </div>
    </div>
  </nav>`;
}

function doNavSearch() {
  const q = document.getElementById('nav-search-input')?.value?.trim();
  if (q) navigate('/sites?search=' + encodeURIComponent(q));
}

function doMobileSearch() {
  const q = document.getElementById('mobile-search-input')?.value?.trim();
  if (q) { navigate('/sites?search=' + encodeURIComponent(q)); toggleMobileMenu(); }
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
}

function handleLogout() {
  clearAuth();
  navigate('/');
}

// ============================================================
// FOOTER
// ============================================================
function renderFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-col-brand">
          <div class="footer-brand">
            <img src="/static/logo.png" alt="히트분양" class="footer-logo-img">
            <span><span class="brand-hit">히트</span><span class="brand-bun">분양</span></span>
          </div>
          <p class="footer-tagline">대한민국 분양정보 히트 플랫폼</p>
          <p class="footer-desc">전국 신규 분양 단지 정보와 분양 채용 정보를<br>히트지수 기반으로 한눈에!</p>
          <div class="footer-contact">
            <div><i class="fas fa-phone"></i> 고객지원: <strong>1533-9077</strong></div>
            <div><i class="fas fa-clock"></i> 평일 09:00~18:00 (점심 12:00~13:00)</div>
            <div><i class="fas fa-envelope"></i> info@hitbunyang.com</div>
          </div>
          <div class="footer-sns">
            <a href="#" class="footer-sns-btn" title="유튜브"><i class="fab fa-youtube"></i></a>
            <a href="#" class="footer-sns-btn" title="인스타그램"><i class="fab fa-instagram"></i></a>
            <a href="#" class="footer-sns-btn" title="카카오톡"><i class="fas fa-comment-dots"></i></a>
            <a href="#" class="footer-sns-btn" title="네이버블로그"><i class="fas fa-blog"></i></a>
          </div>
        </div>
        <div class="footer-col">
          <div class="footer-section-title">서비스</div>
          <div class="footer-links">
            <a class="footer-link" href="/sites" onclick="navigate('/sites');return false"><i class="fas fa-search-location"></i> 현장찾기</a>
            <a class="footer-link" href="/hitmap" onclick="navigate('/hitmap');return false"><i class="fas fa-fire-alt"></i> 히트맵</a>
            <a class="footer-link" href="/ranking" onclick="navigate('/ranking');return false"><i class="fas fa-trophy"></i> 히트랭킹</a>
            <a class="footer-link" href="/match" onclick="navigate('/match');return false"><i class="fas fa-magic"></i> 맞춤현장</a>
            <a class="footer-link" href="/community" onclick="navigate('/community');return false"><i class="fas fa-comments"></i> 커뮤니티</a>
            <a class="footer-link" href="/tv" onclick="navigate('/tv');return false"><i class="fas fa-play-circle"></i> 히트TV</a>
          </div>
        </div>
        <div class="footer-col">
          <div class="footer-section-title">정보</div>
          <div class="footer-links">
            <a class="footer-link" href="/news" onclick="navigate('/news');return false">뉴스/공지</a>
            <a class="footer-link" href="/jobs" onclick="navigate('/jobs');return false">채용정보</a>
            <a class="footer-link" href="/ad-info" onclick="navigate('/ad-info');return false">광고안내</a>
            <a class="footer-link" href="/support" onclick="navigate('/support');return false">고객센터/FAQ</a>
          </div>
          <div class="footer-section-title" style="margin-top:1.25rem">광고 상품</div>
          <div class="footer-ad-tiers">
            <div class="footer-ad-tier hit">🔥 히트AD<span>히어로 슬롯 + 맵 강조</span></div>
            <div class="footer-ad-tier premium">⭐ 프리미엄<span>상단 우선노출</span></div>
            <div class="footer-ad-tier standard">📌 스탠다드<span>하이라이트 배경</span></div>
          </div>
          <button class="footer-ad-btn" onclick="navigate('/ad-info')">광고 신청하기 →</button>
        </div>
        <div class="footer-col">
          <div class="footer-section-title">히트지수란?</div>
          <div style="font-size:0.82rem;color:rgba(255,255,255,0.55);line-height:1.9">
            <div>📊 조회수 · 문의수 · 공유수</div>
            <div>⭐ 광고 등급 · 신규 등록</div>
            <div>🏢 대행사 리뷰 점수</div>
            <div style="margin-top:0.5rem;color:rgba(255,255,255,0.35)">를 가중 합산한 0~100점</div>
          </div>
          <button class="btn btn-sm" style="margin-top:1rem;background:rgba(144,202,249,0.15);color:#7dc3ff;border:1px solid rgba(144,202,249,0.3)"
            onclick="navigate('/ranking')">
            <i class="fas fa-trophy"></i> 히트랭킹 보기
          </button>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-bottom-left">
          <span>© 2025 더블유부동산. All rights reserved.</span>
          <span>사업자등록번호: 589-24-01721</span>
          <span>대표: 이광철</span>
        </div>
        <div class="footer-bottom-right">
          <a class="footer-link" href="#">이용약관</a>
          <a class="footer-link" href="#">개인정보처리방침</a>
          <a class="footer-link" href="/ad-info" onclick="navigate('/ad-info');return false">광고문의</a>
        </div>
      </div>
    </div>
  </footer>`;
}

// ============================================================
// PROPERTY CARD (히트지수 포함)
// ============================================================
function renderPropertyCard(p, rank) {
  const hitScore = calcHitScore(p);
  const badges = [];
  if (p.ad_type === 'hit') badges.push('<span class="badge badge-hit-ad">🔥 히트AD</span>');
  else if (p.ad_type === 'premium') badges.push('<span class="badge badge-premium-ad">⭐ 프리미엄</span>');
  else if (p.ad_type === 'standard') badges.push('<span class="badge badge-standard-ad">📌 스탠다드</span>');
  if (p.is_hot) badges.push('<span class="badge badge-hot">HOT</span>');
  if (p.is_new) badges.push('<span class="badge badge-new">NEW</span>');
  if (p.is_featured) badges.push('<span class="badge badge-featured">추천</span>');
  if (p.status === 'upcoming') badges.push('<span class="badge badge-upcoming">분양예정</span>');
  
  const adClass = p.ad_type === 'hit' ? 'ad-hit' : p.ad_type === 'premium' ? 'ad-premium' : p.ad_type === 'standard' ? 'ad-standard' : '';
  const rankBadge = rank ? `<div class="rank-badge">${rank}</div>` : '';
  
  return `
  <div class="property-card ${adClass}" onclick="navigate('/properties/${p.id}')">
    <div class="card-image" style="background:${getPropertyBgImage(p.property_type)}">
      ${rankBadge}
      <div class="card-badges">${badges.join('')}</div>
      <i class="fas fa-building placeholder-icon"></i>
      <div class="card-hit-overlay">${renderHitGauge(hitScore)}</div>
    </div>
    <div class="card-body">
      <div class="card-tags">
        <span class="region-tag" style="background:${getRegionColor(p.region)}22;color:${getRegionColor(p.region)};border:1px solid ${getRegionColor(p.region)}44">
          <i class="fas fa-map-marker-alt" style="font-size:0.6rem"></i> ${escapeHtml(p.region)}
        </span>
        <span class="badge badge-gray">${getPropertyTypeLabel(p.property_type)}</span>
      </div>
      <div class="card-title">${escapeHtml(p.title)}</div>
      ${p.subtitle ? `<div class="card-subtitle">${escapeHtml(p.subtitle)}</div>` : ''}
      <div class="card-price">${formatPriceRange(p.price_min, p.price_max)}</div>
      <div class="card-meta">
        ${p.supply_area_min ? `<span class="card-meta-item"><i class="fas fa-ruler-combined"></i> ${p.supply_area_min}㎡~</span>` : ''}
        ${p.total_units ? `<span class="card-meta-item"><i class="fas fa-home"></i> ${p.total_units.toLocaleString()}세대</span>` : ''}
        ${p.completion_date ? `<span class="card-meta-item"><i class="fas fa-calendar"></i> ${p.completion_date}</span>` : ''}
      </div>
    </div>
    <div class="card-footer">
      <span><i class="fas fa-eye"></i> ${(p.view_count||0).toLocaleString()}</span>
      <span><i class="fas fa-comment"></i> ${(p.inquiry_count||0).toLocaleString()}</span>
      <span>${timeAgo(p.created_at)}</span>
    </div>
  </div>`;
}

// ============================================================
// PLACEHOLDER PAGES (새 페이지 stub - 각 파일에서 override됨)
// ============================================================
function renderSitesPage(container) {
  // app-sites.js에서 override
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
  setTimeout(() => renderSitesPageContent(container), 0);
}

function renderHitmapPage(container) {
  // app-hitmap.js에서 override
  if (typeof renderHitmapPageContent === 'function') {
    renderHitmapPageContent(container);
  } else {
    renderMapPage(container);
  }
}

function renderRankingPage(container) {
  if (typeof renderRankingPageContent === 'function') {
    renderRankingPageContent(container);
  } else {
    _renderRankingFallback(container);
  }
}

function renderMatchPage(container) {
  renderCustomPage(container);
}

function renderCommunityPage(container) {
  if (typeof renderCommunityPageContent === 'function') {
    renderCommunityPageContent(container);
  } else {
    _renderCommunityFallback(container);
  }
}

function renderTvPage(container) {
  if (typeof renderTvPageContent === 'function') {
    renderTvPageContent(container);
  } else {
    _renderTvFallback(container);
  }
}

function renderAdInfoPage(container) {
  if (typeof renderAdInfoPageContent === 'function') {
    renderAdInfoPageContent(container);
  } else {
    _renderAdInfoFallback(container);
  }
}

function renderSupportPage(container) {
  renderFaqPage(container);
}

function renderAuthPage(container) {
  renderLoginPage(container);
}

// ============================================================
// FALLBACK RENDERS (before specific page files load)
// ============================================================
function _renderRankingFallback(container) {
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
}

function _renderCommunityFallback(container) {
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
}

function _renderTvFallback(container) {
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
}

function _renderAdInfoFallback(container) {
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderApp();
  
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (a && a.href && a.href.startsWith(location.origin) && !a.href.includes('#') && !a.target) {
      const href = new URL(a.href).pathname + new URL(a.href).search;
      if (!href.startsWith('/api/') && !href.startsWith('/static/')) {
        e.preventDefault();
        navigate(href);
      }
    }
  });
});

// Global exports
window.openWriteModal   = openWriteModal;
window.closeWriteModal  = closeWriteModal;
window.selectWriteCat   = selectWriteCat;
window.submitPost       = submitPost;
window.scrollToTop      = scrollToTop;
window.showToast        = showToast;
