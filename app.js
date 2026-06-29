// ===== Data Store =====
const DB = {
  get items() { return JSON.parse(localStorage.getItem('pm_items') || '[]'); },
  set items(v) {
    try {
      localStorage.setItem('pm_items', JSON.stringify(v));
    } catch(e) {
      alert('保存容量が不足しています。古い商品の画像を削除するか、画像なしで登録してください。');
    }
  },
  get categories() {
    const saved = localStorage.getItem('pm_categories');
    return saved ? JSON.parse(saved) : ['家雑貨', '美容', '仕事関連', 'ファッション', '食品'];
  },
  set categories(v) { localStorage.setItem('pm_categories', JSON.stringify(v)); },
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatPrice(n) {
  if (!n && n !== 0) return '';
  return '¥' + Number(n).toLocaleString('ja-JP');
}

function formatDate(d) {
  if (!d) return '';
  return d.replace(/-/g, '.');
}

// ===== State =====
const state = {
  activeTab: 'consideration',
  filters: {
    consideration: { category: null, startDate: null, endDate: null },
    purchased:     { category: null, startDate: null, endDate: null },
  },
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  periodTarget: null,
  openDetail: null,
};

// ===== Tab =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('tab-' + tab).classList.add('active');
    state.activeTab = tab;
    if (tab === 'calendar') renderCalendar();
  });
});

// ===== Filter Chips =====
function renderChips(tabKey) {
  const container = document.getElementById(tabKey + 'Chips');
  const cats = DB.categories;
  const active = state.filters[tabKey].category;
  container.innerHTML = '';

  const all = document.createElement('button');
  all.className = 'chip' + (!active ? ' active' : '');
  all.textContent = 'すべて';
  all.addEventListener('click', () => { state.filters[tabKey].category = null; refresh(tabKey); });
  container.appendChild(all);

  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'chip' + (active === cat ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => { state.filters[tabKey].category = cat; refresh(tabKey); });
    container.appendChild(btn);
  });
}

// ===== Sort & Filter items =====
function getFilteredItems(tabKey) {
  const type = tabKey === 'consideration' ? 'consideration' : 'purchased';
  const f = state.filters[tabKey];
  const sortVal = document.getElementById(tabKey + 'Sort').value;
  let items = DB.items.filter(i => i.type === type);

  if (f.category) items = items.filter(i => i.category === f.category);
  if (f.startDate) items = items.filter(i => (i.date || '') >= f.startDate);
  if (f.endDate)   items = items.filter(i => (i.date || '') <= f.endDate);

  items.sort((a, b) => {
    if (sortVal === 'date-desc') return (b.date || '').localeCompare(a.date || '');
    if (sortVal === 'date-asc')  return (a.date || '').localeCompare(b.date || '');
    if (sortVal === 'priority-desc') return (b.priority || 0) - (a.priority || 0);
    if (sortVal === 'priority-asc')  return (a.priority || 0) - (b.priority || 0);
    if (sortVal === 'freq-desc') return (b.frequency || 0) - (a.frequency || 0);
    if (sortVal === 'freq-asc')  return (a.frequency || 0) - (b.frequency || 0);
    return 0;
  });
  return items;
}

