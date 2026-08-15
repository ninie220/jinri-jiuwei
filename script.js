const DEFAULT_TASKS = [];

const DEFAULT_EXERCISES = [];

const DEFAULT_BODY = [];

const DEFAULT_FOOD = [];

const DEFAULT_NOTES = [];

const DEFAULT_MOODS = [];

const storageKeys = {
  tasks: 'jim-task-list',
  exercises: 'jim-exercises',
  body: 'jim-body-log',
  food: 'jim-food-log',
  notes: 'jim-note-log',
  mood: 'jim-mood-log',
  moodChoice: 'jim-mood-choice'
};

let deferredPrompt = null;

const state = {
  tasks: loadData(storageKeys.tasks, DEFAULT_TASKS),
  exercises: loadData(storageKeys.exercises, DEFAULT_EXERCISES),
  body: loadData(storageKeys.body, DEFAULT_BODY),
  food: loadData(storageKeys.food, DEFAULT_FOOD),
  notes: loadData(storageKeys.notes, DEFAULT_NOTES),
  mood: loadData(storageKeys.mood, DEFAULT_MOODS),
  selectedMood: loadData(storageKeys.moodChoice, '开心')
};

function updateLastSavedText() {
  const label = document.getElementById('lastSavedLabel');
  if (!label) return;

  const now = new Date();
  label.textContent = `最近保存：${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
}

function showToast(message = '已保存') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1500);
}

function exportLocalData() {
  const exportData = {
    tasks: state.tasks,
    exercises: state.exercises,
    body: state.body,
    food: state.food,
    notes: state.notes,
    mood: state.mood,
    selectedMood: state.selectedMood,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `今日就位-数据-${formatDate(new Date())}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('本地数据已导出');
}

function clearAllLocalData() {
  const confirmed = window.confirm('确定要清空本地数据吗？会删除所有记录。');
  if (!confirmed) return;

  Object.entries(storageKeys).forEach(([keyName, keyValue]) => {
    localStorage.removeItem(keyValue);
  });

  state.tasks = [];
  state.exercises = [];
  state.body = [];
  state.food = [];
  state.notes = [];
  state.mood = [];
  state.selectedMood = '开心';

  saveData(storageKeys.tasks, state.tasks);
  saveData(storageKeys.exercises, state.exercises);
  saveData(storageKeys.body, state.body);
  saveData(storageKeys.food, state.food);
  saveData(storageKeys.notes, state.notes);
  saveData(storageKeys.mood, state.mood);
  saveData(storageKeys.moodChoice, state.selectedMood);

  renderPlan();
  renderExercises();
  renderBody();
  renderFood();
  renderNotes();
  renderMood();
  setMoodSelection(state.selectedMood);
  showToast('本地数据已清空');
}

const today = new Date();
const dateLabel = document.getElementById('todayDate');
if (dateLabel) {
  dateLabel.textContent = formatDate(today);
}

const navButtons = document.querySelectorAll('.nav-item');
navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    navButtons.forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('.page').forEach((page) => {
      page.classList.toggle('active', page.id === button.dataset.page);
    });
  });
});

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  updateLastSavedText();
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function renderPlan() {
  const tasks = state.tasks;
  const done = tasks.filter((task) => task.done).length;
  const total = tasks.length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const doneCount = document.getElementById('doneCount');
  const taskTotal = document.getElementById('taskTotal');
  const weekCount = document.getElementById('weekCount');

  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressText) progressText.textContent = `${percent}%`;
  if (doneCount) doneCount.textContent = String(done);
  if (taskTotal) taskTotal.textContent = String(total);
  if (weekCount) weekCount.textContent = `${Math.min(4, done + 1)}/7`;

  const taskList = document.getElementById('taskList');
  if (!taskList) return;

  taskList.innerHTML = tasks
    .map(
      (task) => `
        <li class="task-item ${task.done ? 'done' : ''}" data-id="${task.id}">
          <div class="task-main">
            <button class="check-toggle" data-action="toggle" data-id="${task.id}">${task.done ? '✓' : ''}</button>
            <span class="task-text">${task.text}</span>
          </div>
          <div class="task-actions">
            <button class="icon-btn" data-action="delete" data-id="${task.id}">删</button>
          </div>
        </li>
      `
    )
    .join('');
}

