// ========== CẤU HÌNH ==========
const LS_KEY = 'expenses_v1';
let expenses = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
let categoryChart;
let viewMode = 'day';
const $ = sel => document.querySelector(sel);
const form = $('#expense-form');
let editIndex = null;

let currentDate = new Date(); 
let currentWeekStart = getStartOfWeek(new Date());
if (new Date().getDay() === 0) currentWeekStart.setDate(currentWeekStart.getDate() - 7);
// ========== HÀM TIỆN ÍCH ==========
function saveData(){ localStorage.setItem(LS_KEY,JSON.stringify(expenses)); }
function todayISO(){ return new Date().toISOString().split('T')[0]; }
function showToast(msg){
  const toast = $('#toast');
  toast.textContent = msg;
  toast.className = 'toast show';
  setTimeout(()=>toast.className='toast',2500);
}
function pad(n){ return n<10?'0'+n:n; }
function getStartOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? 0 : 1 - day);
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function formatWeekLabel(date){
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(start.getDate()+6);
  return `${pad(start.getDate())}/${pad(start.getMonth()+1)} - ${pad(end.getDate())}/${pad(end.getMonth()+1)}`;
}
function getExpensesOfWeek(startDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return expenses.filter(e => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
  });
}

// ========== INPUT ==========
const amountInput = $('#amount');
amountInput.addEventListener('input', e => {
  const cursorPos = e.target.selectionStart;
  const raw = e.target.value.replace(/[^\d]/g, '');
  const formatted = raw ? parseInt(raw, 10).toLocaleString('vi-VN') : '';
  e.target.value = formatted;
  const diff = formatted.length - raw.length;
  e.target.setSelectionRange(cursorPos + diff, cursorPos + diff);
});
amountInput.addEventListener('blur', e => {
  const raw = e.target.value.replace(/[^\d]/g, '');
  e.target.value = raw ? parseInt(raw, 10).toLocaleString('vi-VN') : '';
});

// ========== FORM SUBMIT ==========
form.addEventListener('submit', e=>{
  e.preventDefault();
  const title = $('#title').value.trim();
  const amountStr = $('#amount').value.replace(/[^\d]/g,'');
  const amount = parseInt(amountStr,10);
  const category = $('#category').value;
  const date = $('#date').value || todayISO();
  const note = $('#note')?.value.trim() || '';
  const photoData = previewDiv.querySelector('img')?.src || '';

  if(!title || isNaN(amount)){ showToast('⚠️ Vui lòng nhập đầy đủ!'); return; }
  if(editIndex!==null){
  expenses[editIndex] = { title, amount, category, date, note, photo: photoData };
  showToast('✏️ Đã chỉnh sửa!');
  editIndex = null;
  } else {
    expenses.push({ title, amount, category, date, note, photo: photoData });
    showToast('✅ Đã thêm!');
  }

  saveData();
  renderCurrentView();
  form.reset();
  $('#date').value = todayISO();
  previewDiv.innerHTML = '';
  photoInput.value = '';
});

// ========== TAB ==========
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    viewMode = btn.dataset.mode;
    updateLabel();
    renderCurrentView();
  });
});

// ========== NÚT < > ==========
$('#prev-week').addEventListener('click', ()=>{
  if(viewMode==='day') currentDate.setDate(currentDate.getDate()-1);
  else if(viewMode==='week') currentWeekStart.setDate(currentWeekStart.getDate()-7);
  else if (viewMode === 'year') currentDate.setFullYear(currentDate.getFullYear() - 1);
  updateLabel();
  renderCurrentView();
});
$('#next-week').addEventListener('click', ()=>{
  if(viewMode==='day') currentDate.setDate(currentDate.getDate()+1);
  else if(viewMode==='week') currentWeekStart.setDate(currentWeekStart.getDate()+7);
  else if (viewMode === 'year') currentDate.setFullYear(currentDate.getFullYear() + 1);
  updateLabel();
  renderCurrentView();
});

// ========== UPDATE LABEL ==========
function updateLabel() {
  const label = $('#week-label');
  label.textContent =
    viewMode === 'day' ? `${pad(currentDate.getDate())}/${pad(currentDate.getMonth()+1)}/${currentDate.getFullYear()}`
    : viewMode === 'week' ? formatWeekLabel(currentWeekStart)
    : `${currentDate.getFullYear()}`; 
}

