// 히트분양 - Part 5: 회원 시스템 + 관리자 대시보드

// ============================================================
// LOGIN PAGE
// ============================================================
function renderLoginPage(container) {
  if (state.user) { navigate('/'); return; }
  
  container.innerHTML = `
  <div style="min-height:calc(100vh - 200px);display:flex;align-items:center;justify-content:center;padding:2rem 1rem">
    <div style="width:100%;max-width:420px">
      <div style="text-align:center;margin-bottom:2rem">
        <div style="font-size:2rem;font-weight:900;color:#1e3a8a">분양<span style="color:#fbbf24">라인</span></div>
        <p style="color:#6b7280;margin-top:0.5rem">로그인하여 더 많은 서비스를 이용하세요</p>
      </div>
      <div style="background:white;border-radius:20px;padding:2rem;box-shadow:0 8px 32px rgba(0,0,0,0.1)">
        <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:1.5rem;text-align:center">로그인</h2>
        <form onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label"><i class="fas fa-envelope"></i> 이메일</label>
            <input class="form-input" name="email" type="email" required placeholder="이메일을 입력하세요">
          </div>
          <div class="form-group">
            <label class="form-label"><i class="fas fa-lock"></i> 비밀번호</label>
            <div style="position:relative">
              <input class="form-input" name="password" type="password" required placeholder="비밀번호를 입력하세요" id="login-pw">
              <button type="button" onclick="togglePw('login-pw','login-pw-eye')" 
                style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af">
                <i class="fas fa-eye" id="login-pw-eye"></i>
              </button>
            </div>
          </div>
          <div id="login-error" style="margin-bottom:0.75rem"></div>
          <button type="submit" class="btn btn-primary btn-lg" style="width:100%">
            <i class="fas fa-sign-in-alt"></i> 로그인
          </button>
        </form>
        <div style="text-align:center;margin-top:1.25rem;font-size:0.88rem;color:#6b7280">
          계정이 없으신가요? 
          <a href="/register" onclick="navigate('/register');return false" 
            style="color:#1e40af;font-weight:700;text-decoration:none">회원가입</a>
        </div>
        
        <!-- 테스트 계정 안내 -->
        <div style="margin-top:1.25rem;padding:0.75rem;background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd">
          <div style="font-size:0.8rem;font-weight:700;color:#0369a1;margin-bottom:0.35rem">🔑 테스트 계정</div>
          <div style="font-size:0.78rem;color:#0c4a6e">
            <div>관리자: admin@bunyang.com / admin1234!</div>
            <div>일반: user@test.com / test1234!</div>
          </div>
          <button class="btn btn-sm" style="background:#0ea5e9;color:white;margin-top:0.5rem;width:100%;font-size:0.78rem" 
            onclick="fillTestLogin('admin')">관리자로 로그인</button>
          <button class="btn btn-sm" style="background:#6b7280;color:white;margin-top:0.35rem;width:100%;font-size:0.78rem" 
            onclick="fillTestLogin('user')">일반회원으로 로그인</button>
        </div>
      </div>
    </div>
  </div>`;
}

window.fillTestLogin = function(type) {
  const emailInput = document.querySelector('input[name="email"]');
  const pwInput = document.querySelector('input[name="password"]');
  if (type === 'admin') {
    emailInput.value = 'admin@bunyang.com';
    pwInput.value = 'admin1234!';
  } else {
    emailInput.value = 'user@test.com';
    pwInput.value = 'test1234!';
  }
};

window.togglePw = function(inputId, eyeId) {
  const input = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);
  if (input.type === 'password') { input.type = 'text'; eye.classList.replace('fa-eye', 'fa-eye-slash'); }
  else { input.type = 'password'; eye.classList.replace('fa-eye-slash', 'fa-eye'); }
};

window.handleLogin = async function(e) {
  e.preventDefault();
  const form = e.target;
  const errEl = document.getElementById('login-error');
  errEl.innerHTML = '';
  
  const r = await api.post('/auth/login', {
    email: form.email.value,
    password: form.password.value
  });
  
  if (r.ok) {
    saveAuth(r.data.token, r.data.user);
    navigate('/');
  } else {
    errEl.innerHTML = `<div class="alert alert-error">${r.data.error || '로그인에 실패했습니다.'}</div>`;
  }
};

