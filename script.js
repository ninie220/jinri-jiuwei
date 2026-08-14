const DEFAULT_TASKS = [
  { id: crypto.randomUUID(), text: '起床，喝口水', done: true },
  { id: crypto.randomUUID(), text: '出门走一圈', done: false },
  { id: crypto.randomUUID(), text: '写一段今日总结', done: false },
  { id: crypto.randomUUID(), text: '别熬夜', done: false }
];

const DEFAULT_EXERCISES = [
  { id: crypto.randomUUID(), name: '散步', minutes: 25, date: '2026-08-13' },
  { id: crypto.randomUUID(), name: '拉伸', minutes: 15, date: '2026-08-12' },
  { id: crypto.randomUUID(), name: '跑步', minutes: 35, date: '2026-08-10' }
];

const DEFAULT_BODY = [
  { id: crypto.randomUUID(), weight: 62.5, height: 168, sleep: 7.5, energy: 7, state: '正常', note: '今天状态一般，得多喝水', date: '2026-08-13' },
  { id: crypto.randomUUID(), weight: 62.7, height: 168, sleep: 6.8, energy: 6, state: '疲惫', note: '有点累，但还行', date: '2026-08-12' }
];

const DEFAULT_FOOD = [
  { id: crypto.randomUUID(), breakfast: '牛奶+面包', lunch: '鸡腿饭', dinner: '番茄蛋', date: '2026-08-13' },
  { id: crypto.randomUUID(), breakfast: '粥+鸡蛋', lunch: '沙拉', dinner: '面条', date: '2026-08-12' }
];

const DEFAULT_NOTES = [
  { id: crypto.randomUUID(), text: '今天突然想摆烂，但我还是把东西收拾了一点点，算是胜利。', date: '2026-08-13' },
  { id: crypto.randomUUID(), text: '为什么总想在最累的时候开始自律？我想先休息一下，再认真一点。', date: '2026-08-12' }
];

const DEFAULT_MOODS = [
  { id: crypto.randomUUID(), mood: '焦虑', text: '今天有点烦，脑子里一堆想法，先写下来再继续生活。', date: '2026-08-13' },
  { id: crypto.randomUUID(), mood: '开心', text: '今天吃了好吃的东西，心情还不错。', date: '2026-08-12' }
];

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
    navigator.serviceWorker.register('./service-worker.js').catch((error) => {
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
