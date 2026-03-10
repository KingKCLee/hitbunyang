// 분양라인 - Part 3: 분양현장 목록/상세 페이지

// ============================================================
// PROPERTIES LIST PAGE
// ============================================================
async function renderPropertiesPage(container) {
  const params = new URLSearchParams(location.search);
  const region = params.get('region') || 'all';
  const type = params.get('type') || 'all';
  const sort = params.get('sort') || 'latest';
  const search = params.get('search') || '';
  const page = parseInt(params.get('page') || '1');
  
  container.innerHTML = `
  <div style="background:white;border-bottom:1px solid #e5e7eb;padding:1rem 0">
    <div class="container">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
        <span style="font-size:1.25rem">🏢</span>
        <h1 style="font-size:1.2rem;font-weight:800">분양 현장 목록</h1>
      </div>
      <div class="filter-bar">
        <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center">
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
            <span style="font-size:0.8rem;color:#6b7280;align-self:center">지역</span>
            ${['all','서울','경기','인천','부산','충청','전라','경상','강원','제주'].map(r =>
              `<button class="filter-btn ${region===r?'active':''}" onclick="updatePropertyFilter('region','${r}')">${r==='all'?'전체':r}</button>`
            ).join('')}
          </div>
          <div style="height:1px;background:#e5e7eb;width:100%"></div>
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
            <span style="font-size:0.8rem;color:#6b7280;align-self:center">유형</span>
            ${[['all','전체'],['apartment','아파트'],['officetel','오피스텔'],['commercial','상가'],['villa','빌라'],['land','토지']].map(([v,l]) =>
              `<button class="filter-btn ${type===v?'active':''}" onclick="updatePropertyFilter('type','${v}')">${l}</button>`
            ).join('')}
          </div>
          <div style="display:flex;gap:0.5rem;margin-left:auto;align-items:center;flex-wrap:wrap">
            <div style="position:relative">
              <i class="fas fa-search" style="position:absolute;left:0.7rem;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:0.8rem"></i>
              <input type="text" id="prop-search" value="${escapeHtml(search)}" placeholder="현장명/지역 검색"
                style="padding:0.45rem 0.75rem 0.45rem 2rem;border:1.5px solid #e5e7eb;border-radius:8px;font-size:0.85rem;outline:none;width:180px"
                onkeydown="if(event.key==='Enter')updatePropertyFilter('search',this.value)">
            </div>
            <select class="filter-select" onchange="updatePropertyFilter('sort',this.value)">
              <option value="latest" ${sort==='latest'?'selected':''}>최신순</option>
              <option value="hot" ${sort==='hot'?'selected':''}>인기순</option>
              <option value="views" ${sort==='views'?'selected':''}>조회수순</option>
              <option value="price_asc" ${sort==='price_asc'?'selected':''}>가격낮은순</option>
              <option value="price_desc" ${sort==='price_desc'?'selected':''}>가격높은순</option>
            </select>
            <button class="btn btn-primary btn-sm" onclick="navigate('/properties/new')">
              <i class="fas fa-plus"></i> 현장 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="container" style="padding-top:1.5rem;padding-bottom:2rem">
    <div id="properties-grid"><div class="loading-overlay"><div class="spinner"></div></div></div>
  </div>`;
  
  await loadProperties(region, type, sort, search, page);
}

window.updatePropertyFilter = function(key, value) {
  const params = new URLSearchParams(location.search);
  params.set(key, value);
  if (key !== 'page') params.set('page', '1');
  navigate('/properties?' + params.toString());
};

async function loadProperties(region, type, sort, search, page) {
  const params = new URLSearchParams();
  if (region !== 'all') params.set('region', region);
  if (type !== 'all') params.set('type', type);
  if (sort) params.set('sort', sort);
  if (search) params.set('search', search);
  params.set('page', page);
  params.set('limit', '12');
  
  const r = await api.get('/properties?' + params.toString());
  const grid = document.getElementById('properties-grid');
  if (!grid) return;
  
  if (!r.ok) { grid.innerHTML = `<div class="alert alert-error">데이터를 불러오는데 실패했습니다.</div>`; return; }
  
  const { data, total, pages } = r.data;
  
  if (!data.length) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">🏢</div>
      <div class="empty-state-text">검색 결과가 없습니다.</div>
    </div>`;
    return;
  }
  
  grid.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <span style="font-size:0.9rem;color:#6b7280">총 <strong style="color:#1f2937">${total.toLocaleString()}</strong>개의 현장</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem">
      ${data.map(p => renderPropertyCard(p)).join('')}
    </div>
    ${renderPagination(page, pages, (p) => updatePropertyFilter('page', p))}`;
}