// ============================================================
// REGISTER PAGE
// ============================================================
function renderRegisterPage(container) {
  if (state.user) { navigate('/'); return; }
  
  container.innerHTML = `
  <div style="min-height:calc(100vh - 200px);display:flex;align-items:center;justify-content:center;padding:2rem 1rem">
    <div style="width:100%;max-width:500px">
      <div style="text-align:center;margin-bottom:2rem">
        <div style="font-size:2rem;font-weight:900;color:#1e3a8a">분양<span style="color:#fbbf24">라인</span></div>
        <p style="color:#6b7280;margin-top:0.5rem">회원가입 후 다양한 서비스를 이용하세요</p>
      </div>
      <div style="background:white;border-radius:20px;padding:2rem;box-shadow:0 8px 32px rgba(0,0,0,0.1)">
        <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:1.25rem;text-align:center">회원가입</h2>
        
        <!-- 회원 유형 선택 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.25rem">
          <div id="type-normal" onclick="setUserType('normal')" 
            style="border:2px solid #3b82f6;border-radius:10px;padding:0.75rem;text-align:center;cursor:pointer;background:#eff6ff">
            <i class="fas fa-user" style="font-size:1.25rem;color:#1e40af;margin-bottom:0.25rem"></i>
            <div style="font-weight:700;font-size:0.9rem;color:#1e40af">일반 회원</div>
            <div style="font-size:0.75rem;color:#6b7280">분양 정보 열람</div>
          </div>
          <div id="type-business" onclick="setUserType('business')" 
            style="border:2px solid #e5e7eb;border-radius:10px;padding:0.75rem;text-align:center;cursor:pointer">
            <i class="fas fa-building" style="font-size:1.25rem;color:#6b7280;margin-bottom:0.25rem"></i>
            <div style="font-weight:700;font-size:0.9rem;color:#374151">기업 회원</div>
            <div style="font-size:0.75rem;color:#6b7280">구인 공고 등록</div>
          </div>
        </div>
        <input type="hidden" id="user_type_val" value="normal">
        
        <form onsubmit="handleRegister(event)">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">이름 *</label>
              <input class="form-input" name="name" required placeholder="이름">
            </div>
            <div class="form-group">
              <label class="form-label">연락처</label>
              <input class="form-input" name="phone" placeholder="010-0000-0000">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">이메일 *</label>
            <input class="form-input" name="email" type="email" required placeholder="이메일 주소">
          </div>
          <div class="form-group">
            <label class="form-label">비밀번호 * (8자 이상)</label>
            <div style="position:relative">
              <input class="form-input" name="password" type="password" required minlength="8" placeholder="비밀번호" id="reg-pw">
              <button type="button" onclick="togglePw('reg-pw','reg-pw-eye')" 
                style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af">
                <i class="fas fa-eye" id="reg-pw-eye"></i>
              </button>
            </div>
          </div>
          
          <!-- 기업회원 추가 필드 -->
          <div id="business-fields" style="display:none">
            <div class="form-group">
              <label class="form-label">회사명 *</label>
              <input class="form-input" name="company_name" placeholder="(주)회사명">
            </div>
            <div class="form-group">
              <label class="form-label">사업자 등록번호</label>
              <input class="form-input" name="business_number" placeholder="000-00-00000">
            </div>
          </div>
          
          <div id="register-error"></div>
          <button type="submit" class="btn btn-primary btn-lg" style="width:100%;margin-top:0.5rem">
            <i class="fas fa-user-plus"></i> 회원가입
          </button>
        </form>
        <div style="text-align:center;margin-top:1rem;font-size:0.88rem;color:#6b7280">
          이미 계정이 있으신가요? 
          <a href="/login" onclick="navigate('/login');return false" style="color:#1e40af;font-weight:700;text-decoration:none">로그인</a>
        </div>
      </div>
    </div>
  </div>`;
}

window.setUserType = function(type) {
  document.getElementById('user_type_val').value = type;
  document.getElementById('type-normal').style.cssText = `border:2px solid ${type==='normal'?'#3b82f6':'#e5e7eb'};border-radius:10px;padding:0.75rem;text-align:center;cursor:pointer;${type==='normal'?'background:#eff6ff':''}`;
  document.getElementById('type-business').style.cssText = `border:2px solid ${type==='business'?'#3b82f6':'#e5e7eb'};border-radius:10px;padding:0.75rem;text-align:center;cursor:pointer;${type==='business'?'background:#eff6ff':''}`;
  document.getElementById('business-fields').style.display = type === 'business' ? 'block' : 'none';
  
  const icon1 = document.querySelector('#type-normal i');
  const icon2 = document.querySelector('#type-business i');
  if (icon1) icon1.style.color = type === 'normal' ? '#1e40af' : '#6b7280';
  if (icon2) icon2.style.color = type === 'business' ? '#1e40af' : '#6b7280';
};

window.handleRegister = async function(e) {
  e.preventDefault();
  const form = e.target;
  const errEl = document.getElementById('register-error');
  
  const data = {
    email: form.email.value,
    password: form.password.value,
    name: form.name.value,
    phone: form.phone.value || null,
    user_type: document.getElementById('user_type_val').value,
    company_name: form.company_name?.value || null,
    business_number: form.business_number?.value || null,
  };
  
  const r = await api.post('/auth/register', data);
  if (r.ok) {
    // Auto login
    const loginR = await api.post('/auth/login', { email: data.email, password: data.password });
    if (loginR.ok) { saveAuth(loginR.data.token, loginR.data.user); navigate('/'); }
    else navigate('/login');
  } else {
    errEl.innerHTML = `<div class="alert alert-error">${r.data.error || '회원가입에 실패했습니다.'}</div>`;
  }
};