// ===== Render Grid =====
function renderGrid(tabKey) {
  const grid = document.getElementById(tabKey + 'Grid');
  const items = getFilteredItems(tabKey);
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = '<div class="empty-state">まだアイテムがありません</div>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    const imgHtml = item.image
      ? `<img class="card-img" src="${item.image}" alt="">`
      : `<div class="card-img-placeholder">📦</div>`;
    card.innerHTML = `
      <div class="card-img-wrapper">
        ${imgHtml}
        ${item.category ? `<span class="card-category-badge">${item.category}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-seller">${item.seller || '　'}</div>
        <div class="card-name">${item.name || '　'}</div>
        <div class="card-price">${formatPrice(item.price)}</div>
        <div class="card-date">${formatDate(item.date)}</div>
      </div>`;
    card.addEventListener('click', () => openDetail(item.id));
    grid.appendChild(card);
  });
}

function refresh(tabKey) {
  renderChips(tabKey);
  renderGrid(tabKey);
  renderPeriodIndicator(tabKey);
}

function refreshAll() {
  refresh('consideration');
  refresh('purchased');
  renderChips('consideration');
  renderChips('purchased');
}

// ===== Period Indicator =====
function renderPeriodIndicator(tabKey) {
  const ind = document.getElementById(tabKey + 'PeriodIndicator');
  const txt = document.getElementById(tabKey + 'PeriodText');
  const f = state.filters[tabKey];
  if (f.startDate || f.endDate) {
    txt.textContent = (f.startDate ? formatDate(f.startDate) : '') + ' 〜 ' + (f.endDate ? formatDate(f.endDate) : '');
    ind.classList.remove('hidden');
  } else {
    ind.classList.add('hidden');
  }
}

document.querySelectorAll('.period-clear').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.target;
    state.filters[t].startDate = null;
    state.filters[t].endDate = null;
    refresh(t);
  });
});

// ===== Period Modal =====
document.querySelectorAll('.period-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.periodTarget = btn.dataset.target;
    const f = state.filters[state.periodTarget];
    document.getElementById('periodStart').value = f.startDate || '';
    document.getElementById('periodEnd').value = f.endDate || '';
    document.getElementById('periodModalOverlay').classList.remove('hidden');
  });
});

document.getElementById('periodCancelBtn').addEventListener('click', () => {
  document.getElementById('periodModalOverlay').classList.add('hidden');
});

document.getElementById('periodApplyBtn').addEventListener('click', () => {
  const t = state.periodTarget;
  state.filters[t].startDate = document.getElementById('periodStart').value || null;
  state.filters[t].endDate   = document.getElementById('periodEnd').value || null;
  document.getElementById('periodModalOverlay').classList.add('hidden');
  refresh(t);
});

document.getElementById('periodModalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
});

// Sort change
document.getElementById('considerationSort').addEventListener('change', () => renderGrid('consideration'));
document.getElementById('purchasedSort').addEventListener('change', () => renderGrid('purchased'));

// ===== Detail Stars =====
function renderDetailStars(container, val, editable, item) {
  container.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const s = document.createElement('span');
    s.className = 'star' + (i <= val ? ' filled' : '') + (!editable ? ' readonly' : '');
    s.textContent = '★';
    s.dataset.n = i;
    if (editable) {
      s.addEventListener('click', () => {
        const newVal = Number(s.dataset.n);
        const items = DB.items;
        const idx = items.findIndex(it => it.id === item.id);
        if (idx === -1) return;
        items[idx].frequency = newVal;
        DB.items = items;
        item.frequency = newVal;
        renderDetailStars(container, newVal, true, item);
        refreshAll();
      });
    }
    container.appendChild(s);
  }
}

// ===== Detail Panel =====
function openDetail(id) {
  const item = DB.items.find(i => i.id === id);
  if (!item) return;
  state.openDetail = id;
  const panel = document.getElementById('detailPanel');
  const body  = document.getElementById('detailBody');
  document.getElementById('detailTitle').textContent = item.type === 'consideration' ? '検討リスト' : '購入リスト';
  document.getElementById('detailDeleteBtn').dataset.id = id;

  body.innerHTML = buildDetailHTML(item);

  // Stars (readonly for consideration, editable for purchased)
  body.querySelectorAll('.star-display').forEach(container => {
    const isPurchased = item.type === 'purchased';
    renderDetailStars(container, Number(container.dataset.value) || 0, isPurchased, item);
  });

  // Add usage button
  const addBtn = body.querySelector('.add-usage-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => showUsageForm(item));
  }

  panel.classList.remove('hidden');
  body.scrollTop = 0;
  requestAnimationFrame(() => panel.classList.add('open'));
  document.getElementById('detailOverlay').classList.remove('hidden');
}

function buildDetailHTML(item) {
  const imgInner = item.image
    ? `<img class="detail-img" src="${item.image}" alt="">`
    : `<div class="detail-img-placeholder">📦</div>`;

  const isConsideration = item.type === 'consideration';

  const ratingLabel = isConsideration ? '優先度' : '使用頻度';
  const ratingVal   = isConsideration ? (item.priority || 0) : (item.frequency || 0);
  const reasonLabel = isConsideration ? '購入することで解決したい課題' : '購入理由';
  const reasonVal   = isConsideration ? (item.reason || '') : (item.purchaseReason || '');
  const dateLabel   = isConsideration ? '追加日' : '購入日';

  let html = `
    <div class="detail-img-wrapper">
      ${imgInner}
      ${item.category ? `<span class="detail-category-overlay">${item.category}</span>` : ''}
    </div>
    <div class="detail-seller">${item.seller || ''}</div>
    <div class="detail-name">${item.name || ''}</div>
    <div class="detail-price">${formatPrice(item.price)}</div>
    <div class="detail-date">${dateLabel}：${formatDate(item.date)}</div>
    <div class="detail-section">
      <div class="detail-label">${reasonLabel}</div>
      <div class="detail-value">${reasonVal || '未入力'}</div>
    </div>
    <div class="detail-section">
      <div class="detail-label">${ratingLabel}</div>
      <div class="stars star-display" data-value="${ratingVal}"></div>
    </div>`;

  if (!isConsideration) {
    const logs = item.usageLogs || [];
    html += `
      <div class="detail-section">
        <div class="detail-label">使用感</div>
        <div class="usage-log" id="usageLogContainer">
          ${logs.map(l => `
            <div class="usage-entry">
              <div class="usage-entry-date">${formatDate(l.date)}</div>
              <div class="usage-entry-text">${l.text}</div>
            </div>`).join('')}
        </div>
        <button class="add-usage-btn">＋ 使用感を追加する</button>
      </div>
      <div class="detail-bottom-btns purchased-edit-btns">
        <button class="edit-btn" data-id="${item.id}">編集</button>
      </div>`;
  } else {
    html += `
      <div class="detail-bottom-btns">
        <button class="edit-btn" data-id="${item.id}">編集</button>
        <button class="purchase-btn" data-id="${item.id}">購入した</button>
      </div>`;
  }

  return html;
}

function showUsageForm(item) {
  const container = document.getElementById('detailBody');
  const existing = container.querySelector('.usage-form');
  if (existing) return;

  const form = document.createElement('div');
  form.className = 'usage-form';
  form.innerHTML = `
    <textarea placeholder="使用感を入力..."></textarea>
    <div class="usage-form-actions">
      <button class="btn-secondary usage-cancel" style="flex:none;padding:8px 14px">キャンセル</button>
      <button class="btn-primary usage-save" style="flex:none;padding:8px 14px">保存</button>
    </div>`;

  container.querySelector('.add-usage-btn').after(form);

  form.querySelector('.usage-cancel').addEventListener('click', () => form.remove());
  form.querySelector('.usage-save').addEventListener('click', () => {
    const text = form.querySelector('textarea').value.trim();
    if (!text) return;
    const items = DB.items;
    const idx   = items.findIndex(i => i.id === item.id);
    if (idx === -1) return;
    if (!items[idx].usageLogs) items[idx].usageLogs = [];
    const today = new Date().toISOString().slice(0, 10);
    items[idx].usageLogs.push({ date: today, text });
    DB.items = items;
    openDetail(item.id);
    refreshAll();
  });
}

// Edit button (event delegation)
document.getElementById('detailBody').addEventListener('click', e => {
  const btn = e.target.closest('.edit-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  const item = DB.items.find(i => i.id === id);
  if (!item) return;
  closeDetail();
  setTimeout(() => openForm(item, item.type), 300);
});

// Purchase button (event delegation)
document.getElementById('detailBody').addEventListener('click', e => {
  const btn = e.target.closest('.purchase-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  const items = DB.items;
  const idx   = items.findIndex(i => i.id === id);
  if (idx === -1) return;
  items[idx].type = 'purchased';
  items[idx].date = new Date().toISOString().slice(0, 10);
  items[idx].purchaseReason = items[idx].reason || '';
  DB.items = items;
  closeDetail();
  refreshAll();
});

// Delete
document.getElementById('detailDeleteBtn').addEventListener('click', () => {
  if (!confirm('このアイテムを削除しますか？')) return;
  const id = document.getElementById('detailDeleteBtn').dataset.id;
  DB.items = DB.items.filter(i => i.id !== id);
  closeDetail();
  refreshAll();
  if (state.activeTab === 'calendar') renderCalendar();
});

function closeDetail() {
  const panel = document.getElementById('detailPanel');
  panel.classList.remove('open');
  document.getElementById('detailOverlay').classList.add('hidden');
  setTimeout(() => panel.classList.add('hidden'), 280);
  state.openDetail = null;
}

document.getElementById('detailBackBtn').addEventListener('click', closeDetail);
document.getElementById('detailOverlay').addEventListener('click', closeDetail);

// ===== Form Panel =====
document.getElementById('fabBtn').addEventListener('click', () => {
  const defaultType = state.activeTab === 'purchased' ? 'purchased' : 'consideration';
  openForm(null, defaultType);
});

function openForm(item, defaultType) {
  const panel = document.getElementById('formPanel');
  const body  = document.getElementById('formBody');
  document.getElementById('formTitle').textContent = item ? 'アイテムを編集' : 'アイテムを追加';
  body.innerHTML = buildFormHTML(item, defaultType);
  bindFormEvents(item, defaultType);
  panel.classList.remove('hidden');
  body.scrollTop = 0;
  requestAnimationFrame(() => panel.classList.add('open'));
}

function closeForm() {
  const panel = document.getElementById('formPanel');
  panel.classList.remove('open');
  setTimeout(() => panel.classList.add('hidden'), 280);
}

document.getElementById('formBackBtn').addEventListener('click', closeForm);

function buildFormHTML(item, defaultType) {
  const cats = DB.categories;
  const type = item ? item.type : (defaultType || 'consideration');
  const catOptions = cats.map(c => `<option value="${c}" ${item && item.category === c ? 'selected' : ''}>${c}</option>`).join('');

  return `
    <div class="form-type-toggle">
      <button class="type-btn ${type === 'consideration' ? 'active' : ''}" data-type="consideration">検討リスト</button>
      <button class="type-btn ${type === 'purchased' ? 'active' : ''}" data-type="purchased">購入リスト</button>
    </div>

    <div class="form-field">
      <label class="form-label">画像</label>
      <div class="img-upload-area" id="imgUploadArea">
        ${item && item.image ? `<img src="${item.image}" alt="">` : `<div class="img-upload-label"><div class="img-upload-icon">📷</div>タップして画像を選択</div>`}
        <input type="file" accept="image/*" class="img-upload-input" id="imgInput">
      </div>
    </div>

    <div class="form-field">
      <label class="form-label">カテゴリ</label>
      <div class="form-select-row">
        <select class="form-select" id="formCategory">
          <option value="">選択してください</option>
          ${catOptions}
        </select>
        <button class="manage-category-btn" id="manageCategoryBtn">管理</button>
      </div>
    </div>

    <div class="form-field">
      <label class="form-label" id="formSellerLabel">${type === 'consideration' ? '販売元' : '購入元'}</label>
      <div class="autocomplete-wrapper">
        <input type="text" class="form-input" id="formSeller" placeholder="例：Amazon、無印良品" value="${item ? item.seller || '' : ''}" autocomplete="off">
        <div class="autocomplete-list hidden" id="sellerSuggestions"></div>
      </div>
    </div>

    <div class="form-field">
      <label class="form-label">商品名</label>
      <input type="text" class="form-input" id="formName" placeholder="商品名を入力" value="${item ? item.name || '' : ''}">
    </div>

    <div class="form-field">
      <label class="form-label">金額</label>
      <input type="number" class="form-input" id="formPrice" placeholder="15000" value="${item ? item.price || '' : ''}">
    </div>

    <div class="form-field">
      <label class="form-label" id="formDateLabel">${type === 'consideration' ? '追加日' : '購入日'}</label>
      <div class="form-date-wrapper">
        <div class="form-input date-display" id="formDateDisplay">${(item && item.date ? item.date : new Date().toISOString().slice(0, 10)).replace(/-/g, '/')}</div>
        <input type="date" id="formDate" class="date-hidden-input" value="${item ? item.date || new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}">
      </div>
    </div>

    <div class="form-field" id="formReasonField">
      <label class="form-label" id="formReasonLabel">${type === 'consideration' ? '購入することで解決したい課題' : '購入理由'}</label>
      <textarea class="form-textarea" id="formReason" placeholder="理由を入力">${item ? (type === 'consideration' ? item.reason || '' : item.purchaseReason || '') : ''}</textarea>
    </div>

    <div class="form-field">
      <label class="form-label" id="formRatingLabel">${type === 'consideration' ? '優先度' : '使用頻度'}</label>
      <div class="stars" id="formStars" data-value="${item ? (type === 'consideration' ? item.priority || 0 : item.frequency || 0) : 0}"></div>
    </div>

    <button class="save-btn" id="formSaveBtn" style="width:100%;padding:15px;margin-top:8px;margin-bottom:32px;border-radius:12px;font-size:15px;">保存</button>`;
}

function bindFormEvents(existingItem, defaultType) {
  const body = document.getElementById('formBody');
  let imageData = existingItem ? existingItem.image || null : null;
  let currentType = existingItem ? existingItem.type : (defaultType || 'consideration');
  let starValue = existingItem ? (currentType === 'consideration' ? existingItem.priority || 0 : existingItem.frequency || 0) : 0;

  // Image upload → crop
  document.getElementById('imgInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      openCropModal(ev.target.result, croppedData => {
        imageData = croppedData;
        setUploadAreaImage(imageData);
      });
    };
    reader.readAsDataURL(file);
  });

  // 再トリミング時にimageDataを更新
  document.getElementById('imgUploadArea').addEventListener('imageUpdated', e => {
    imageData = e.detail;
  });

  // 日付表示の同期
  document.getElementById('formDate').addEventListener('change', e => {
    const val = e.target.value;
    document.getElementById('formDateDisplay').textContent = val ? val.replace(/-/g, '/') : '日付を選択';
  });

  // 販売元サジェスト（カスタム）
  const sellerInput = document.getElementById('formSeller');
  const suggestionBox = document.getElementById('sellerSuggestions');
  const allSellers = [...new Map(
    [...DB.items]
      .filter(i => i.seller)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .map(i => [i.seller, i.seller])
  ).values()];

  function showSuggestions(val) {
    const q = val.trim().toLowerCase();
    const matches = q
      ? allSellers.filter(s => s.toLowerCase().includes(q))
      : allSellers;
    if (matches.length === 0) { suggestionBox.classList.add('hidden'); return; }
    suggestionBox.innerHTML = matches.map(s =>
      `<div class="autocomplete-item">${s}</div>`
    ).join('');
    suggestionBox.classList.remove('hidden');
    suggestionBox.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('mousedown', e => {
        e.preventDefault();
        sellerInput.value = el.textContent;
        suggestionBox.classList.add('hidden');
      });
      el.addEventListener('touchend', e => {
        e.preventDefault();
        sellerInput.value = el.textContent;
        suggestionBox.classList.add('hidden');
      });
    });
  }

  sellerInput.addEventListener('input', () => showSuggestions(sellerInput.value));
  sellerInput.addEventListener('focus', () => showSuggestions(sellerInput.value));
  sellerInput.addEventListener('blur', () => {
    setTimeout(() => suggestionBox.classList.add('hidden'), 150);
  });

  // visualViewport でキーボード高さ分だけパネルを縮める
  const formPanel = document.getElementById('formPanel');
  function onViewportResize() {
    const keyboardH = window.innerHeight - window.visualViewport.height;
    formPanel.style.paddingBottom = keyboardH > 0 ? keyboardH + 'px' : '';
  }
  window.visualViewport.addEventListener('resize', onViewportResize);
  // パネルを閉じたときにリスナー解除・リセット
  formPanel.addEventListener('transitionend', () => {
    if (!formPanel.classList.contains('open')) {
      formPanel.style.paddingBottom = '';
      window.visualViewport.removeEventListener('resize', onViewportResize);
    }
  }, { once: true });

  // Type toggle
  body.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      body.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      document.getElementById('formSellerLabel').textContent = currentType === 'consideration' ? '販売元' : '購入元';
      document.getElementById('formDateLabel').textContent   = currentType === 'consideration' ? '追加日' : '購入日';
      document.getElementById('formReasonLabel').textContent = currentType === 'consideration' ? '購入することで解決したい課題' : '購入理由';
      document.getElementById('formRatingLabel').textContent = currentType === 'consideration' ? '優先度' : '使用頻度';
    });
  });

  // Stars
  renderStarInput(starValue);
  document.getElementById('formStars').addEventListener('click', e => {
    const s = e.target.closest('.star');
    if (!s) return;
    starValue = Number(s.dataset.n);
    renderStarInput(starValue);
  });

  // Category manage
  document.getElementById('manageCategoryBtn').addEventListener('click', openCategoryModal);

  // Save
  document.getElementById('formSaveBtn').addEventListener('click', () => {
    const name = document.getElementById('formName').value.trim();
    if (!name) { alert('商品名を入力してください'); return; }

    const items = DB.items;
    if (existingItem) {
      const idx = items.findIndex(i => i.id === existingItem.id);
      if (idx !== -1) {
        items[idx] = buildItemFromForm(existingItem.id, currentType, imageData, starValue);
        DB.items = items;
      }
    } else {
      const newItem = buildItemFromForm(genId(), currentType, imageData, starValue);
      items.push(newItem);
      DB.items = items;
    }
    closeForm();
    refreshAll();
    if (state.activeTab === 'calendar') renderCalendar();
  });
}

function buildItemFromForm(id, type, imageData, starValue) {
  const cat = document.getElementById('formCategory').value;
  return {
    id,
    type,
    image: imageData,
    category: cat || null,
    seller: document.getElementById('formSeller').value.trim(),
    name: document.getElementById('formName').value.trim(),
    price: document.getElementById('formPrice').value ? Number(document.getElementById('formPrice').value) : null,
    date: document.getElementById('formDate').value || null,
    reason: type === 'consideration' ? document.getElementById('formReason').value.trim() : undefined,
    purchaseReason: type === 'purchased' ? document.getElementById('formReason').value.trim() : undefined,
    priority: type === 'consideration' ? starValue : undefined,
    frequency: type === 'purchased' ? starValue : undefined,
    usageLogs: type === 'purchased' ? [] : undefined,
  };
}

function renderStarInput(val) {
  const container = document.getElementById('formStars');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const s = document.createElement('span');
    s.className = 'star' + (i <= val ? ' filled' : '');
    s.textContent = '★';
    s.dataset.n = i;
    container.appendChild(s);
  }
}

// ===== Category Modal =====
function openCategoryModal() {
  renderCategoryModal();
  document.getElementById('categoryModalOverlay').classList.remove('hidden');
}

function renderCategoryModal() {
  const list = document.getElementById('categoryModalList');
  list.innerHTML = '';

  DB.categories.forEach((cat, idx) => {
    const row = document.createElement('div');
    row.className = 'category-item';
    row.draggable = true;
    row.dataset.idx = idx;
    row.innerHTML = `
      <span class="drag-handle">⠿</span>
      <span class="category-name-text">${cat}</span>
      <div class="category-item-actions">
        <button class="category-edit-btn">編集</button>
        <button class="category-delete-btn">×</button>
      </div>`;

    // 編集
    row.querySelector('.category-edit-btn').addEventListener('click', () => {
      const nameEl = row.querySelector('.category-name-text');
      const input = document.createElement('input');
      input.type = 'text';
      input.value = cat;
      input.className = 'category-edit-input';
      nameEl.replaceWith(input);
      input.focus();
      const save = () => {
        const newVal = input.value.trim();
        if (!newVal || newVal === cat) { renderCategoryModal(); return; }
        if (DB.categories.includes(newVal)) { alert('すでに存在します'); renderCategoryModal(); return; }
        const cats = DB.categories;
        cats[idx] = newVal;
        DB.categories = cats;
        DB.items = DB.items.map(i => i.category === cat ? { ...i, category: newVal } : i);
        renderCategoryModal();
        refreshAll();
      };
      input.addEventListener('blur', save);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); save(); } });
    });

    // 削除
    row.querySelector('.category-delete-btn').addEventListener('click', () => {
      if (!confirm(`「${cat}」を削除しますか？`)) return;
      DB.categories = DB.categories.filter(c => c !== cat);
      renderCategoryModal();
      refreshAll();
    });

    list.appendChild(row);
  });

  setupCategoryDragDrop(list);
}

function setupCategoryDragDrop(list) {
  let dragSrc = null;

  // --- PC: HTML5 Drag ---
  list.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('dragstart', e => {
      dragSrc = item;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => item.classList.add('dragging'), 0);
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      list.querySelectorAll('.category-item').forEach(i => i.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      if (item === dragSrc) return;
      list.querySelectorAll('.category-item').forEach(i => i.classList.remove('drag-over'));
      item.classList.add('drag-over');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      if (!dragSrc || item === dragSrc) return;
      const cats = DB.categories;
      const from = Number(dragSrc.dataset.idx);
      const to   = Number(item.dataset.idx);
      cats.splice(to, 0, cats.splice(from, 1)[0]);
      DB.categories = cats;
      renderCategoryModal();
      refreshAll();
    });
  });

  // --- Mobile: Touch Drag ---
  let touchDragging = null;
  let touchClone    = null;
  let touchOffsetY  = 0;

  list.querySelectorAll('.drag-handle').forEach(handle => {
    handle.addEventListener('touchstart', e => {
      const item = handle.closest('.category-item');
      touchDragging = item;
      const rect = item.getBoundingClientRect();
      touchOffsetY = rect.top - e.touches[0].clientY;
      touchClone = item.cloneNode(true);
      touchClone.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;opacity:0.85;z-index:9999;pointer-events:none;`;
      document.body.appendChild(touchClone);
      item.style.opacity = '0.3';
    }, { passive: true });

    handle.addEventListener('touchmove', e => {
      if (!touchDragging) return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      touchClone.style.top = (y + touchOffsetY) + 'px';
      list.querySelectorAll('.category-item').forEach(i => {
        if (i === touchDragging) return;
        const r = i.getBoundingClientRect();
        i.classList.toggle('drag-over', y >= r.top && y <= r.bottom);
      });
    }, { passive: false });

    handle.addEventListener('touchend', () => {
      if (!touchDragging) return;
      const target = list.querySelector('.category-item.drag-over');
      if (target && target !== touchDragging) {
        const cats = DB.categories;
        const from = Number(touchDragging.dataset.idx);
        const to   = Number(target.dataset.idx);
        cats.splice(to, 0, cats.splice(from, 1)[0]);
        DB.categories = cats;
      }
      touchClone.remove();
      touchDragging.style.opacity = '';
      touchDragging = null;
      touchClone = null;
      renderCategoryModal();
      refreshAll();
    });
  });
}