// ============================================================
// PROPERTY DETAIL PAGE
// ============================================================
async function renderPropertyDetailPage(container, params) {
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
  
  const r = await api.get(`/properties/${params.id}`);
  if (!r.ok) { container.innerHTML = `<div class="container" style="padding:3rem 1rem"><div class="alert alert-error">현장 정보를 불러오는데 실패했습니다.</div></div>`; return; }
  
  const { property: p, related } = r.data;
  
  const badges = [];
  if (p.ad_type === 'premium') badges.push('<span class="badge badge-premium-ad">★ 프리미엄</span>');
  if (p.is_hot) badges.push('<span class="badge badge-hot">HOT</span>');
  if (p.is_new) badges.push('<span class="badge badge-new">NEW</span>');
  if (p.status === 'upcoming') badges.push('<span class="badge badge-upcoming">분양예정</span>');
  if (p.status === 'completed') badges.push('<span class="badge" style="background:#e5e7eb;color:#374151">분양완료</span>');
  
  const amenitiesList = (() => { try { return JSON.parse(p.amenities || '[]'); } catch { return []; } })();
  
  container.innerHTML = `
  <div class="container" style="padding-top:1.5rem;padding-bottom:3rem">
    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;font-size:0.85rem;color:#6b7280">
      <a href="/" onclick="navigate('/');return false" style="color:#6b7280;text-decoration:none">홈</a>
      <i class="fas fa-chevron-right" style="font-size:0.7rem"></i>
      <a href="/properties" onclick="navigate('/properties');return false" style="color:#6b7280;text-decoration:none">분양현장</a>
      <i class="fas fa-chevron-right" style="font-size:0.7rem"></i>
      <span style="color:#1f2937">${escapeHtml(p.title)}</span>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 340px;gap:1.5rem" class="detail-grid">
      <div>
        <!-- 메인 이미지 영역 -->
        <div style="background:${getPropertyBgImage(p.property_type)};border-radius:16px;height:280px;display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;position:relative">
          <i class="fas fa-building" style="font-size:5rem;color:rgba(255,255,255,0.6)"></i>
          <div style="position:absolute;top:1rem;left:1rem;display:flex;gap:0.4rem;flex-wrap:wrap">
            ${badges.join('')}
          </div>
        </div>
        
        <!-- 기본 정보 -->
        <div class="detail-header">
          <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap">
            <span class="badge" style="background:${getRegionColor(p.region)}22;color:${getRegionColor(p.region)}">
              ${escapeHtml(p.region)}
            </span>
            <span class="badge badge-gray">${getPropertyTypeLabel(p.property_type)}</span>
          </div>
          <h1 style="font-size:1.4rem;font-weight:900;margin-bottom:0.35rem;line-height:1.3">${escapeHtml(p.title)}</h1>
          ${p.subtitle ? `<p style="color:#6b7280;font-size:0.95rem;margin-bottom:0.75rem">${escapeHtml(p.subtitle)}</p>` : ''}
          <div style="font-size:0.9rem;color:#6b7280;margin-bottom:1rem">
            <i class="fas fa-map-marker-alt" style="color:#3b82f6"></i> ${escapeHtml(p.address)}
          </div>
          <div class="detail-price">${formatPriceRange(p.price_min, p.price_max)}</div>
          
          <div class="detail-info-grid">
            <div class="detail-info-item">
              <div class="detail-info-label">공급면적</div>
              <div class="detail-info-value">${p.supply_area_min ? `${p.supply_area_min}~${p.supply_area_max||p.supply_area_min}㎡` : '-'}</div>
            </div>
            <div class="detail-info-item">
              <div class="detail-info-label">총 세대수</div>
              <div class="detail-info-value">${p.total_units ? p.total_units.toLocaleString()+'세대' : '-'}</div>
            </div>
            <div class="detail-info-item">
              <div class="detail-info-label">지상 층수</div>
              <div class="detail-info-value">${p.floors ? p.floors+'층' : '-'}</div>
            </div>
            <div class="detail-info-item">
              <div class="detail-info-label">입주 예정</div>
              <div class="detail-info-value">${p.completion_date || '-'}</div>
            </div>
            <div class="detail-info-item">
              <div class="detail-info-label">분양 시작</div>
              <div class="detail-info-value">${formatDate(p.sale_start_date)}</div>
            </div>
            <div class="detail-info-item">
              <div class="detail-info-label">분양 마감</div>
              <div class="detail-info-value">${formatDate(p.sale_end_date)}</div>
            </div>
          </div>
          
          <div style="display:flex;gap:0.75rem;color:#6b7280;font-size:0.82rem;margin-top:0.75rem">
            <span><i class="fas fa-eye"></i> 조회 ${(p.view_count||0).toLocaleString()}</span>
            <span><i class="fas fa-comment"></i> 문의 ${(p.inquiry_count||0).toLocaleString()}</span>
            <span><i class="fas fa-clock"></i> ${timeAgo(p.created_at)}</span>
          </div>
        </div>
        
        <!-- 상세 설명 -->
        ${p.description ? `
        <div style="background:white;border-radius:12px;padding:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,0.07);margin-bottom:1.5rem">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem;color:#1f2937">📋 현장 소개</h3>
          <div style="font-size:0.9rem;color:#374151;line-height:1.8">${nl2br(p.description)}</div>
        </div>` : ''}
        
        <!-- 편의시설 -->
        ${amenitiesList.length ? `
        <div style="background:white;border-radius:12px;padding:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,0.07);margin-bottom:1.5rem">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">🏋️ 편의시설</h3>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
            ${amenitiesList.map(a => `<span style="background:#eff6ff;color:#1d4ed8;padding:0.25rem 0.75rem;border-radius:20px;font-size:0.82rem;border:1px solid #bfdbfe">${escapeHtml(a)}</span>`).join('')}
          </div>
        </div>` : ''}
        
        <!-- 관련 현장 -->
        ${related.length ? `
        <div>
          <div class="section-header">
            <h3 class="section-title">같은 지역 분양현장</h3>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem">
            ${related.map(rp => renderPropertyCard(rp)).join('')}
          </div>
        </div>` : ''}
      </div>
      
      <!-- 우측 사이드바 -->
      <div>
        <!-- 문의 폼 -->
        <div class="inquiry-box" style="margin-bottom:1rem">
          <div class="inquiry-title">
            <i class="fas fa-phone-alt"></i> 분양 문의하기
          </div>
          ${p.contact_name ? `
          <div style="background:white;border-radius:8px;padding:0.75rem;margin-bottom:1rem">
            <div style="font-size:0.8rem;color:#6b7280;margin-bottom:0.25rem">담당자</div>
            <div style="font-weight:700">${escapeHtml(p.contact_name)}</div>
            ${p.contact_phone ? `<div style="color:#1e40af;font-size:0.9rem"><i class="fas fa-phone"></i> ${escapeHtml(p.contact_phone)}</div>` : ''}
          </div>` : ''}
          <form onsubmit="submitInquiry(event, ${p.id}, 'property')">
            <div class="form-group">
              <input class="form-input" name="name" placeholder="이름 *" required 
                value="${state.user ? escapeHtml(state.user.name) : ''}">
            </div>
            <div class="form-group">
              <input class="form-input" name="phone" placeholder="연락처 * (010-0000-0000)" required
                value="${state.user ? escapeHtml(state.user.phone||'') : ''}">
            </div>
            <div class="form-group">
              <input class="form-input" name="email" placeholder="이메일 (선택)">
            </div>
            <div class="form-group">
              <textarea class="form-textarea" name="message" placeholder="문의 내용을 입력해주세요..." required style="min-height:100px"></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%">
              <i class="fas fa-paper-plane"></i> 문의 접수하기
            </button>
          </form>
          <div id="inquiry-result" style="margin-top:0.75rem"></div>
          <p style="font-size:0.75rem;color:#6b7280;margin-top:0.5rem;text-align:center">
            입력하신 정보는 문의 처리 목적으로만 사용됩니다.
          </p>
        </div>
        
        <!-- 공유 버튼 -->
        <div style="background:white;border-radius:12px;padding:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid #e5e7eb">
          <div style="font-size:0.9rem;font-weight:700;margin-bottom:0.75rem">공유하기</div>
          <div style="display:flex;gap:0.5rem">
            <button onclick="copyLink()" class="btn btn-secondary btn-sm" style="flex:1">
              <i class="fas fa-link"></i> 링크 복사
            </button>
            <button onclick="printPage()" class="btn btn-secondary btn-sm" style="flex:1">
              <i class="fas fa-print"></i> 인쇄
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <style>
    @media(max-width:900px){.detail-grid{grid-template-columns:1fr!important}}
  </style>`;
}