// ============================================================
// MYPAGE
// ============================================================
async function renderMyPage(container) {
  if (!state.user) { navigate('/login'); return; }
  
  container.innerHTML = `
  <div class="container" style="padding:2rem 1rem;max-width:800px">
    <h1 style="font-size:1.2rem;font-weight:800;margin-bottom:1.5rem">마이페이지</h1>
    <div style="display:grid;grid-template-columns:200px 1fr;gap:1.5rem" class="mypage-grid">
      <!-- 사이드 메뉴 -->
      <div>
        <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid #e5e7eb">
          <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:1.25rem;text-align:center">
            <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 0.5rem;font-size:1.5rem;color:white">
              <i class="fas fa-user"></i>
            </div>
            <div style="color:white;font-weight:700">${escapeHtml(state.user.name)}</div>
            <div style="color:rgba(255,255,255,0.7);font-size:0.78rem">${state.user.user_type === 'business' ? '기업회원' : '일반회원'}</div>
          </div>
          ${['profile', 'inquiries', 'bookmarks', 'notifications'].map((tab, i) => {
            const labels = ['내 정보 수정', '나의 문의내역', '즐겨찾기', '알림'];
            const icons = ['user-edit', 'comment-alt', 'star', 'bell'];
            return `<div class="admin-nav-item" id="mypage-tab-${tab}" onclick="switchMyTab('${tab}')" style="${i===0?'border-left:3px solid #fbbf24;background:rgba(255,255,255,0.12);color:white':''}">
              <i class="fas fa-${icons[i]}"></i> ${labels[i]}
            </div>`;
          }).join('')}
          ${state.user.user_type !== 'normal' ? `
          <div class="admin-nav-item" id="mypage-tab-myposts" onclick="switchMyTab('myposts')">
            <i class="fas fa-list"></i> 내 게시글
          </div>` : ''}
        </div>
      </div>
      <div id="mypage-content">
        <div class="loading-overlay"><div class="spinner"></div></div>
      </div>
    </div>
  </div>
  <style>@media(max-width:768px){.mypage-grid{grid-template-columns:1fr!important}}</style>`;
  
  switchMyTab('profile');
}

window.switchMyTab = function(tab) {
  document.querySelectorAll('[id^="mypage-tab-"]').forEach(el => {
    el.style.cssText = '';
  });
  const active = document.getElementById('mypage-tab-' + tab);
  if (active) active.style.cssText = 'border-left:3px solid #fbbf24;background:rgba(255,255,255,0.12);color:white';
  
  const content = document.getElementById('mypage-content');
  if (tab === 'profile') renderMyProfile(content);
  else if (tab === 'inquiries') renderMyInquiries(content);
  else if (tab === 'notifications') renderMyNotifications(content);
  else content.innerHTML = `<div style="background:white;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.06)"><div class="empty-state"><div class="empty-state-icon">🚧</div><div>준비 중입니다.</div></div></div>`;
};

async function renderMyProfile(container) {
  const r = await api.get('/auth/me');
  if (!r.ok) return;
  const user = r.data;
  
  container.innerHTML = `
  <div style="background:white;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <h3 style="font-size:1rem;font-weight:700;margin-bottom:1.25rem">내 정보 수정</h3>
    <form onsubmit="updateProfile(event)">
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">이름</label>
          <input class="form-input" name="name" value="${escapeHtml(user.name)}">
        </div>
        <div class="form-group">
          <label class="form-label">연락처</label>
          <input class="form-input" name="phone" value="${escapeHtml(user.phone||'')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">이메일 (변경 불가)</label>
        <input class="form-input" value="${escapeHtml(user.email)}" disabled style="background:#f3f4f6">
      </div>
      ${user.user_type === 'business' ? `
      <div class="form-group">
        <label class="form-label">회사명</label>
        <input class="form-input" name="company_name" value="${escapeHtml(user.company_name||'')}">
      </div>` : ''}
      
      <!-- 맞춤 알림 설정 -->
      <div style="margin-top:1.25rem;border-top:1px solid #f3f4f6;padding-top:1.25rem">
        <h4 style="font-size:0.9rem;font-weight:700;margin-bottom:0.75rem">🔔 맞춤 현장 알림 설정</h4>
        <div class="form-group">
          <label class="form-label">관심 지역 (쉼표로 구분)</label>
          <input class="form-input" name="alert_regions" placeholder="예) 서울, 경기, 인천"
            value="${(() => { try { return JSON.parse(user.alert_regions||'[]').join(', '); } catch { return ''; } })()}">
        </div>
      </div>
      
      <div id="profile-msg"></div>
      <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> 저장</button>
    </form>
    
    <!-- 비밀번호 변경 -->
    <div style="margin-top:1.5rem;border-top:1px solid #f3f4f6;padding-top:1.25rem">
      <h4 style="font-size:0.9rem;font-weight:700;margin-bottom:0.75rem">🔒 비밀번호 변경</h4>
      <form onsubmit="changePassword(event)">
        <div class="form-group">
          <input class="form-input" name="current_password" type="password" placeholder="현재 비밀번호">
        </div>
        <div class="form-group">
          <input class="form-input" name="new_password" type="password" placeholder="새 비밀번호 (8자 이상)">
        </div>
        <div id="pw-msg"></div>
        <button type="submit" class="btn btn-outline btn-sm">비밀번호 변경</button>
      </form>
    </div>
  </div>`;
}