document.getElementById('addCategoryBtn').addEventListener('click', () => {
  const input = document.getElementById('newCategoryInput');
  const val = input.value.trim();
  if (!val) return;
  if (DB.categories.includes(val)) { alert('すでに存在します'); return; }
  DB.categories = [...DB.categories, val];
  input.value = '';
  renderCategoryModal();
  refreshAll();
  // Update form select if open
  const formSelect = document.getElementById('formCategory');
  if (formSelect) {
    const opt = document.createElement('option');
    opt.value = val; opt.textContent = val;
    formSelect.appendChild(opt);
  }
});

document.getElementById('categoryModalClose').addEventListener('click', () => {
  document.getElementById('categoryModalOverlay').classList.add('hidden');
});

document.getElementById('categoryModalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
});

// ===== Japanese Holidays =====
const JP_HOLIDAYS = {
  // 2025
  '2025-01-01': '元日',
  '2025-01-13': '成人の日',
  '2025-02-11': '建国記念の日',
  '2025-02-23': '天皇誕生日',
  '2025-02-24': '振替休日',
  '2025-03-20': '春分の日',
  '2025-04-29': '昭和の日',
  '2025-05-03': '憲法記念日',
  '2025-05-04': 'みどりの日',
  '2025-05-05': 'こどもの日',
  '2025-05-06': '振替休日',
  '2025-07-21': '海の日',
  '2025-08-11': '山の日',
  '2025-09-15': '敬老の日',
  '2025-09-23': '秋分の日',
  '2025-10-13': 'スポーツの日',
  '2025-11-03': '文化の日',
  '2025-11-23': '勤労感謝の日',
  '2025-11-24': '振替休日',
  // 2026
  '2026-01-01': '元日',
  '2026-01-12': '成人の日',
  '2026-02-11': '建国記念の日',
  '2026-02-23': '天皇誕生日',
  '2026-03-20': '春分の日',
  '2026-04-29': '昭和の日',
  '2026-05-03': '憲法記念日',
  '2026-05-04': 'みどりの日',
  '2026-05-05': 'こどもの日',
  '2026-05-06': '振替休日',
  '2026-07-20': '海の日',
  '2026-08-11': '山の日',
  '2026-09-21': '敬老の日',
  '2026-09-23': '秋分の日',
  '2026-10-12': 'スポーツの日',
  '2026-11-03': '文化の日',
  '2026-11-23': '勤労感謝の日',
  // 2027
  '2027-01-01': '元日',
  '2027-01-11': '成人の日',
  '2027-02-11': '建国記念の日',
  '2027-02-23': '天皇誕生日',
  '2027-03-21': '春分の日',
  '2027-04-29': '昭和の日',
  '2027-05-03': '憲法記念日',
  '2027-05-04': 'みどりの日',
  '2027-05-05': 'こどもの日',
  '2027-07-19': '海の日',
  '2027-08-11': '山の日',
  '2027-09-20': '敬老の日',
  '2027-09-23': '秋分の日',
  '2027-10-11': 'スポーツの日',
  '2027-11-03': '文化の日',
  '2027-11-23': '勤労感謝の日',
};