function addTask() {
  const input = document.getElementById('taskInput');
  const value = input.value.trim();
  if (!value) return;

  state.tasks.push({ id: crypto.randomUUID(), text: value, done: false });
  saveData(storageKeys.tasks, state.tasks);
  input.value = '';
  renderPlan();
  showToast('任务已加上');
}

function toggleTask(id) {
  state.tasks = state.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task);
  saveData(storageKeys.tasks, state.tasks);
  renderPlan();
  showToast('任务状态更新了');
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  saveData(storageKeys.tasks, state.tasks);
  renderPlan();
  showToast('任务已删除');
}

document.getElementById('addTaskBtn')?.addEventListener('click', addTask);
document.getElementById('taskInput')?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') addTask();
});

document.getElementById('taskList')?.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;
  const id = target.dataset.id;
  const action = target.dataset.action;
  if (action === 'toggle') toggleTask(id);
  if (action === 'delete') deleteTask(id);
});

function deleteExercise(id) {
  state.exercises = state.exercises.filter((item) => item.id !== id);
  saveData(storageKeys.exercises, state.exercises);
  renderExercises();
}

function deleteBodyRecord(id) {
  state.body = state.body.filter((item) => item.id !== id);
  saveData(storageKeys.body, state.body);
  renderBody();
}

function deleteFoodRecord(id) {
  state.food = state.food.filter((item) => item.id !== id);
  saveData(storageKeys.food, state.food);
  renderFood();
}

function deleteNoteRecord(id) {
  state.notes = state.notes.filter((item) => item.id !== id);
  saveData(storageKeys.notes, state.notes);
  renderNotes();
}

function deleteMoodRecord(id) {
  state.mood = state.mood.filter((item) => item.id !== id);
  saveData(storageKeys.mood, state.mood);
  renderMood();
}

function renderExerciseStats() {
  const container = document.getElementById('exerciseStats');
  if (!container) return;

  const totalMinutes = state.exercises.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  const sessions = state.exercises.length;
  const avgMinutes = sessions ? Math.round(totalMinutes / sessions) : 0;

  container.innerHTML = `
    <div class="mini-stat">
      <span>累计运动</span>
      <strong>${totalMinutes} 分钟</strong>
    </div>
    <div class="mini-stat">
      <span>记录次数</span>
      <strong>${sessions} 次</strong>
    </div>
    <div class="mini-stat">
      <span>平均时长</span>
      <strong>${avgMinutes} 分钟</strong>
    </div>
  `;
}

function renderExercises() {
  const list = document.getElementById('exerciseList');
  if (!list) return;

  list.innerHTML = state.exercises
    .slice()
    .reverse()
    .map(
      (item) => `
        <li class="record-item">
          <div class="record-main">
            <span class="check-toggle">🏃</span>
            <div class="record-text">
              <strong>${item.name}</strong>
              <div class="note-meta">${item.minutes} 分钟 · ${item.date}</div>
            </div>
          </div>
        </li>
      `
    )
    .join('');

  renderExerciseStats();
}

function addExercise() {
  const name = document.getElementById('exerciseName').value.trim();
  const minutes = Number(document.getElementById('exerciseMinutes').value);
  if (!name || !minutes) return;

  state.exercises.push({ id: crypto.randomUUID(), name, minutes, date: formatDate(new Date()) });
  saveData(storageKeys.exercises, state.exercises);
  document.getElementById('exerciseName').value = '';
  document.getElementById('exerciseMinutes').value = '';
  renderExercises();
  showToast('运动打卡成功');
}

