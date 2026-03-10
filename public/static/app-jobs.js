// 분양라인 - Part 4: 구인게시판 + 회원 + 뉴스 + 관리자

// ============================================================
// JOBS LIST PAGE
// ============================================================
async function renderJobsPage(container) {
  const params = new URLSearchParams(location.search);
  const region = params.get('region') || 'all';
  const rank = params.get('rank') || 'all';
  const min_commission = params.get('min_commission') || '';
  const min_daily = params.get('min_daily') || '';
  const has_accommodation = params.get('has_accommodation') || '';
  const search = params.get('search') || '';
  const sort = params.get('sort') || 'latest';
  const page = parseInt(params.get('page') || '1');
  
  container.innerHTML = `
  <div style="background:white;border-bottom:1px solid #e5e7eb;padding:1rem 0">
    <div class="container">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;margin-bottom:0.75rem">
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span style="font-size:1.25rem">💼</span>
          <h1 style="font-size:1.2rem;font-weight:800">분양 구인 게시판</h1>
        </div>
        ${state.user ? `<button class="btn btn-primary btn-sm" onclick="navigate('/jobs/new')"><i class="fas fa-plus"></i> 구인 공고 등록</button>` : 
          `<button class="btn btn-outline btn-sm" onclick="navigate('/login')"><i class="fas fa-lock"></i> 로그인 후 등록</button>`}
      </div>
      <div class="filter-bar">
        <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center">
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
            <span style="font-size:0.8rem;color:#6b7280;align-self:center">지역</span>
            ${['all','서울','경기','인천','부산','충청','전라','경상','강원'].map(r =>
              `<button class="filter-btn ${region===r?'active':''}" onclick="updateJobFilter('region','${r}')">${r==='all'?'전체':r}</button>`
            ).join('')}
          </div>
          <div style="height:1px;background:#e5e7eb;width:100%"></div>
          <div style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap">
            <span style="font-size:0.8rem;color:#6b7280">직급</span>
            ${[['all','전체'],['team_leader','팀장'],['team_member','팀원']].map(([v,l]) =>
              `<button class="filter-btn ${rank===v?'active':''}" onclick="updateJobFilter('rank','${v}')">${l}</button>`
            ).join('')}
            <div style="height:20px;width:1px;background:#e5e7eb;margin:0 0.25rem"></div>
            <label style="display:flex;align-items:center;gap:0.4rem;font-size:0.82rem;cursor:pointer">
              <input type="checkbox" ${has_accommodation==='1'?'checked':''} onchange="updateJobFilter('has_accommodation',this.checked?'1':'')"> 숙소비 지원
            </label>
            <select class="filter-select" onchange="updateJobFilter('sort',this.value)">
              <option value="latest" ${sort==='latest'?'selected':''}>최신순</option>
              <option value="hot" ${sort==='hot'?'selected':''}>인기순</option>
              <option value="commission" ${sort==='commission'?'selected':''}>수수료 높은순</option>
              <option value="daily_pay" ${sort==='daily_pay'?'selected':''}>일비 높은순</option>
            </select>
            <div style="position:relative">
              <i class="fas fa-search" style="position:absolute;left:0.6rem;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:0.8rem"></i>
              <input type="text" id="job-search" value="${escapeHtml(search)}" placeholder="현장명/지역 검색"
                style="padding:0.45rem 0.75rem 0.45rem 2rem;border:1.5px solid #e5e7eb;border-radius:8px;font-size:0.85rem;outline:none;width:160px"
                onkeydown="if(event.key==='Enter')updateJobFilter('search',this.value)">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="container" style="padding-top:1.5rem;padding-bottom:2rem">
    <div id="jobs-list"><div class="loading-overlay"><div class="spinner"></div></div></div>
  </div>`;
  
  await loadJobs(region, rank, min_commission, min_daily, has_accommodation, search, sort, page);
}

window.updateJobFilter = function(key, value) {
  const params = new URLSearchParams(location.search);
  params.set(key, value);
  if (key !== 'page') params.set('page', '1');
  navigate('/jobs?' + params.toString());
};