function getHoliday(y, m, d) {
  const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return JP_HOLIDAYS[key] || null;
}

// ===== Calendar =====
function renderCalendar() {
  const { calYear: y, calMonth: m } = state;
  document.getElementById('calMonth').textContent = `${y}年${m + 1}月`;

  const items = DB.items.filter(i => i.type === 'purchased');
  const monthItems = items.filter(i => {
    if (!i.date) return false;
    const d = new Date(i.date);
    return d.getFullYear() === y && d.getMonth() === m;
  });

  const monthTotal = monthItems.reduce((s, i) => s + (i.price || 0), 0);
  document.getElementById('calTotalAmount').textContent = formatPrice(monthTotal);

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  const firstDay    = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays    = new Date(y, m, 0).getDate(); // 前月の総日数

  // Amount by date
  const amountByDate = {};
  const itemsByDate  = {};
  monthItems.forEach(i => {
    const day = parseInt(i.date.split('-')[2]);
    amountByDate[day] = (amountByDate[day] || 0) + (i.price || 0);
    if (!itemsByDate[day]) itemsByDate[day] = [];
    itemsByDate[day].push(i);
  });

  function makeCell(dayNum, classes, holidayName) {
    const cell = document.createElement('div');
    cell.className = 'cal-day ' + classes.join(' ');
    cell.innerHTML = `<div class="cal-day-num">${dayNum}</div><div class="cal-day-holiday">${holidayName || ''}</div><div class="cal-day-amount"></div>`;
    return cell;
  }

  function dayClasses(dow, isOther, holidayName) {
    const cls = [];
    if (isOther) cls.push('other-month');
    if (dow === 0) cls.push('sunday');
    if (dow === 6) cls.push('saturday');
    if (holidayName && !isOther) cls.push('holiday');
    return cls;
  }

  // 前月末尾
  for (let i = 0; i < firstDay; i++) {
    const d   = prevDays - firstDay + 1 + i;
    const dow = i;
    const cell = makeCell(d, dayClasses(dow, true), null);
    grid.appendChild(cell);
  }

  // 今月
  for (let d = 1; d <= daysInMonth; d++) {
    const dow         = new Date(y, m, d).getDay();
    const hasItems    = !!amountByDate[d];
    const isToday     = y === todayY && m === todayM && d === todayD;
    const holidayName = getHoliday(y, m, d);
    const cls         = dayClasses(dow, false, holidayName);
    if (hasItems) cls.push('has-purchase');
    if (isToday)  cls.push('today');
    const cell = makeCell(d, cls, holidayName);
    if (hasItems) {
      cell.querySelector('.cal-day-amount').textContent = formatPrice(amountByDate[d]);
      cell.addEventListener('click', () => openCalDayModal(y, m, d, itemsByDate[d]));
    }
    grid.appendChild(cell);
  }

  // 翌月先頭（6週分になるよう埋める）
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= remaining; i++) {
    const dow  = (total + i - 1) % 7;
    const cell = makeCell(i, dayClasses(dow, true, null), null);
    grid.appendChild(cell);
  }
}