document.getElementById('addExerciseBtn')?.addEventListener('click', addExercise);

document.getElementById('exerciseList')?.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.action === 'delete-exercise') {
    deleteExercise(target.dataset.id);
  }
});

function renderBodyStats() {
  const container = document.getElementById('bodyStats');
  if (!container) return;

  const weights = state.body.map((item) => Number(item.weight || 0)).filter(Boolean);
  const sleeps = state.body.map((item) => Number(item.sleep || 0)).filter(Boolean);
  const energies = state.body.map((item) => Number(item.energy || 0)).filter(Boolean);

  const latestWeight = weights.at(-1) || 0;
  const avgSleep = sleeps.length ? (sleeps.reduce((sum, value) => sum + value, 0) / sleeps.length).toFixed(1) : '0.0';
  const avgEnergy = energies.length ? (energies.reduce((sum, value) => sum + value, 0) / energies.length).toFixed(1) : '0.0';

  container.innerHTML = `
    <div class="mini-stat">
      <span>最近体重</span>
      <strong>${latestWeight ? `${latestWeight} kg` : '--'}</strong>
    </div>
    <div class="mini-stat">
      <span>平均睡眠</span>
      <strong>${avgSleep} 小时</strong>
    </div>
    <div class="mini-stat">
      <span>平均能量</span>
      <strong>${avgEnergy}/10</strong>
    </div>
  `;
}

function renderBody() {
  const list = document.getElementById('bodyList');
  if (!list) return;

  list.innerHTML = state.body
    .slice()
    .reverse()
    .map(
      (item) => `
        <li class="record-item">
          <div class="record-main">
            <span class="check-toggle">📏</span>
            <div class="record-text">
              <strong>${item.weight || '--'} kg</strong>
              <div class="note-meta">身高 ${item.height || '--'} cm · 睡眠 ${item.sleep || '--'} 小时 · 状态 ${item.state || '正常'} · 能量 ${item.energy || '--'}/10</div>
              <div class="note-meta">${item.note || '没备注'}</div>
              <div class="note-meta">${item.date}</div>
            </div>
          </div>
          <div class="record-actions">
            <button class="icon-btn" data-action="delete-body" data-id="${item.id}">删</button>
          </div>
        </li>
      `
    )
    .join('');

  renderBodyStats();
}

function addBody() {
  const weight = Number(document.getElementById('weightInput').value);
  const height = Number(document.getElementById('heightInput').value);
  const sleep = Number(document.getElementById('sleepInput').value);
  const energy = Number(document.getElementById('energyInput').value);
  const bodyState = document.getElementById('bodyStateInput').value.trim();
  const note = document.getElementById('bodyNote').value.trim();

  if (!weight && !height && !sleep && !energy && !bodyState) return;

  state.body.push({
    id: crypto.randomUUID(),
    weight: weight || 0,
    height: height || 0,
    sleep: sleep || 0,
    energy: energy || 0,
    state: bodyState || '正常',
    note: note || '今日还不错。',
    date: formatDate(new Date())
  });
  saveData(storageKeys.body, state.body);
  document.getElementById('weightInput').value = '';
  document.getElementById('heightInput').value = '';
  document.getElementById('sleepInput').value = '';
  document.getElementById('energyInput').value = '';
  document.getElementById('bodyStateInput').value = '正常';
  document.getElementById('bodyNote').value = '';
  renderBody();
  showToast('身体状态已记录');
}

document.getElementById('addBodyBtn')?.addEventListener('click', addBody);
document.getElementById('bodyList')?.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.action === 'delete-body') {
    deleteBodyRecord(target.dataset.id);
  }
});