// ========== RENDER ==========
function renderCurrentView(){
  if(viewMode==='day') renderDay();
  else if(viewMode==='week') renderWeek();
  else if (viewMode === 'year') renderYear();
}

function renderDay(){
  const filtered = expenses.filter(e=> new Date(e.date).toDateString()===currentDate.toDateString());
  renderExpensesFiltered(filtered);
  updateTotalFiltered(filtered);
  updateChartFiltered(filtered);
}

function renderWeek(){
  const filtered = getExpensesOfWeek(currentWeekStart);
  renderExpensesFiltered(filtered);
  updateTotalFiltered(filtered);
  updateChartFiltered(filtered);
}

function renderYear() {
  const year = currentDate.getFullYear();
  const filtered = expenses.filter(e => new Date(e.date).getFullYear() === year);
  renderExpensesFiltered(filtered);
  updateTotalFiltered(filtered);
  updateChartFiltered(filtered);
}

// ========== TỔNG TIỀN ==========

function updateTotalFiltered(listFiltered){
  const total = listFiltered.reduce((sum,e)=>sum+e.amount,0);
  $('#total-amount').textContent = total.toLocaleString('vi-VN') + ' ₫';
}

// ========== MÀU CỐ ĐỊNH CHO CATEGORY ==========
const categoryColors = {
  "Ăn uống": "#9be1ff",
  "Di chuyển": "#f7c9ff",
  "Mua sắm": "#E2F0CB",
  "Giải trí": "#ff8c8c",
  "Khác": "#c2c8ff"
};