function openCalDayModal(y, m, d, items) {
  const title = `${y}年${m + 1}月${d}日`;
  const total = items.reduce((s, i) => s + (i.price || 0), 0);
  document.getElementById('calDayTitle').textContent = `${title}  ${formatPrice(total)}`;
  const list = document.getElementById('calDayList');
  list.innerHTML = items.map(i => `
    <div class="cal-day-item" data-id="${i.id}">
      <div>
        <div class="cal-day-item-name">${i.seller ? i.seller + '｜' : ''}${i.name}</div>
        <div class="cal-day-item-detail">${i.category || ''}</div>
      </div>
      <div class="cal-day-item-price">${formatPrice(i.price)}</div>
    </div>`).join('');

  list.querySelectorAll('.cal-day-item').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('calDayOverlay').classList.add('hidden');
      openDetail(el.dataset.id);
    });
  });

  document.getElementById('calDayOverlay').classList.remove('hidden');
}

document.getElementById('calDayClose').addEventListener('click', () => {
  document.getElementById('calDayOverlay').classList.add('hidden');
});

document.getElementById('calDayOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
});

document.getElementById('prevMonth').addEventListener('click', () => {
  if (state.calMonth === 0) { state.calMonth = 11; state.calYear--; }
  else state.calMonth--;
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  if (state.calMonth === 11) { state.calMonth = 0; state.calYear++; }
  else state.calMonth++;
  renderCalendar();
});