function renderFoodStats() {
  const container = document.getElementById('foodStats');
  if (!container) return;

  const totalMeals = state.food.reduce((sum, item) => sum + [item.breakfast, item.lunch, item.dinner].filter(Boolean).length, 0);
  const breakfastCount = state.food.filter((item) => item.breakfast).length;
  const lunchCount = state.food.filter((item) => item.lunch).length;
  const dinnerCount = state.food.filter((item) => item.dinner).length;

  container.innerHTML = `
    <div class="mini-stat">
      <span>总记录</span>
      <strong>${state.food.length} 天</strong>
    </div>
    <div class="mini-stat">
      <span>三餐合计</span>
      <strong>${totalMeals} 次</strong>
    </div>
    <div class="mini-stat">
      <span>早餐/午餐/晚餐</span>
      <strong>${breakfastCount}/${lunchCount}/${dinnerCount}</strong>
    </div>
  `;
}

function renderFood() {
  const list = document.getElementById('foodList');
  if (!list) return;

  list.innerHTML = state.food
    .slice()
    .reverse()
    .map(
      (item) => `
        <li class="record-item">
          <div class="record-main">
            <span class="check-toggle">🍱</span>
            <div class="record-text">
              <strong>${item.date}</strong>
              <div class="note-meta">早餐：${item.breakfast || '没记'} | 午餐：${item.lunch || '没记'} | 晚餐：${item.dinner || '没记'}</div>
            </div>
          </div>
          <div class="record-actions">
            <button class="icon-btn" data-action="delete-food" data-id="${item.id}">删</button>
          </div>
        </li>
      `
    )
    .join('');

  renderFoodStats();
}

function addFood() {
  const breakfast = document.getElementById('breakfastInput').value.trim();
  const lunch = document.getElementById('lunchInput').value.trim();
  const dinner = document.getElementById('dinnerInput').value.trim();

  if (!breakfast && !lunch && !dinner) return;

  state.food.push({
    id: crypto.randomUUID(),
    breakfast,
    lunch,
    dinner,
    date: formatDate(new Date())
  });
  saveData(storageKeys.food, state.food);
  document.getElementById('breakfastInput').value = '';
  document.getElementById('lunchInput').value = '';
  document.getElementById('dinnerInput').value = '';
  renderFood();
  showToast('饮食记录已保存');
}

document.getElementById('addFoodBtn')?.addEventListener('click', addFood);
document.getElementById('foodList')?.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.action === 'delete-food') {
    deleteFoodRecord(target.dataset.id);
  }
});

function renderNotesStats() {
  const container = document.getElementById('notesStats');
  if (!container) return;

  const total = state.notes.length;
  const longest = state.notes.reduce((max, note) => Math.max(max, note.text.length), 0);
  const average = total ? Math.round(state.notes.reduce((sum, note) => sum + note.text.length, 0) / total) : 0;

  container.innerHTML = `
    <div class="mini-stat">
      <span>碎碎念数</span>
      <strong>${total} 条</strong>
    </div>
    <div class="mini-stat">
      <span>最长记录</span>
      <strong>${longest} 字</strong>
    </div>
    <div class="mini-stat">
      <span>平均长度</span>
      <strong>${average} 字</strong>
    </div>
  `;
}

function renderNotes() {
  const list = document.getElementById('noteList');
  if (!list) return;

  list.innerHTML = state.notes
    .slice()
    .reverse()
    .map(
      (item) => `
        <li class="note-item">
          <div class="note-text">
            <div>${item.text}</div>
            <div class="note-meta">${item.date}</div>
          </div>
          <div class="record-actions">
            <button class="icon-btn" data-action="delete-note" data-id="${item.id}">删</button>
          </div>
        </li>
      `
    )
    .join('');

  renderNotesStats();
}

function addNote() {
  const value = document.getElementById('noteInput').value.trim();
  if (!value) return;

  state.notes.push({ id: crypto.randomUUID(), text: value, date: formatDate(new Date()) });
  saveData(storageKeys.notes, state.notes);
  document.getElementById('noteInput').value = '';
  renderNotes();
  showToast('碎碎念已记下');
}

document.getElementById('addNoteBtn')?.addEventListener('click', addNote);
document.getElementById('noteList')?.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.action === 'delete-note') {
    deleteNoteRecord(target.dataset.id);
  }
});