async function loadJobs(region, rank, min_commission, min_daily, has_accommodation, search, sort, page) {
  const p = new URLSearchParams();
  if (region !== 'all') p.set('region', region);
  if (rank !== 'all') p.set('rank', rank);
  if (min_commission) p.set('min_commission', min_commission);
  if (min_daily) p.set('min_daily_pay', min_daily);
  if (has_accommodation) p.set('has_accommodation', has_accommodation);
  if (search) p.set('search', search);
  p.set('sort', sort);
  p.set('page', page);
  p.set('limit', '15');
  
  const r = await api.get('/jobs?' + p.toString());
  const list = document.getElementById('jobs-list');
  if (!list) return;
  
  if (!r.ok) { list.innerHTML = `<div class="alert alert-error">데이터를 불러오는데 실패했습니다.</div>`; return; }
  
  const { data, total, pages } = r.data;
  
  if (!data.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💼</div><div class="empty-state-text">등록된 구인 공고가 없습니다.</div></div>`;
    return;
  }
  
  list.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <span style="font-size:0.9rem;color:#6b7280">총 <strong style="color:#1f2937">${total.toLocaleString()}</strong>개의 공고</span>
    </div>
    ${data.map(j => renderJobCard(j)).join('')}
    ${renderPagination(page, pages, (p) => updateJobFilter('page', p))}`;
}

function renderJobCard(j) {
  const badges = [];
  if (j.ad_type === 'premium') badges.push('<span class="badge badge-premium-ad">★ 프리미엄</span>');
  if (j.ad_type === 'superior') badges.push('<span class="badge" style="background:#ede9fe;color:#6d28d9;border:1px solid #c4b5fd">◆ 슈페리어</span>');
  if (j.is_urgent) badges.push('<span class="badge badge-urgent">급구</span>');
  if (j.is_hot) badges.push('<span class="badge badge-hot">HOT</span>');
  if (j.is_best) badges.push('<span class="badge badge-best">대박</span>');
  
  return `
  <div class="job-card ${j.ad_type==='premium'?'ad-premium':j.ad_type==='superior'?'ad-superior':''}" 
    onclick="navigate('/jobs/${j.id}')" style="margin-bottom:0.75rem">
    <div class="job-card-header">
      <div>
        <div style="display:flex;gap:0.4rem;margin-bottom:0.4rem;flex-wrap:wrap">${badges.join('')}</div>
        <div class="job-title">${escapeHtml(j.title)}</div>
        <div class="job-site"><i class="fas fa-map-pin"></i> ${escapeHtml(j.site_name)}</div>
      </div>
      <div style="text-align:right;white-space:nowrap">
        <div style="font-size:0.75rem;color:#9ca3af">${timeAgo(j.created_at)}</div>
        <div style="font-size:0.75rem;color:#9ca3af;margin-top:0.25rem">조회 ${(j.view_count||0).toLocaleString()}</div>
      </div>
    </div>
    <div style="display:flex;gap:0.75rem;font-size:0.82rem;color:#6b7280;flex-wrap:wrap;margin-bottom:0.4rem">
      <span><i class="fas fa-map-marker-alt" style="color:#3b82f6"></i> ${escapeHtml(j.region)}</span>
      <span><i class="fas fa-users" style="color:#10b981"></i> ${getRankLabel(j.rank_type)}</span>
      ${j.experience_required ? `<span><i class="fas fa-briefcase" style="color:#f59e0b"></i> ${escapeHtml(j.experience_required)}</span>` : ''}
    </div>
    <div class="job-conditions">
      ${j.commission_rate ? `<span class="job-condition-badge commission"><i class="fas fa-percent"></i> 수수료 ${j.commission_rate}%</span>` : ''}
      ${j.daily_pay > 0 ? `<span class="job-condition-badge daily"><i class="fas fa-money-bill"></i> 일비 ${(j.daily_pay).toLocaleString()}원</span>` : ''}
      ${j.accommodation_pay > 0 ? `<span class="job-condition-badge accommodation"><i class="fas fa-hotel"></i> 숙소비 ${(j.accommodation_pay).toLocaleString()}원</span>` : ''}
    </div>
    ${j.contact_name ? `<div style="margin-top:0.5rem;font-size:0.8rem;color:#6b7280">담당: ${escapeHtml(j.contact_name)} | ${escapeHtml(j.contact_phone)}</div>` : ''}
  </div>`;
}

// ============================================================
// JOB DETAIL PAGE
// ============================================================
async function renderJobDetailPage(container, params) {
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
  
  const r = await api.get(`/jobs/${params.id}`);
  if (!r.ok) { container.innerHTML = `<div class="container"><div class="alert alert-error">게시글을 불러오는데 실패했습니다.</div></div>`; return; }
  
  const { post: j, related } = r.data;
  
  const badges = [];
  if (j.is_urgent) badges.push('<span class="badge badge-urgent" style="font-size:0.85rem;padding:4px 12px">🚨 급구</span>');
  if (j.is_hot) badges.push('<span class="badge badge-hot" style="font-size:0.85rem;padding:4px 12px">🔥 HOT</span>');
  if (j.is_best) badges.push('<span class="badge badge-best" style="font-size:0.85rem;padding:4px 12px">💰 대박</span>');
  
  container.innerHTML = `
  <div class="container" style="padding-top:1.5rem;padding-bottom:3rem">
    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;font-size:0.85rem;color:#6b7280">
      <a href="/" onclick="navigate('/');return false" style="color:#6b7280;text-decoration:none">홈</a>
      <i class="fas fa-chevron-right" style="font-size:0.7rem"></i>
      <a href="/jobs" onclick="navigate('/jobs');return false" style="color:#6b7280;text-decoration:none">구인게시판</a>
      <i class="fas fa-chevron-right" style="font-size:0.7rem"></i>
      <span style="color:#1f2937">${escapeHtml(j.title)}</span>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 300px;gap:1.5rem" class="detail-grid">
      <div>
        <div style="background:white;border-radius:16px;padding:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,0.07);margin-bottom:1.5rem">
          <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap">${badges.join('')}</div>
          <h1 style="font-size:1.4rem;font-weight:900;margin-bottom:0.5rem;line-height:1.3">${escapeHtml(j.title)}</h1>
          <div style="font-size:1rem;color:#1e40af;font-weight:700;margin-bottom:0.75rem">
            <i class="fas fa-building"></i> ${escapeHtml(j.site_name)}
          </div>
          
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0.75rem;background:#f8fafc;border-radius:10px;padding:1rem;margin-bottom:1rem">
            <div>
              <div style="font-size:0.75rem;color:#9ca3af;margin-bottom:0.2rem">지역</div>
              <div style="font-weight:700">${escapeHtml(j.region)}</div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:#9ca3af;margin-bottom:0.2rem">모집직급</div>
              <div style="font-weight:700">${getRankLabel(j.rank_type)}</div>
            </div>
            ${j.commission_rate ? `<div>
              <div style="font-size:0.75rem;color:#9ca3af;margin-bottom:0.2rem">수수료</div>
              <div style="font-weight:700;color:#92400e">${j.commission_rate}%</div>
            </div>` : ''}
            ${j.daily_pay > 0 ? `<div>
              <div style="font-size:0.75rem;color:#9ca3af;margin-bottom:0.2rem">일비</div>
              <div style="font-weight:700;color:#166534">${j.daily_pay.toLocaleString()}원</div>
            </div>` : ''}
            ${j.accommodation_pay > 0 ? `<div>
              <div style="font-size:0.75rem;color:#9ca3af;margin-bottom:0.2rem">숙소비</div>
              <div style="font-weight:700;color:#6b21a8">${j.accommodation_pay.toLocaleString()}원/월</div>
            </div>` : ''}
            <div>
              <div style="font-size:0.75rem;color:#9ca3af;margin-bottom:0.2rem">경력요건</div>
              <div style="font-weight:600;font-size:0.9rem">${escapeHtml(j.experience_required||'무관')}</div>
            </div>
          </div>
          
          ${j.commission_note ? `
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:0.75rem;margin-bottom:1rem">
            <div style="font-size:0.8rem;font-weight:700;color:#92400e;margin-bottom:0.25rem">💰 수수료 조건 상세</div>
            <div style="font-size:0.88rem;color:#78350f">${nl2br(j.commission_note)}</div>
          </div>` : ''}
          
          ${j.description ? `
          <div style="margin-bottom:1rem">
            <h3 style="font-size:1rem;font-weight:700;margin-bottom:0.75rem;color:#1f2937">📋 상세 모집 내용</h3>
            <div style="font-size:0.9rem;line-height:1.8;color:#374151">${nl2br(j.description)}</div>
          </div>` : ''}
          
          <div style="font-size:0.8rem;color:#9ca3af;padding-top:0.75rem;border-top:1px solid #f3f4f6">
            조회 ${(j.view_count||0).toLocaleString()} | 등록 ${timeAgo(j.created_at)}
            ${j.expires_at ? ` | 마감 ${formatDate(j.expires_at)}` : ''}
          </div>
        </div>
        
        <!-- 관련 공고 -->
        ${related.length ? `
        <div>
          <div class="section-header">
            <h3 class="section-title">같은 지역 구인 공고</h3>
          </div>
          ${related.map(rj => `
          <div class="job-card" onclick="navigate('/jobs/${rj.id}')" style="margin-bottom:0.5rem">
            <div class="job-title">${escapeHtml(rj.title)}</div>
            <div style="font-size:0.8rem;color:#6b7280;margin-top:0.3rem">
              ${escapeHtml(rj.region)} | ${getRankLabel(rj.rank_type)}
              ${rj.commission_rate ? ` | 수수료 ${rj.commission_rate}%` : ''}
            </div>
          </div>`).join('')}
        </div>` : ''}
      </div>
      
      <!-- 연락처 사이드바 -->
      <div>
        <div style="background:white;border-radius:12px;padding:1.25rem;box-shadow:0 4px 20px rgba(0,0,0,0.1);border:2px solid #bfdbfe;position:sticky;top:80px">
          <div style="font-size:1rem;font-weight:800;color:#1e40af;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
            <i class="fas fa-phone-alt"></i> 지원 문의
          </div>
          <div style="background:#eff6ff;border-radius:8px;padding:1rem;margin-bottom:1rem">
            <div style="font-size:0.8rem;color:#6b7280;margin-bottom:0.25rem">담당자</div>
            <div style="font-weight:800;font-size:1.05rem;margin-bottom:0.25rem">${escapeHtml(j.contact_name)}</div>
            <div style="color:#1e40af;font-weight:600;font-size:1rem">
              <i class="fas fa-phone"></i> ${escapeHtml(j.contact_phone)}
            </div>
            ${j.contact_kakao ? `<div style="color:#FEE500;font-weight:600;font-size:0.9rem;background:#1c1c1c;padding:0.35rem 0.75rem;border-radius:6px;display:inline-block;margin-top:0.5rem">
              💬 카카오 ID: ${escapeHtml(j.contact_kakao)}
            </div>` : ''}
          </div>
          
          <form onsubmit="submitJobInquiry(event, ${j.id})">
            <div class="form-group">
              <input class="form-input" name="name" placeholder="이름 *" required value="${state.user ? escapeHtml(state.user.name) : ''}">
            </div>
            <div class="form-group">
              <input class="form-input" name="phone" placeholder="연락처 *" required value="${state.user ? escapeHtml(state.user.phone||'') : ''}">
            </div>
            <div class="form-group">
              <textarea class="form-textarea" name="message" placeholder="지원 내용 (경력, 희망 조건 등)" style="min-height:80px"></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%">
              <i class="fas fa-paper-plane"></i> 지원 문의
            </button>
          </form>
          <div id="job-inquiry-result" style="margin-top:0.5rem"></div>
        </div>
      </div>
    </div>
  </div>
  <style>@media(max-width:900px){.detail-grid{grid-template-columns:1fr!important}}</style>`;
}

window.submitJobInquiry = async function(e, jobId) {
  e.preventDefault();
  const form = e.target;
  const r = await api.post('/inquiries', {
    job_post_id: jobId, inquiry_type: 'job',
    name: form.name.value, phone: form.phone.value,
    email: '', message: form.message.value || '지원 문의드립니다.',
  });
  const res = document.getElementById('job-inquiry-result');
  if (r.ok) {
    res.innerHTML = `<div class="alert alert-success"><i class="fas fa-check"></i> 지원 문의가 접수되었습니다!</div>`;
    form.reset();
  } else {
    res.innerHTML = `<div class="alert alert-error">${r.data.error || '문의 접수 실패'}</div>`;
  }
};

// ============================================================
// JOB FORM PAGE
// ============================================================
async function renderJobFormPage(container) {
  if (!state.user) { navigate('/login'); return; }
  
  container.innerHTML = `
  <div class="container" style="padding:2rem 1rem;max-width:760px">
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
      <button onclick="history.back()" class="btn btn-secondary btn-sm"><i class="fas fa-arrow-left"></i></button>
      <h1 style="font-size:1.25rem;font-weight:800">구인 공고 등록</h1>
    </div>
    <div style="background:white;border-radius:16px;padding:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,0.07)">
      <form onsubmit="submitJobPost(event)">
        <div class="form-group">
          <label class="form-label">공고 제목 *</label>
          <input class="form-input" name="title" required placeholder="예) [급구] 판교 프리미엄 아파트 팀장/팀원 모집">
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">현장명 *</label>
            <input class="form-input" name="site_name" required placeholder="예) 힐스테이트 판교역 퍼스트">
          </div>
          <div class="form-group">
            <label class="form-label">지역 *</label>
            <select class="form-select" name="region" required>
              <option value="">선택</option>
              ${['서울','경기','인천','부산','충청','전라','경상','강원','제주'].map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">현장 유형</label>
            <select class="form-select" name="property_type">
              <option value="">선택</option>
              <option value="apartment">아파트</option>
              <option value="officetel">오피스텔</option>
              <option value="commercial">상가</option>
              <option value="villa">빌라/연립</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">모집 직급 *</label>
            <select class="form-select" name="rank_type" required>
              <option value="any">팀장/팀원 (무관)</option>
              <option value="team_leader">팀장</option>
              <option value="team_member">팀원</option>
            </select>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">수수료율 (%)</label>
            <input class="form-input" name="commission_rate" type="number" step="0.1" placeholder="예) 1.5">
          </div>
          <div class="form-group">
            <label class="form-label">일비 (원)</label>
            <input class="form-input" name="daily_pay" type="number" placeholder="예) 50000">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">수수료 조건 상세</label>
          <input class="form-input" name="commission_note" placeholder="예) 계약건당 분양가 1.5% 지급, 팀원 1.0%">
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">숙소비 지원 (원/월)</label>
            <input class="form-input" name="accommodation_pay" type="number" placeholder="예) 300000">
          </div>
          <div class="form-group">
            <label class="form-label">경력 요건</label>
            <input class="form-input" name="experience_required" placeholder="예) 아파트 분양 경력 1년 이상">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">상세 내용</label>
          <textarea class="form-textarea" name="description" style="min-height:150px" placeholder="모집 상세 내용, 근무 조건, 특이사항 등을 입력해주세요."></textarea>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">담당자 이름 *</label>
            <input class="form-input" name="contact_name" required value="${state.user ? escapeHtml(state.user.name) : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">담당자 연락처 *</label>
            <input class="form-input" name="contact_phone" required value="${state.user ? escapeHtml(state.user.phone||'') : ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">카카오 ID (선택)</label>
          <input class="form-input" name="contact_kakao" placeholder="카카오톡 아이디">
        </div>
        <div class="form-group">
          <label class="form-label">공고 마감일</label>
          <input class="form-input" name="expires_at" type="date">
        </div>
        <div id="job-form-error"></div>
        <div style="display:flex;gap:0.75rem;margin-top:1rem">
          <button type="submit" class="btn btn-primary btn-lg"><i class="fas fa-save"></i> 공고 등록</button>
          <button type="button" class="btn btn-secondary btn-lg" onclick="history.back()">취소</button>
        </div>
      </form>
    </div>
  </div>`;
}

window.submitJobPost = async function(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  ['commission_rate','daily_pay','accommodation_pay'].forEach(k => {
    if (data[k]) data[k] = parseFloat(data[k]);
    else delete data[k];
  });
  
  const r = await api.post('/jobs', data);
  const errEl = document.getElementById('job-form-error');
  
  if (r.ok) {
    navigate('/jobs/' + r.data.id);
  } else {
    errEl.innerHTML = `<div class="alert alert-error">${r.data.error || '등록에 실패했습니다.'}</div>`;
  }
};

// ============================================================
// NEWS PAGE
// ============================================================
async function renderNewsPage(container) {
  const params = new URLSearchParams(location.search);
  const type = params.get('type') || 'all';
  const page = parseInt(params.get('page') || '1');
  
  container.innerHTML = `
  <div style="background:white;border-bottom:1px solid #e5e7eb;padding:1rem 0">
    <div class="container">
      <h1 style="font-size:1.2rem;font-weight:800;margin-bottom:0.75rem">
        <span style="font-size:1.25rem">📰</span> 뉴스 & 공지사항
      </h1>
      <div class="tab-list">
        ${[['all','전체'],['notice','공지사항'],['news','뉴스'],['event','이벤트']].map(([v,l]) =>
          `<div class="tab-item ${type===v?'active':''}" onclick="navigate('/news?type=${v}')">${l}</div>`
        ).join('')}
      </div>
    </div>
  </div>
  <div class="container" style="padding-top:1.5rem;padding-bottom:2rem;max-width:800px">
    <div id="news-list"><div class="loading-overlay"><div class="spinner"></div></div></div>
  </div>`;
  
  const qp = new URLSearchParams();
  if (type !== 'all') qp.set('type', type);
  qp.set('page', page);
  qp.set('limit', '15');
  
  const r = await api.get('/news?' + qp.toString());
  const list = document.getElementById('news-list');
  if (!list || !r.ok) return;
  
  const { data, total, pages } = r.data;
  
  list.innerHTML = `
    <div style="background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden">
      ${data.length ? data.map((n, i) => `
      <div style="display:flex;align-items:center;padding:0.9rem 1.25rem;${i>0?'border-top:1px solid #f3f4f6':''};cursor:pointer;transition:background 0.15s"
        onclick="navigate('/news/${n.id}')"
        onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
        ${n.is_pinned ? '<i class="fas fa-thumbtack" style="color:#f59e0b;margin-right:0.5rem;font-size:0.8rem"></i>' : '<span style="width:1.1rem;display:inline-block"></span>'}
        <span class="news-type-badge news-type-${n.news_type}" style="margin-right:0.75rem;flex-shrink:0">
          ${n.news_type==='notice'?'공지':n.news_type==='event'?'이벤트':'뉴스'}
        </span>
        <span style="flex:1;font-size:0.92rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;${n.is_pinned?'font-weight:600':''}">${escapeHtml(n.title)}</span>
        <div style="display:flex;gap:1rem;font-size:0.78rem;color:#9ca3af;flex-shrink:0;margin-left:1rem">
          <span><i class="fas fa-eye"></i> ${(n.view_count||0).toLocaleString()}</span>
          <span>${formatDate(n.created_at)}</span>
        </div>
      </div>`) .join('')
      : '<div style="text-align:center;padding:3rem;color:#9ca3af">등록된 게시글이 없습니다.</div>'}
    </div>
    ${renderPagination(page, pages, (p) => navigate('/news?type='+type+'&page='+p))}`;
}

// News Detail
async function renderNewsDetailPage(container, params) {
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
  
  const r = await api.get(`/news/${params.id}`);
  if (!r.ok) return;
  
  const { item: n, prev, next } = r.data;
  
  container.innerHTML = `
  <div class="container" style="padding-top:1.5rem;padding-bottom:3rem;max-width:800px">
    <div style="font-size:0.85rem;color:#6b7280;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
      <a href="/news" onclick="navigate('/news');return false" style="color:#6b7280;text-decoration:none">뉴스/공지</a>
      <i class="fas fa-chevron-right" style="font-size:0.7rem"></i>
      <span>${n.news_type==='notice'?'공지사항':n.news_type==='event'?'이벤트':'뉴스'}</span>
    </div>
    <div style="background:white;border-radius:16px;padding:2rem;box-shadow:0 2px 12px rgba(0,0,0,0.07)">
      <div style="margin-bottom:1rem">
        <span class="news-type-badge news-type-${n.news_type}" style="margin-bottom:0.75rem;display:inline-block">
          ${n.news_type==='notice'?'공지사항':n.news_type==='event'?'이벤트':'뉴스'}
        </span>
        <h1 style="font-size:1.35rem;font-weight:800;line-height:1.4;margin-bottom:0.5rem">${escapeHtml(n.title)}</h1>
        <div style="display:flex;gap:1rem;font-size:0.82rem;color:#9ca3af">
          <span>${escapeHtml(n.author_name || '관리자')}</span>
          <span>${formatDate(n.created_at)}</span>
          <span>조회 ${(n.view_count||0).toLocaleString()}</span>
        </div>
      </div>
      <div style="border-top:1px solid #f3f4f6;padding-top:1.5rem;font-size:0.95rem;line-height:1.9;color:#374151">
        ${nl2br(n.content)}
      </div>
    </div>
    
    <!-- 이전/다음 -->
    <div style="background:white;border-radius:12px;margin-top:1rem;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
      ${prev ? `<div style="display:flex;align-items:center;padding:0.75rem 1.25rem;border-bottom:1px solid #f3f4f6;cursor:pointer" onclick="navigate('/news/${prev.id}')">
        <span style="font-size:0.78rem;color:#9ca3af;width:50px">◀ 이전글</span>
        <span style="font-size:0.9rem;flex:1">${escapeHtml(prev.title)}</span>
      </div>` : ''}
      ${next ? `<div style="display:flex;align-items:center;padding:0.75rem 1.25rem;cursor:pointer" onclick="navigate('/news/${next.id}')">
        <span style="font-size:0.78rem;color:#9ca3af;width:50px">▶ 다음글</span>
        <span style="font-size:0.9rem;flex:1">${escapeHtml(next.title)}</span>
      </div>` : ''}
    </div>
    <div style="margin-top:1rem">
      <button class="btn btn-secondary" onclick="navigate('/news')"><i class="fas fa-list"></i> 목록으로</button>
    </div>
  </div>`;
}

// ============================================================
// PAGINATION HELPER
// ============================================================
function renderPagination(currentPage, totalPages, onClickFn) {
  if (totalPages <= 1) return '';
  
  window._paginationHandler = onClickFn;
  
  let html = '<div class="pagination">';
  html += `<button class="page-btn" onclick="_paginationHandler(${currentPage-1})" ${currentPage<=1?'disabled':''}>
    <i class="fas fa-chevron-left"></i></button>`;
  
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  
  if (start > 1) html += `<button class="page-btn" onclick="_paginationHandler(1)">1</button>`;
  if (start > 2) html += `<span style="padding:0 0.25rem;color:#9ca3af">...</span>`;
  
  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i===currentPage?'active':''}" onclick="_paginationHandler(${i})">${i}</button>`;
  }
  
  if (end < totalPages - 1) html += `<span style="padding:0 0.25rem;color:#9ca3af">...</span>`;
  if (end < totalPages) html += `<button class="page-btn" onclick="_paginationHandler(${totalPages})">${totalPages}</button>`;
  
  html += `<button class="page-btn" onclick="_paginationHandler(${currentPage+1})" ${currentPage>=totalPages?'disabled':''}>
    <i class="fas fa-chevron-right"></i></button>`;
  html += '</div>';
  
  return html;
}