function setUploadAreaImage(src) {
  const area = document.getElementById('imgUploadArea');
  area.classList.add('has-image');
  area.innerHTML = `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;"><input type="file" accept="image/*" class="img-upload-input" id="imgInput">`;
  document.getElementById('imgInput').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => openCropModal(ev.target.result, d => {
      // imageData is in closure of bindFormEvents - update via event
      area.dispatchEvent(new CustomEvent('imageUpdated', { detail: d, bubbles: true }));
      setUploadAreaImage(d);
    });
    r.readAsDataURL(f);
  });
}

// ===== Crop Modal (Instagram style) =====
let cropCallback = null;
const crop = {
  img: new Image(),
  x: 0, y: 0, scale: 1,
  frameSize: 0,
  stageW: 0, stageH: 0,
  dragging: false,
  lastX: 0, lastY: 0,
  pinchDist: 0,
};

function openCropModal(imageSrc, callback) {
  cropCallback = callback;
  document.getElementById('cropModalOverlay').classList.remove('hidden');

  crop.img = new Image();
  crop.img.onload = () => {
    const stage = document.getElementById('cropStage');
    const canvas = document.getElementById('cropCanvas');
    crop.stageW = stage.clientWidth;
    crop.stageH = stage.clientHeight;
    canvas.width  = crop.stageW;
    canvas.height = crop.stageH;

    crop.frameSize = Math.min(crop.stageW, crop.stageH) * 0.85;
    const frame = document.getElementById('cropFrame');
    const fx = (crop.stageW - crop.frameSize) / 2;
    const fy = (crop.stageH - crop.frameSize) / 2;
    frame.style.left   = fx + 'px';
    frame.style.top    = fy + 'px';
    frame.style.width  = crop.frameSize + 'px';
    frame.style.height = crop.frameSize + 'px';

    // fit image to fill frame
    const fitScale = Math.max(crop.frameSize / crop.img.width, crop.frameSize / crop.img.height);
    crop.scale = fitScale;
    crop.x = (crop.stageW - crop.img.width * crop.scale) / 2;
    crop.y = (crop.stageH - crop.img.height * crop.scale) / 2;
    drawCrop();
  };
  crop.img.src = imageSrc;
}

