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
function getStartOfWeek(d){
  const date = new Date(d);
  const day = date.getDay();
  const diff = day===0?-6:1-day;
  date.setDate(date.getDate()+diff);
  date.setHours(0,0,0,0);
  return date;
}
function formatWeekLabel(date){
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(start.getDate()+6);
  return `${pad(start.getDate())}/${pad(start.getMonth()+1)} - ${pad(end.getDate())}/${pad(end.getMonth()+1)}`;
}
function getExpensesOfWeek(startDate){
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate()+6);
  return expenses.filter(e=>{
    const d = new Date(e.date);
    return d>=startDate && d<=endDate;
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

  if(!title || isNaN(amount)){ showToast('⚠️ Vui lòng nhập đầy đủ!'); return; }

  if(editIndex!==null){
    expenses[editIndex] = { title, amount, category, date };
    showToast('✏️ Đã chỉnh sửa!');
    editIndex = null;
  } else {
    expenses.push({ title, amount, category, date });
    showToast('✅ Đã thêm!');
  }

  saveData();
  renderCurrentView();
  form.reset();
  $('#date').value = todayISO();
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
  else if(viewMode==='month') currentDate.setMonth(currentDate.getMonth()-1);
  updateLabel();
  renderCurrentView();
});
$('#next-week').addEventListener('click', ()=>{
  if(viewMode==='day') currentDate.setDate(currentDate.getDate()+1);
  else if(viewMode==='week') currentWeekStart.setDate(currentWeekStart.getDate()+7);
  else if(viewMode==='month') currentDate.setMonth(currentDate.getMonth()+1);
  updateLabel();
  renderCurrentView();
});

// ========== UPDATE LABEL ==========
function updateLabel(){
  const label = $('#week-label');
  label.textContent = viewMode==='day'? `${pad(currentDate.getDate())}/${pad(currentDate.getMonth()+1)}/${currentDate.getFullYear()}`
                     : viewMode==='week'? formatWeekLabel(currentWeekStart)
                     : `${pad(currentDate.getMonth()+1)}/${currentDate.getFullYear()}`;
}

// ========== RENDER ==========
function renderCurrentView(){
  if(viewMode==='day') renderDay();
  else if(viewMode==='week') renderWeek();
  else if(viewMode==='month') renderMonth();
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

function renderMonth(){
  const filtered = expenses.filter(e=>{
    const d = new Date(e.date);
    return d.getMonth()===currentDate.getMonth() && d.getFullYear()===currentDate.getFullYear();
  });
  renderExpensesFiltered(filtered);
  updateTotalFiltered(filtered);
  updateChartFiltered(filtered);
}

// ========== RENDER DANH SÁCH ==========
function renderExpensesFiltered(listFiltered){
  const list = $('#expense-list');
  list.innerHTML='';
  const filtered = listFiltered.sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(filtered.length===0){
    list.innerHTML=`<li style="text-align:center;color:#888;padding:12px;">💤 Chưa có giao dịch nào</li>`;
    return;
  }

  filtered.forEach(exp=>{
    const realIndex = expenses.indexOf(exp);
    const li = document.createElement('li');
    li.innerHTML=`
      <div>
        <strong>${exp.title}</strong>
        <small> • ${exp.date}</small>
      </div>
      <div>
        ${exp.amount.toLocaleString('vi-VN')} ₫
        <button class="edit-btn" data-index="${realIndex}">✏️</button>
        <button class="delete-btn" data-index="${realIndex}">🗑️</button>
      </div>
    `;
    list.appendChild(li);
  });

  document.querySelectorAll('.delete-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = parseInt(e.target.dataset.index);
      expenses.splice(idx,1);
      saveData();
      renderCurrentView();
    });
  });

  document.querySelectorAll('.edit-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = parseInt(e.target.dataset.index);
      const exp = expenses[idx];
      $('#title').value = exp.title;
      $('#amount').value = exp.amount.toLocaleString('vi-VN');
      $('#category').value = exp.category;
      $('#date').value = exp.date;
      editIndex = idx;
    });
  });
}

// ========== TỔNG TIỀN ==========
function updateTotalFiltered(listFiltered){
  const total = listFiltered.reduce((sum,e)=>sum+e.amount,0);
  $('#total-amount').textContent = total.toLocaleString('vi-VN') + ' ₫';
}

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
        plugins: {
          legend: { display: true, position: 'bottom' }
        }
      }
    });
    return;
  }

  const categoriesInData = [...new Set(listFiltered.map(e => e.category))];
  const colors = ['#9be1ff', '#f7c9ff', '#E2F0CB', '#ff8c8c', '#c2c8ff'];
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
      backgroundColor: colors.slice(0, categoriesInData.length),
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
        backgroundColor: colors[i % colors.length],
        borderRadius: 5,
        font: { size: 10 }
      };
    });
  // =================== THÁNG ===================
  } else {
    labels = [labelText];
    datasets = categoriesInData.map((c, i) => {
      const total = listFiltered
        .filter(e => e.category === c)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        label: c,
        data: [total],
        backgroundColor: colors[i % colors.length],
        borderRadius: 0
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

function renderExpensesFiltered(listFiltered){
  const list = $('#expense-list');
  list.innerHTML='';
  const filtered = listFiltered.sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(filtered.length===0){
    list.innerHTML=`<li style="text-align:center;color:#888;padding:12px;">💤 Chưa có giao dịch nào</li>`;
    return;
  }

  filtered.forEach(exp=>{
    const realIndex = expenses.indexOf(exp);
    const li = document.createElement('li');
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

  document.querySelectorAll('.edit-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = parseInt(e.target.dataset.index);
      const exp = expenses[idx];
      $('#title').value = exp.title;
      $('#amount').value = exp.amount.toLocaleString('vi-VN');
      $('#category').value = exp.category;
      $('#date').value = exp.date;
      editIndex = idx;
    });
  });

  setupDeleteButtons(); 
}
// ========== KHỞI TẠO ==========
$('#date').value = todayISO();
updateLabel();
renderCurrentView();