window.updateProfile = async function(e) {
  e.preventDefault();
  const form = e.target;
  const regions = form.alert_regions?.value.split(',').map(s => s.trim()).filter(Boolean) || [];
  
  const r = await api.put('/auth/me', {
    name: form.name?.value,
    phone: form.phone?.value,
    company_name: form.company_name?.value,
    alert_regions: regions,
  });
  
  const msg = document.getElementById('profile-msg');
  if (r.ok) {
    msg.innerHTML = `<div class="alert alert-success">✅ 정보가 저장되었습니다.</div>`;
    // Update local user
    state.user.name = form.name.value;
    localStorage.setItem('auth_user', JSON.stringify(state.user));
  } else {
    msg.innerHTML = `<div class="alert alert-error">${r.data.error}</div>`;
  }
};

window.changePassword = async function(e) {
  e.preventDefault();
  const form = e.target;
  const r = await api.put('/auth/password', {
    current_password: form.current_password.value,
    new_password: form.new_password.value,
  });
  const msg = document.getElementById('pw-msg');
  if (r.ok) { msg.innerHTML = `<div class="alert alert-success">✅ 비밀번호가 변경되었습니다.</div>`; form.reset(); }
  else msg.innerHTML = `<div class="alert alert-error">${r.data.error}</div>`;
};

async function renderMyInquiries(container) {
  const r = await api.get('/inquiries/my');
  if (!r.ok) return;
  const data = r.data;
  
  container.innerHTML = `
  <div style="background:white;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">나의 문의 내역</h3>
    ${data.length ? data.map(inq => `
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:1rem;margin-bottom:0.75rem">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem">
        <div>
          <span class="badge ${inq.is_replied ? 'badge-new' : 'badge-gray'}" style="margin-bottom:0.35rem">
            ${inq.is_replied ? '답변완료' : '처리중'}
          </span>
          <div style="font-weight:600;font-size:0.9rem">${inq.property_title ? escapeHtml(inq.property_title) : inq.job_title ? escapeHtml(inq.job_title) : '일반 문의'}</div>
        </div>
        <span style="font-size:0.78rem;color:#9ca3af">${formatDate(inq.created_at)}</span>
      </div>
      <div style="font-size:0.85rem;color:#374151;background:#f8fafc;padding:0.75rem;border-radius:6px">${nl2br(inq.message)}</div>
      ${inq.reply_message ? `
      <div style="font-size:0.85rem;color:#1e40af;background:#eff6ff;padding:0.75rem;border-radius:6px;margin-top:0.5rem;border-left:3px solid #3b82f6">
        <strong>답변:</strong> ${nl2br(inq.reply_message)}
      </div>` : ''}
    </div>`).join('')
    : '<div class="empty-state"><div class="empty-state-icon">💬</div><div>문의 내역이 없습니다.</div></div>'}
  </div>`;
}