function drawCrop() {
  const canvas = document.getElementById('cropCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(crop.img, crop.x, crop.y, crop.img.width * crop.scale, crop.img.height * crop.scale);
}

// Touch events
const cropStage = document.getElementById('cropStage');

cropStage.addEventListener('touchstart', e => {
  e.preventDefault();
  if (e.touches.length === 1) {
    crop.dragging = true;
    crop.lastX = e.touches[0].clientX;
    crop.lastY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    crop.pinchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: false });

cropStage.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 1 && crop.dragging) {
    const dx = e.touches[0].clientX - crop.lastX;
    const dy = e.touches[0].clientY - crop.lastY;
    crop.x += dx; crop.y += dy;
    crop.lastX = e.touches[0].clientX;
    crop.lastY = e.touches[0].clientY;
    drawCrop();
  } else if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    const ratio = dist / crop.pinchDist;
    const minScale = Math.max(crop.frameSize / crop.img.width, crop.frameSize / crop.img.height);
    const oldScale = crop.scale;
    const newScale = Math.max(minScale, Math.min(oldScale * ratio, minScale * 6));
    crop.x = midX - (midX - crop.x) * (newScale / oldScale);
    crop.y = midY - (midY - crop.y) * (newScale / oldScale);
    crop.scale = newScale;
    crop.pinchDist = dist;
    drawCrop();
  }
}, { passive: false });