window.submitInquiry = async function(e, propertyId, type) {
  e.preventDefault();
  const form = e.target;
  const result = document.getElementById('inquiry-result');
  
  const data = {
    property_id: propertyId,
    inquiry_type: type,
    name: form.name.value,
    phone: form.phone.value,
    email: form.email.value,
    message: form.message.value,
  };
  
  const r = await api.post('/inquiries', data);
  if (r.ok) {
    result.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle"></i> 문의가 접수되었습니다. 담당자가 연락드릴 예정입니다.</div>`;
    form.reset();
  } else {
    result.innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${r.data.error || '문의 접수에 실패했습니다.'}</div>`;
  }
};

window.copyLink = function() {
  navigator.clipboard.writeText(location.href).then(() => {
    alert('링크가 복사되었습니다!');
  });
};

window.printPage = function() { window.print(); };

// ============================================================
// PROPERTY FORM PAGE (등록/수정)
// ============================================================
async function renderPropertyFormPage(container) {
  if (!state.user) { navigate('/login'); return; }
  
  container.innerHTML = `
  <div class="container" style="padding:2rem 1rem;max-width:760px">
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
      <button onclick="history.back()" class="btn btn-secondary btn-sm">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1 style="font-size:1.25rem;font-weight:800">분양 현장 등록</h1>
    </div>
    <div style="background:white;border-radius:16px;padding:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,0.07)">
      <form onsubmit="submitProperty(event)">
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">현장명 *</label>
            <input class="form-input" name="title" required placeholder="예) 힐스테이트 판교역 1차">
          </div>
          <div class="form-group">
            <label class="form-label">부제목</label>
            <input class="form-input" name="subtitle" placeholder="예) 판교역 초역세권 프리미엄">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">유형 *</label>
            <select class="form-select" name="property_type" required>
              <option value="">선택</option>
              <option value="apartment">아파트</option>
              <option value="officetel">오피스텔</option>
              <option value="commercial">상가</option>
              <option value="villa">빌라/연립</option>
              <option value="land">토지</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">지역 *</label>
            <select class="form-select" name="region" required>
              <option value="">선택</option>
              ${['서울','경기','인천','부산','충청','전라','경상','강원','제주'].map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">주소 *</label>
          <input class="form-input" name="address" required placeholder="예) 경기도 성남시 분당구 판교역로 166">
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">최저 분양가 (원)</label>
            <input class="form-input" name="price_min" type="number" placeholder="예) 450000000">
          </div>
          <div class="form-group">
            <label class="form-label">최고 분양가 (원)</label>
            <input class="form-input" name="price_max" type="number" placeholder="예) 850000000">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">공급면적 최소 (㎡)</label>
            <input class="form-input" name="supply_area_min" type="number" step="0.01" placeholder="예) 59.0">
          </div>
          <div class="form-group">
            <label class="form-label">공급면적 최대 (㎡)</label>
            <input class="form-input" name="supply_area_max" type="number" step="0.01" placeholder="예) 101.0">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">총 세대수</label>
            <input class="form-input" name="total_units" type="number" placeholder="예) 320">
          </div>
          <div class="form-group">
            <label class="form-label">지상 층수</label>
            <input class="form-input" name="floors" type="number" placeholder="예) 35">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">분양 시작일</label>
            <input class="form-input" name="sale_start_date" type="date">
          </div>
          <div class="form-group">
            <label class="form-label">분양 마감일</label>
            <input class="form-input" name="sale_end_date" type="date">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">입주 예정</label>
          <input class="form-input" name="completion_date" placeholder="예) 2026-12">
        </div>
        <div class="form-group">
          <label class="form-label">현장 소개</label>
          <textarea class="form-textarea" name="description" style="min-height:150px" placeholder="현장 상세 소개, 입지 조건, 특징 등을 입력해주세요."></textarea>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">담당자 이름</label>
            <input class="form-input" name="contact_name" placeholder="예) 분양팀장">
          </div>
          <div class="form-group">
            <label class="form-label">담당자 연락처</label>
            <input class="form-input" name="contact_phone" placeholder="예) 031-111-2222">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-select" name="status">
            <option value="active">분양중</option>
            <option value="upcoming">분양예정</option>
            <option value="completed">분양완료</option>
          </select>
        </div>
        <div id="form-error"></div>
        <div style="display:flex;gap:0.75rem;margin-top:1rem">
          <button type="submit" class="btn btn-primary btn-lg">
            <i class="fas fa-save"></i> 현장 등록
          </button>
          <button type="button" class="btn btn-secondary btn-lg" onclick="history.back()">취소</button>
        </div>
      </form>
    </div>
  </div>`;
}

window.submitProperty = async function(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  // Convert numbers
  ['price_min','price_max','supply_area_min','supply_area_max','total_units','floors'].forEach(k => {
    if (data[k]) data[k] = parseFloat(data[k]);
    else delete data[k];
  });
  
  const r = await api.post('/properties', data);
  const errEl = document.getElementById('form-error');
  
  if (r.ok) {
    navigate('/properties/' + r.data.id);
  } else {
    errEl.innerHTML = `<div class="alert alert-error">${r.data.error || '등록에 실패했습니다.'}</div>`;
  }
};