async function renderMyNotifications(container) {
  container.innerHTML = `
  <div style="background:white;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">알림</h3>
    <div class="empty-state"><div class="empty-state-icon">🔔</div><div>새로운 알림이 없습니다.</div></div>
  </div>`;
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
async function renderAdminPage(container) {
  if (!state.user || state.user.user_type !== 'admin') {
    container.innerHTML = `<div class="container" style="padding:3rem 1rem;text-align:center">
      <div style="font-size:3rem">🔒</div>
      <h2 style="margin:1rem 0">관리자 전용 페이지</h2>
      <p style="color:#6b7280">관리자 권한이 필요합니다.</p>
    </div>`;
    return;
  }
  
  container.innerHTML = `
  <div style="display:flex" id="admin-layout">
    <nav class="admin-sidebar" id="admin-nav">
      <div style="padding:1rem 1.25rem;color:rgba(255,255,255,0.5);font-size:0.75rem;font-weight:700;letter-spacing:0.05em">관리자 메뉴</div>
      ${[
        ['dashboard', 'tachometer-alt', '대시보드'],
        ['properties', 'building', '분양 현장 관리'],
        ['jobs', 'briefcase', '구인 게시판 관리'],
        ['inquiries', 'comment-alt', '문의 관리'],
        ['users', 'users', '회원 관리'],
        ['news', 'newspaper', '뉴스/공지 관리'],
        ['banners', 'image', '배너 관리'],
      ].map(([id, icon, label]) => `
        <div class="admin-nav-item ${id==='dashboard'?'active':''}" id="admin-tab-${id}" onclick="switchAdminTab('${id}')">
          <i class="fas fa-${icon}"></i> ${label}
        </div>`).join('')}
    </nav>
    <div class="admin-content" id="admin-main">
      <div class="loading-overlay"><div class="spinner"></div></div>
    </div>
  </div>`;
  
  switchAdminTab('dashboard');
}

window.switchAdminTab = function(tab) {
  document.querySelectorAll('[id^="admin-tab-"]').forEach(el => el.classList.remove('active'));
  const active = document.getElementById('admin-tab-' + tab);
  if (active) active.classList.add('active');
  
  const main = document.getElementById('admin-main');
  if (tab === 'dashboard') loadAdminDashboard(main);
  else if (tab === 'inquiries') loadAdminInquiries(main);
  else if (tab === 'properties') loadAdminProperties(main);
  else if (tab === 'jobs') loadAdminJobs(main);
  else if (tab === 'users') loadAdminUsers(main);
  else if (tab === 'news') loadAdminNews(main);
  else main.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🚧</div><div>준비 중</div></div>`;
};

async function loadAdminDashboard(container) {
  container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
  const r = await api.get('/admin/dashboard');
  if (!r.ok) return;
  const { stats, recentInquiries, topProperties } = r.data;
  
  container.innerHTML = `
  <h2 style="font-size:1.25rem;font-weight:800;margin-bottom:1.5rem">대시보드</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem">
    ${[
      ['building', 'blue', '등록 현장', stats.totalProperties],
      ['briefcase', 'green', '구인 공고', stats.totalJobs],
      ['users', 'orange', '가입 회원', stats.totalUsers],
      ['comment-alt', 'purple', `문의 (미읽: ${stats.unreadInquiries})`, stats.totalInquiries],
    ].map(([icon, color, label, val]) => `
    <div class="stat-card">
      <div class="stat-icon ${color}"><i class="fas fa-${icon}"></i></div>
      <div>
        <div class="stat-label">${label}</div>
        <div class="stat-value">${val.toLocaleString()}</div>
      </div>
    </div>`).join('')}
  </div>
  
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem" class="admin-grid-2">
    <!-- 최근 문의 -->
    <div style="background:white;border-radius:12px;padding:1.25rem;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
      <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
        <i class="fas fa-comment-alt" style="color:#1e40af"></i> 최근 문의
        ${stats.unreadInquiries > 0 ? `<span class="badge badge-hot">${stats.unreadInquiries}</span>` : ''}
      </h3>
      ${recentInquiries.map(inq => `
      <div style="padding:0.6rem 0;border-bottom:1px solid #f3f4f6;cursor:pointer" onclick="switchAdminTab('inquiries')">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:0.85rem;font-weight:${inq.is_read?'400':'700'}">${escapeHtml(inq.name)} - ${escapeHtml(inq.property_title||'일반문의')}</span>
          <span style="font-size:0.75rem;color:#9ca3af">${timeAgo(inq.created_at)}</span>
        </div>
        <div style="font-size:0.78rem;color:#6b7280;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${escapeHtml(inq.message)}</div>
      </div>`).join('')}
    </div>
    
    <!-- 인기 현장 -->
    <div style="background:white;border-radius:12px;padding:1.25rem;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
      <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
        <i class="fas fa-chart-bar" style="color:#10b981"></i> 인기 현장 Top 5
      </h3>
      ${topProperties.map((p, i) => `
      <div style="padding:0.6rem 0;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:0.75rem;cursor:pointer" onclick="navigate('/properties/${p.id}')">
        <span style="width:24px;height:24px;border-radius:50%;background:${i<3?'#1e40af':'#e5e7eb'};color:${i<3?'white':'#374151'};display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;flex-shrink:0">${i+1}</span>
        <span style="flex:1;font-size:0.85rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${escapeHtml(p.title)}</span>
        <span style="font-size:0.78rem;color:#9ca3af;white-space:nowrap">👁️ ${(p.view_count||0).toLocaleString()}</span>
      </div>`).join('')}
    </div>
  </div>
  <style>@media(max-width:768px){.admin-grid-2{grid-template-columns:1fr!important}}</style>`;
}

async function loadAdminInquiries(container) {
  container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
  const r = await api.get('/inquiries?limit=50');
  if (!r.ok) return;
  
  container.innerHTML = `
  <h2 style="font-size:1.25rem;font-weight:800;margin-bottom:1.5rem">문의 관리</h2>
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    ${r.data.data.map(inq => `
    <div style="padding:1rem 1.25rem;border-bottom:1px solid #f3f4f6;${!inq.is_read?'background:#fafeff':''}" 
      onclick="openInquiryDetail(${inq.id},this)" style="cursor:pointer">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem">
        <div style="flex:1">
          <div style="display:flex;gap:0.5rem;margin-bottom:0.35rem;flex-wrap:wrap">
            ${!inq.is_read ? '<span class="badge badge-hot">미읽음</span>' : '<span class="badge badge-gray">읽음</span>'}
            ${inq.is_replied ? '<span class="badge badge-new">답변완료</span>' : ''}
            <span style="font-size:0.8rem;color:#6b7280">${inq.inquiry_type === 'property' ? '현장문의' : inq.inquiry_type === 'job' ? '구인문의' : '일반문의'}</span>
          </div>
          <div style="font-weight:${inq.is_read?'400':'700'};font-size:0.9rem">${escapeHtml(inq.name)} (${escapeHtml(inq.phone)})</div>
          <div style="font-size:0.83rem;color:#6b7280">${escapeHtml(inq.property_title || inq.job_title || '일반문의')}</div>
          <div style="font-size:0.82rem;color:#374151;margin-top:0.25rem;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${escapeHtml(inq.message)}</div>
        </div>
        <div style="font-size:0.75rem;color:#9ca3af;white-space:nowrap">${formatDate(inq.created_at)}</div>
      </div>
    </div>`).join('') || '<div style="padding:2rem;text-align:center;color:#9ca3af">문의 내역이 없습니다.</div>'}
  </div>`;
}

async function loadAdminProperties(container) {
  container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
  const r = await api.get('/properties?limit=50&status=all');
  if (!r.ok) return;
  
  container.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
    <h2 style="font-size:1.25rem;font-weight:800">분양 현장 관리</h2>
    <button class="btn btn-primary btn-sm" onclick="navigate('/properties/new')"><i class="fas fa-plus"></i> 새 현장 등록</button>
  </div>
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8fafc;border-bottom:1px solid #e5e7eb">
            <th style="padding:0.75rem 1rem;text-align:left;font-size:0.82rem;color:#6b7280;font-weight:600">현장명</th>
            <th style="padding:0.75rem 1rem;text-align:left;font-size:0.82rem;color:#6b7280;font-weight:600">지역/유형</th>
            <th style="padding:0.75rem 1rem;text-align:left;font-size:0.82rem;color:#6b7280;font-weight:600">상태</th>
            <th style="padding:0.75rem 1rem;text-align:left;font-size:0.82rem;color:#6b7280;font-weight:600">광고</th>
            <th style="padding:0.75rem 1rem;text-align:left;font-size:0.82rem;color:#6b7280;font-weight:600">조회/문의</th>
            <th style="padding:0.75rem 1rem;text-align:center;font-size:0.82rem;color:#6b7280;font-weight:600">관리</th>
          </tr>
        </thead>
        <tbody>
          ${r.data.data.map(p => `
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:0.75rem 1rem">
              <div style="font-size:0.88rem;font-weight:600">${escapeHtml(p.title)}</div>
              <div style="font-size:0.76rem;color:#9ca3af">${formatDate(p.created_at)}</div>
            </td>
            <td style="padding:0.75rem 1rem;font-size:0.85rem">${escapeHtml(p.region)} / ${getPropertyTypeLabel(p.property_type)}</td>
            <td style="padding:0.75rem 1rem">
              <span class="badge ${p.status==='active'?'badge-new':p.status==='upcoming'?'badge-upcoming':'badge-gray'}">${p.status==='active'?'분양중':p.status==='upcoming'?'예정':'완료'}</span>
            </td>
            <td style="padding:0.75rem 1rem">
              <span class="badge ${p.ad_type!=='none'?'badge-premium-ad':'badge-gray'}">${p.ad_type==='none'?'일반':p.ad_type==='premium'?'프리미엄':p.ad_type==='superior'?'슈페리어':'베이직'}</span>
            </td>
            <td style="padding:0.75rem 1rem;font-size:0.83rem;color:#6b7280">${(p.view_count||0).toLocaleString()} / ${(p.inquiry_count||0).toLocaleString()}</td>
            <td style="padding:0.75rem 1rem;text-align:center">
              <div style="display:flex;gap:0.3rem;justify-content:center">
                <button class="btn btn-sm btn-secondary" onclick="navigate('/properties/${p.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm" style="background:#fef3c7;color:#92400e" onclick="openAdModal('property',${p.id},'${p.ad_type}',${p.is_featured?1:0},${p.is_hot?1:0})"><i class="fas fa-ad"></i></button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function loadAdminJobs(container) {
  container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
  const r = await api.get('/jobs?limit=50');
  if (!r.ok) return;
  
  container.innerHTML = `
  <h2 style="font-size:1.25rem;font-weight:800;margin-bottom:1.5rem">구인 게시판 관리</h2>
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    ${r.data.data.map(j => `
    <div style="padding:0.85rem 1.25rem;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;flex-wrap:wrap">
      <div style="flex:1">
        <div style="font-size:0.88rem;font-weight:600;margin-bottom:0.2rem">${escapeHtml(j.title)}</div>
        <div style="font-size:0.78rem;color:#6b7280">${escapeHtml(j.region)} | ${getRankLabel(j.rank_type)} | ${timeAgo(j.created_at)}</div>
      </div>
      <div style="display:flex;gap:0.4rem;align-items:center;flex-shrink:0">
        <span class="badge ${j.is_hot?'badge-hot':'badge-gray'}">${j.is_hot?'HOT':'일반'}</span>
        <button class="btn btn-sm" style="background:#fef3c7;color:#92400e" onclick="openJobAdModal(${j.id},'${j.ad_type}',${j.is_hot},${j.is_urgent},${j.is_best})"><i class="fas fa-ad"></i> 광고설정</button>
        <button class="btn btn-sm btn-secondary" onclick="navigate('/jobs/${j.id}')"><i class="fas fa-eye"></i></button>
      </div>
    </div>`).join('')}
  </div>`;
}

async function loadAdminUsers(container) {
  container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
  const r = await api.get('/admin/users');
  if (!r.ok) return;
  
  container.innerHTML = `
  <h2 style="font-size:1.25rem;font-weight:800;margin-bottom:1.5rem">회원 관리 (총 ${r.data.total}명)</h2>
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    ${r.data.data.map(u => `
    <div style="padding:0.85rem 1.25rem;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;flex-wrap:wrap">
      <div>
        <div style="font-size:0.9rem;font-weight:600">${escapeHtml(u.name)}</div>
        <div style="font-size:0.78rem;color:#6b7280">${escapeHtml(u.email)} | ${escapeHtml(u.phone||'-')}</div>
        ${u.company_name ? `<div style="font-size:0.75rem;color:#1e40af">${escapeHtml(u.company_name)}</div>` : ''}
      </div>
      <div style="display:flex;gap:0.5rem;align-items:center;flex-shrink:0">
        <span class="badge ${u.user_type==='business'?'badge-blue':'badge-gray'}">${u.user_type==='business'?'기업':'일반'}</span>
        <span class="badge ${u.is_active?'badge-new':'badge-hot'}">${u.is_active?'활성':'정지'}</span>
        <button class="btn btn-sm ${u.is_active?'btn-danger':'btn-success'}" onclick="toggleUserStatus(${u.id},${u.is_active?0:1})">
          ${u.is_active?'정지':'활성화'}
        </button>
      </div>
    </div>`).join('')}
  </div>`;
}

window.toggleUserStatus = async function(userId, status) {
  const r = await api.put(`/admin/users/${userId}/status`, { is_active: status });
  if (r.ok) loadAdminUsers(document.getElementById('admin-main'));
};

async function loadAdminNews(container) {
  container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
  const r = await api.get('/news');
  if (!r.ok) return;
  
  container.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
    <h2 style="font-size:1.25rem;font-weight:800">뉴스/공지 관리</h2>
    <button class="btn btn-primary btn-sm" onclick="openNewsForm()"><i class="fas fa-plus"></i> 새 글 작성</button>
  </div>
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)" id="news-admin-list">
    ${r.data.data.map(n => `
    <div style="padding:0.85rem 1.25rem;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;gap:0.75rem">
      <div style="flex:1;overflow:hidden">
        <span class="news-type-badge news-type-${n.news_type}" style="margin-right:0.5rem">${n.news_type==='notice'?'공지':n.news_type==='event'?'이벤트':'뉴스'}</span>
        ${n.is_pinned ? '<i class="fas fa-thumbtack" style="color:#f59e0b;margin-right:0.4rem;font-size:0.8rem"></i>' : ''}
        <span style="font-size:0.88rem;font-weight:600">${escapeHtml(n.title)}</span>
      </div>
      <div style="display:flex;gap:0.4rem;align-items:center;flex-shrink:0">
        <span style="font-size:0.75rem;color:#9ca3af">${formatDate(n.created_at)}</span>
        <button class="btn btn-sm btn-danger" onclick="deleteNews(${n.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('')}
  </div>
  <div id="news-form-area"></div>`;
}

window.openNewsForm = function() {
  const area = document.getElementById('news-form-area');
  area.innerHTML = `
  <div style="background:white;border-radius:12px;padding:1.5rem;margin-top:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">새 글 작성</h3>
    <form onsubmit="submitNews(event)">
      <div class="form-grid-2">
        <div class="form-group">
          <input class="form-input" name="title" required placeholder="제목">
        </div>
        <div class="form-group">
          <select class="form-select" name="news_type">
            <option value="news">뉴스</option>
            <option value="notice">공지사항</option>
            <option value="event">이벤트</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <textarea class="form-textarea" name="content" required placeholder="내용" style="min-height:200px"></textarea>
      </div>
      <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;margin-bottom:1rem;cursor:pointer">
        <input type="checkbox" name="is_pinned"> 상단 고정
      </label>
      <div style="display:flex;gap:0.5rem">
        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> 등록</button>
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('news-form-area').innerHTML=''">취소</button>
      </div>
    </form>
  </div>`;
};

window.submitNews = async function(e) {
  e.preventDefault();
  const form = e.target;
  const r = await api.post('/news', {
    title: form.title.value,
    content: form.content.value,
    news_type: form.news_type.value,
    is_pinned: form.is_pinned.checked,
  });
  if (r.ok) loadAdminNews(document.getElementById('admin-main'));
};

window.deleteNews = async function(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  const r = await api.delete('/news/' + id);
  if (r.ok) loadAdminNews(document.getElementById('admin-main'));
};

window.openAdModal = function(type, id, current_ad, is_featured, is_hot) {
  showModal(`
  <div class="modal-header">
    <div class="modal-title">광고 설정</div>
    <button class="modal-close" onclick="closeModal()">✕</button>
  </div>
  <form onsubmit="saveAdSettings(event,'${type}',${id})">
    <div class="form-group">
      <label class="form-label">광고 유형</label>
      <select class="form-select" name="ad_type">
        <option value="none" ${current_ad==='none'?'selected':''}>일반</option>
        <option value="basic" ${current_ad==='basic'?'selected':''}>베이직</option>
        <option value="superior" ${current_ad==='superior'?'selected':''}>슈페리어</option>
        <option value="premium" ${current_ad==='premium'?'selected':''}>프리미엄</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">광고 만료일</label>
      <input class="form-input" name="ad_expires_at" type="date">
    </div>
    <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;margin-bottom:0.75rem;cursor:pointer">
      <input type="checkbox" name="is_featured" ${is_featured?'checked':''}> 추천 현장
    </label>
    <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;margin-bottom:1rem;cursor:pointer">
      <input type="checkbox" name="is_hot" ${is_hot?'checked':''}> HOT 표시
    </label>
    <button type="submit" class="btn btn-primary" style="width:100%">저장</button>
  </form>`);
};

window.openJobAdModal = function(id, ad_type, is_hot, is_urgent, is_best) {
  showModal(`
  <div class="modal-header">
    <div class="modal-title">구인 광고 설정</div>
    <button class="modal-close" onclick="closeModal()">✕</button>
  </div>
  <form onsubmit="saveJobAdSettings(event,${id})">
    <div class="form-group">
      <select class="form-select" name="ad_type">
        <option value="none" ${ad_type==='none'?'selected':''}>일반</option>
        <option value="basic" ${ad_type==='basic'?'selected':''}>베이직</option>
        <option value="superior" ${ad_type==='superior'?'selected':''}>슈페리어</option>
        <option value="premium" ${ad_type==='premium'?'selected':''}>프리미엄</option>
      </select>
    </div>
    <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;font-size:0.85rem;cursor:pointer">
      <input type="checkbox" name="is_hot" ${is_hot?'checked':''}> HOT
    </label>
    <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;font-size:0.85rem;cursor:pointer">
      <input type="checkbox" name="is_urgent" ${is_urgent?'checked':''}> 급구
    </label>
    <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;font-size:0.85rem;cursor:pointer">
      <input type="checkbox" name="is_best" ${is_best?'checked':''}> 대박
    </label>
    <button type="submit" class="btn btn-primary" style="width:100%">저장</button>
  </form>`);
};

window.saveAdSettings = async function(e, type, id) {
  e.preventDefault();
  const form = e.target;
  await api.put(`/admin/properties/${id}/ad`, {
    ad_type: form.ad_type.value,
    ad_expires_at: form.ad_expires_at.value || null,
    is_featured: form.is_featured.checked,
    is_hot: form.is_hot.checked,
  });
  closeModal();
  loadAdminProperties(document.getElementById('admin-main'));
};

window.saveJobAdSettings = async function(e, id) {
  e.preventDefault();
  const form = e.target;
  await api.put(`/admin/jobs/${id}/ad`, {
    ad_type: form.ad_type.value,
    is_hot: form.is_hot.checked,
    is_urgent: form.is_urgent.checked,
    is_best: form.is_best.checked,
  });
  closeModal();
  loadAdminJobs(document.getElementById('admin-main'));
};

window.openInquiryDetail = async function(id, el) {
  await api.get('/inquiries/' + id);
  const { data } = await api.get('/inquiries/' + id);
  showModal(`
  <div class="modal-header">
    <div class="modal-title">문의 상세</div>
    <button class="modal-close" onclick="closeModal()">✕</button>
  </div>
  <div style="margin-bottom:1rem">
    <div style="font-size:0.8rem;color:#9ca3af;margin-bottom:0.25rem">문의자</div>
    <div style="font-weight:700">${escapeHtml(data?.name||'')}</div>
    <div style="color:#1e40af">${escapeHtml(data?.phone||'')}</div>
  </div>
  <div style="background:#f8fafc;border-radius:8px;padding:0.75rem;margin-bottom:1rem;font-size:0.88rem">
    ${nl2br(data?.message||'')}
  </div>
  <form onsubmit="submitReply(event,${id})">
    <textarea class="form-textarea" name="reply" placeholder="답변 내용..." required style="min-height:100px">${data?.reply_message||''}</textarea>
    <button type="submit" class="btn btn-primary" style="width:100%;margin-top:0.5rem">답변 저장</button>
  </form>`);
};

window.submitReply = async function(e, id) {
  e.preventDefault();
  await api.put('/inquiries/' + id + '/reply', { reply_message: e.target.reply.value });
  closeModal();
  loadAdminInquiries(document.getElementById('admin-main'));
};

// ============================================================
// MODAL HELPERS
// ============================================================
function showModal(html) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
  <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
    <div class="modal-content">${html}</div>
  </div>`;
}

window.closeModal = function() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
};

// ============================================================
// INITIALIZE (app.js handles init via DOMContentLoaded)
// ============================================================
// Note: loadState() and renderApp() are called in app.js DOMContentLoaded

// Initialize admin users if needed
async function ensureAdminUser() {
  const r = await api.post('/auth/register', {
    email: 'admin@bunyang.com',
    password: 'admin1234!',
    name: '관리자',
    phone: '010-0000-0000',
    user_type: 'admin',
  });
}