// ========== CHART ==========
function updateChartFiltered(listFiltered) {
  const ctx = $('#categoryChart');
  if (categoryChart) categoryChart.destroy();
  if (listFiltered.length === 0) {
    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Không có dữ liệu'],
        datasets: [{
          data: [1],
          backgroundColor: ['#ddd'],
          borderRadius: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom' }
        }
      }
    });
    return;
  }

  const categoriesInData = [...new Set(listFiltered.map(e => e.category))];
  //const colors = ['#9be1ff', '#f7c9ff', '#E2F0CB', '#ff8c8c', '#c2c8ff'];
  const chartType = viewMode === 'day' ? 'doughnut' : 'bar';

  let datasets, labels;
  let labelText = '';
  if (viewMode === 'day') {
    labelText = `${pad(currentDate.getDate())}/${pad(currentDate.getMonth() + 1)}/${currentDate.getFullYear()}`;
  } else if (viewMode === 'week') {
    labelText = formatWeekLabel(currentWeekStart);
  } else if (viewMode === 'month') {
    labelText = `${pad(currentDate.getMonth() + 1)}/${currentDate.getFullYear()}`;
  }
  // =================== NGÀY ===================
  if (chartType === 'doughnut') {
    labels = categoriesInData;
    datasets = [{
      label: labelText,
      data: categoriesInData.map(c =>
        listFiltered
          .filter(e => e.category === c)
          .reduce((sum, e) => sum + e.amount, 0)
      ),
      backgroundColor: categoriesInData.map(c => categoryColors[c] || "#ccc"),
      borderRadius: 15
    }];
  // =================== TUẦN ===================
  } else if (viewMode === 'week') {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    labels = days.map(d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`);
    datasets = categoriesInData.map((c, i) => {
      const dataByDay = days.map(d => {
        const dayData = listFiltered.filter(e => {
          const ed = new Date(e.date);
          return (
            e.category === c &&
            ed.getDate() === d.getDate() &&
            ed.getMonth() === d.getMonth() &&
            ed.getFullYear() === d.getFullYear()
          );
        });
        return dayData.reduce((sum, e) => sum + e.amount, 0);
      });
      return {
        label: c,
        data: dataByDay,
        backgroundColor: categoryColors[c] || "#ccc",
        borderRadius: 5,
        font: { size: 10 }
      };
    });
  // =================== THÁNG ===================
  } else if (viewMode === 'year') {
  const months = Array.from({ length: 12 }, (_, i) => i);
  labels = months.map(m => `${pad(m + 1)}/${currentDate.getFullYear()}`);
  datasets = [...new Set(listFiltered.map(e => e.category))].map(c => {
    const dataByMonth = months.map(m => {
      const monthData = listFiltered.filter(e => {
        const d = new Date(e.date);
        return e.category === c && d.getMonth() === m;
      });
      return monthData.reduce((sum, e) => sum + e.amount, 0);
    });
    return {
      label: c,
      data: dataByMonth,
      backgroundColor: categoryColors[c] || '#ccc',
      borderRadius: 5,
    };
  });
}
  // =================== VẼ CHART ===================
  categoryChart = new Chart(ctx, {
    type: chartType,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 13, weight: 'bold' } }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.parsed;
              return ctx.dataset.label + ': ' + val.toLocaleString('vi-VN') + ' ₫';
            }
          }
        }
      },
      scales: chartType === 'bar'
        ? {
            y: {
              beginAtZero: true,
              stacked: true, 
              ticks: {
                callback: val => val.toLocaleString('vi-VN') + ' ₫',
                font: { size: 13, weight: 'bold' }
              },
              grid: { color: '#eee' }
            },
            x: {
              stacked: true, 
              ticks: { font: { size: 13 } },
              grid: { display: false }
            }
          }
        : {}
    }
  });
}

const confirmModal = $('#confirmModal');
const confirmOk = $('#confirmOk');
const confirmCancel = $('#confirmCancel');
const confirmClose = $('#confirmClose');

const deleteModal = $('#confirmDeleteModal');
const deleteOk = $('#deleteOk');
const deleteCancel = $('#deleteCancel');
const deleteClose = $('#deleteClose');

let deleteIndex = null; 

// --- Hàm show/hide modal ---
function showModal(modal) { modal.classList.remove('modal-hidden'); }
function hideModal(modal) { modal.classList.add('modal-hidden'); }

// --- Xóa tất cả ---
$('#clear-all').addEventListener('click', ()=>{
  if(expenses.length===0) return;
  showModal(confirmModal);
});

confirmOk.addEventListener('click', ()=>{
  expenses = [];
  saveData();
  renderCurrentView();
  showToast('🗑️ Đã xóa tất cả!');
  hideModal(confirmModal);
});

confirmCancel.addEventListener('click', ()=> hideModal(confirmModal));
confirmClose.addEventListener('click', ()=> hideModal(confirmModal));

// --- Xóa từng giao dịch ---
function setupDeleteButtons() {
  document.querySelectorAll('.delete-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      deleteIndex = parseInt(e.target.dataset.index);
      showModal(deleteModal);
    });
  });
}

deleteOk.addEventListener('click', ()=>{
  if(deleteIndex!==null){
    expenses.splice(deleteIndex,1);
    saveData();
    renderCurrentView();
    showToast('🗑️ Đã xóa!');
    deleteIndex = null;
  }
  hideModal(deleteModal);
});

deleteCancel.addEventListener('click', ()=>{
  deleteIndex = null;
  hideModal(deleteModal);
});
deleteClose.addEventListener('click', ()=>{
  deleteIndex = null;
  hideModal(deleteModal);
});

function renderExpensesFiltered(listFiltered) {
  const list = $('#expense-list');
  list.innerHTML = '';
  const filtered = listFiltered.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filtered.length === 0) {
    list.innerHTML = `<li style="text-align:center;color:#888;padding:12px;">💤 Chưa có giao dịch nào</li>`;
    return;
  }

  filtered.forEach(exp => {
    const realIndex = expenses.indexOf(exp);
    const li = document.createElement('li');
    li.setAttribute("data-category", exp.category); 

    li.innerHTML = `
      <div class="top-row">
        <div class="info">
          <strong>${exp.title}</strong><br>${exp.category}
        </div>
        <div class="actions">
          <span class="amount">${exp.amount.toLocaleString('vi-VN')}</span>
          <button class="edit-btn" data-index="${realIndex}">✏️</button>
          <button class="delete-btn" data-index="${realIndex}">🗑️</button>
        </div>
      </div>
      <div class="date">${exp.date}</div>
    `;
    list.appendChild(li);
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = parseInt(e.target.dataset.index);
      const exp = expenses[idx];
      $('#title').value = exp.title;
      $('#amount').value = exp.amount.toLocaleString('vi-VN');
      $('#category').value = exp.category;
      $('#date').value = exp.date;
      $('#note').value = exp.note || '';
      editIndex = idx;
    });
  });
  setupDeleteButtons();
  document.querySelectorAll('#expense-list li').forEach(li => {
    li.addEventListener('click', e => {
      if (e.target.classList.contains('edit-btn') || e.target.classList.contains('delete-btn')) return;

      const realIndex = parseInt(li.querySelector('.delete-btn').dataset.index);
      const exp = expenses[realIndex];
      const noteText = exp.note?.trim() || 'Không có ghi chú nào';
      const imgHTML = exp.photo ? `<img src="${exp.photo}" class="note-photo" alt="photo">` : '';

      noteContent.innerHTML = `
        <div class="note-text">${noteText}</div>
        ${imgHTML}
      `;
      noteModal.classList.remove('modal-hidden');
    });
  });
  updateTop3Expenses(listFiltered);
}

// ========== KHỞI TẠO ==========
$('#date').value = todayISO();
updateLabel();
renderCurrentView();

// --- FILTER CATEGORY ---
const filterBtn = document.getElementById("filter-btn");
const filterDropdown = document.getElementById("filter-dropdown");
const filterSelect = document.getElementById("filter-category");
filterBtn.addEventListener("click", () => {
  filterDropdown.style.display = filterDropdown.style.display === "block" ? "none" : "block";
});
document.addEventListener("click", (e) => {
  if (!filterDropdown.contains(e.target) && !filterBtn.contains(e.target)) {
    filterDropdown.style.display = "none";
  }
});

const overlay = document.getElementById("loading-overlay");

filterSelect.addEventListener("change", () => {
  const selected = filterSelect.value;
  const items = document.querySelectorAll("#expense-list li");
  overlay.classList.remove("hidden");

  setTimeout(() => {
    items.forEach(li => {
      const cat = li.getAttribute("data-category");
      li.hidden = !(selected === "" || cat === selected);
    });

    overlay.classList.add("hidden");
    filterDropdown.style.display = "none";
  }, 500); 
});

const noteModal = document.getElementById('noteModal');
const noteContent = document.getElementById('noteContent');

document.getElementById('noteClose').addEventListener('click', () => {
  noteModal.classList.add('modal-hidden');
});
noteModal.querySelector('.modal-backdrop').addEventListener('click', () => {
  noteModal.classList.add('modal-hidden');
});

window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('splash-screen').style.display = 'none';
      document.querySelector('main.app').style.display = 'block';
    }, 2000);
  });
const photoInput = document.getElementById('photo');
const previewDiv = document.getElementById('photo-preview');

photoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'preview-item';
    wrapper.innerHTML = `
      <img src="${ev.target.result}" alt="preview">
      <button type="button">&times;</button>
    `;
    previewDiv.appendChild(wrapper);

    // nút xoá
    wrapper.querySelector('button').addEventListener('click', () => {
      wrapper.remove();
      photoInput.value = ''; 
    });
  };
  reader.readAsDataURL(file);
});
// ========== PHÓNG TO ẢNH TRONG NOTE ==========
noteContent.addEventListener('click', e => {
  if (e.target.tagName === 'IMG' && e.target.classList.contains('note-photo')) {
    const fullImgModal = document.createElement('div');
    fullImgModal.className = 'fullscreen-img-modal';
    fullImgModal.innerHTML = `
      <div class="backdrop"></div>
      <div class="img-container">
        <img src="${e.target.src}" alt="full photo" class="fullscreen-img">
        <button class="close-full">&times;</button>
      </div>
    `;
    document.body.appendChild(fullImgModal);
    fullImgModal.querySelector('.close-full').addEventListener('click', () => {
      fullImgModal.remove();
    });
  }
});

function updateTop3Expenses(expenses) {
  const top3List = document.getElementById('top3-list');
  top3List.innerHTML = '';

  if (!expenses.length) {
    top3List.innerHTML = '<li style="color:#777;">Chưa có dữ liệu...</li>';
    return;
  }

  const categoryTotals = {};
  expenses.forEach(exp => {
    if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0;
    categoryTotals[exp.category] += exp.amount;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const medals = ['🥇', '🥈', '🥉'];
  const colors = ['#fff3cd', '#e2e3e5', '#f8d7da']; 

  sortedCategories.forEach((cat, i) => {
    const li = document.createElement('li');
    li.style = `
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:8px 10px;
      border-radius:12px;
      margin-bottom:6px;
      font-size:1rem;
      background:${colors[i]};
      box-shadow:0 1px 3px rgba(0,0,0,0.08);
      animation: fadeInUp 0.3s ease ${i * 0.1}s both;
    `;
    li.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:1.2rem;">${medals[i]}</span>
        <span>${cat.category}</span>
      </div>
      <strong style="color:#333;">${cat.total.toLocaleString()} ₫</strong>
    `;
    top3List.appendChild(li);
  });
}