cropStage.addEventListener('touchend', () => { crop.dragging = false; });

// Mouse events (PC用)
cropStage.addEventListener('mousedown', e => {
  crop.dragging = true;
  crop.lastX = e.clientX; crop.lastY = e.clientY;
});
cropStage.addEventListener('mousemove', e => {
  if (!crop.dragging) return;
  crop.x += e.clientX - crop.lastX;
  crop.y += e.clientY - crop.lastY;
  crop.lastX = e.clientX; crop.lastY = e.clientY;
  drawCrop();
});
cropStage.addEventListener('mouseup', () => { crop.dragging = false; });
cropStage.addEventListener('wheel', e => {
  e.preventDefault();
  const minScale = Math.max(crop.frameSize / crop.img.width, crop.frameSize / crop.img.height);
  crop.scale = Math.max(minScale, Math.min(crop.scale * (e.deltaY > 0 ? 0.9 : 1.1), minScale * 6));
  drawCrop();
}, { passive: false });

document.getElementById('cropConfirmBtn').addEventListener('click', () => {
  const frameSize = crop.frameSize;
  const fx = (crop.stageW - frameSize) / 2;
  const fy = (crop.stageH - frameSize) / 2;

  // 元画像上のトリミング領域を計算
  const srcX    = (fx - crop.x) / crop.scale;
  const srcY    = (fy - crop.y) / crop.scale;
  const srcSize = frameSize / crop.scale;

  const OUTPUT = 700;
  const out = document.createElement('canvas');
  out.width = OUTPUT; out.height = OUTPUT;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, OUTPUT, OUTPUT);
  // 表示キャンバスではなく元画像から直接描画
  ctx.drawImage(crop.img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);

  // WebP対応なら使用（同画質でファイルサイズ小）、非対応はJPEG
  const testCanvas = document.createElement('canvas');
  const supportsWebP = testCanvas.toDataURL('image/webp').startsWith('data:image/webp');
  const fmt = supportsWebP ? 'image/webp' : 'image/jpeg';
  const data = out.toDataURL(fmt, 0.92);

  document.getElementById('cropModalOverlay').classList.add('hidden');
  if (cropCallback) cropCallback(data);
});

document.getElementById('cropCancelBtn').addEventListener('click', () => {
  document.getElementById('cropModalOverlay').classList.add('hidden');
});

// ===== Swipe Gestures =====
(function setupSwipe() {
  let lastDetailId = null; // 最後に開いた詳細アイテムのID

  // 詳細パネルが開かれたときにIDを記録
  const origOpenDetail = window.openDetail;
  const detailPanel = document.getElementById('detailPanel');
  const formPanel   = document.getElementById('formPanel');
  const mainContent = document.querySelector('.main-content');

  // パネル上の右スワイプで閉じる
  function addSwipeBack(panel, closeFn) {
    let startX = 0, startY = 0, tracking = false;
    panel.addEventListener('touchstart', e => {
      const t = e.touches[0];
      if (t.clientX > 30) return; // 左端30px以内のみ
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
    }, { passive: true });
    panel.addEventListener('touchmove', e => {
      if (!tracking) return;
      const dx = e.touches[0].clientX - startX;
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > 10 && dy < dx) e.preventDefault(); // 水平スワイプ中はスクロール抑制
    }, { passive: false });
    panel.addEventListener('touchend', e => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);
      if (dx > 80 && dy < dx * 0.6) closeFn();
    }, { passive: true });
  }

  addSwipeBack(detailPanel, () => {
    lastDetailId = state.openDetail;
    closeDetail();
  });
  addSwipeBack(formPanel, () => closeForm());

  // メイン画面の右端から左スワイプで詳細を再表示（進む）
  let fwdStartX = 0, fwdStartY = 0, fwdTracking = false;
  const screenW = () => window.innerWidth;
  mainContent.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if (t.clientX < screenW() - 30) return; // 右端30px以内のみ
    fwdStartX = t.clientX;
    fwdStartY = t.clientY;
    fwdTracking = true;
  }, { passive: true });
  mainContent.addEventListener('touchend', e => {
    if (!fwdTracking) return;
    fwdTracking = false;
    const dx = fwdStartX - e.changedTouches[0].clientX; // 左方向なのでfwdStartX - endX
    const dy = Math.abs(e.changedTouches[0].clientY - fwdStartY);
    if (dx > 80 && dy < dx * 0.6 && lastDetailId) {
      openDetail(lastDetailId);
    }
  }, { passive: true });
})();

// ===== Init =====
refreshAll();