function renderMoodStats() {
  const container = document.getElementById('moodStats');
  if (!container) return;

  const counts = state.mood.reduce((acc, item) => {
    acc[item.mood] = (acc[item.mood] || 0) + 1;
    return acc;
  }, {});

  const topMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  container.innerHTML = `
    <div class="mini-stat">
      <span>总记录</span>
      <strong>${state.mood.length} 条</strong>
    </div>
    <div class="mini-stat">
      <span>最多情绪</span>
      <strong>${topMood ? topMood[0] : '暂无'}</strong>
    </div>
    <div class="mini-stat">
      <span>出现次数</span>
      <strong>${topMood ? topMood[1] : 0} 次</strong>
    </div>
  `;
}

function renderMood() {
  const list = document.getElementById('moodList');
  if (!list) return;

  list.innerHTML = state.mood
    .slice()
    .reverse()
    .map(
      (item) => `
        <li class="record-item">
          <div class="record-main">
            <span class="check-toggle">💭</span>
            <div class="record-text">
              <strong>${item.mood}</strong>
              <div class="note-meta">${item.date}</div>
              <div class="note-meta">${item.text}</div>
            </div>
          </div>
          <div class="record-actions">
            <button class="icon-btn" data-action="delete-mood" data-id="${item.id}">删</button>
          </div>
        </li>
      `
    )
    .join('');

  renderMoodStats();
}

function setMoodSelection(mood) {
  state.selectedMood = mood;
  saveData(storageKeys.moodChoice, mood);
  document.querySelectorAll('.mood-select').forEach((button) => {
    button.classList.toggle('active', button.dataset.mood === mood);
  });
}

document.querySelectorAll('.mood-select').forEach((button) => {
  button.addEventListener('click', () => setMoodSelection(button.dataset.mood));
});

function addMood() {
  const text = document.getElementById('moodInput').value.trim();
  if (!text) return;

  state.mood.push({ id: crypto.randomUUID(), mood: state.selectedMood, text, date: formatDate(new Date()) });
  saveData(storageKeys.mood, state.mood);
  document.getElementById('moodInput').value = '';
  renderMood();
  showToast('情绪日记已保存');
}

document.getElementById('addMoodBtn')?.addEventListener('click', addMood);
document.getElementById('moodList')?.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.action === 'delete-mood') {
    deleteMoodRecord(target.dataset.id);
  }
});

document.getElementById('exportBtn')?.addEventListener('click', exportLocalData);
document.getElementById('clearBtn')?.addEventListener('click', clearAllLocalData);

const installBtn = document.getElementById('installBtn');

function updateOnlineStatus() {
  const label = document.getElementById('onlineStatus');
  if (!label) return;

  const online = navigator.onLine;
  label.textContent = online ? '在线' : '离线';
  label.classList.toggle('online', online);
  label.classList.toggle('offline', !online);
}

function handleInstallPrompt() {
  if (!installBtn) return;

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      showToast('该浏览器已处理安装，或可在菜单中选择“添加到主屏幕”');
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.add('hidden');
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  if (installBtn) {
    installBtn.classList.remove('hidden');
  }
});

window.addEventListener('appinstalled', () => {
  if (installBtn) {
    installBtn.classList.add('hidden');
  }
  showToast('已安装到桌面/主屏幕');
  document.body.classList.add('is-installed');
});

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // updateViaCache: 'none' 让浏览器每次都检查 service-worker.js 是否有更新，
    // 否则 GitHub Pages 的 10 分钟 HTTP 缓存会让手机迟迟发现不了新版本
    navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}

if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
  document.body.classList.add('is-installed');
}

handleInstallPrompt();
updateLastSavedText();
updateOnlineStatus();

renderPlan();
renderExercises();
renderBody();
renderFood();
renderNotes();
renderMood();
setMoodSelection(state.selectedMood);
