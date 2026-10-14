// İş Listesi — arayüz, durum ve olaylar
const App = (() => {
  // ---------- Durum ----------
  const state = {
    tasks: [],
    view: 'all',
    tag: null,
    search: '',
    sort: lsGet('isListesi.sort') || 'due',
    selectedId: null,
  };
  const VIEW_TITLES = { today: 'Bugün', upcoming: 'Yaklaşan (7 gün)', overdue: 'Gecikmiş', all: 'Tümü', done: 'Tamamlanan' };
  const PRIO_NAMES = ['Düşük', 'Normal', 'Yüksek', 'Acil'];
  const EMPTY_TEXTS = {
    today: 'Bugün için görev yok. Keyfine bak ☕',
    upcoming: 'Önümüzdeki 7 gün boş görünüyor.',
    overdue: 'Geciken görev yok, harika! 🎉',
    all: 'Henüz görev yok. Yukarıdan ilk görevini ekle.',
    done: 'Tamamlanan görev yok.',
  };
  const objectUrls = new Map(); // imageId -> objectURL (açık detay için)
  let saveTimer = null;

  const $ = (id) => document.getElementById(id);

  // ---------- Yardımcılar ----------
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* yok say */ } }

  function el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children) if (c != null) e.append(c);
    return e;
  }

  const pad = (n) => String(n).padStart(2, '0');
  function dateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function todayStr() { return dateStr(new Date()); }
  function addDays(str, n) { const d = new Date(str + 'T00:00'); d.setDate(d.getDate() + n); return dateStr(d); }
  function toLocalInput(ms) { const d = new Date(ms); return `${dateStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
  function fromLocalInput(v) { const t = new Date(v).getTime(); return isNaN(t) ? null : t; }
  const lower = (s) => (s || '').toLocaleLowerCase('tr');

  function fmtDay(str) {
    const d = new Date(str + 'T00:00');
    const opts = { day: 'numeric', month: 'short' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('tr-TR', opts);
  }
  function fmtDue(due) {
    const t = todayStr();
    if (due === t) return { text: 'Bugün', cls: 'today' };
    if (due === addDays(t, 1)) return { text: 'Yarın', cls: '' };
    if (due < t) return { text: 'Gecikti · ' + fmtDay(due), cls: 'overdue' };
    return { text: fmtDay(due), cls: '' };
  }
  function fmtDateTime(ms) {
    const d = new Date(ms);
    const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const day = dateStr(d);
    if (day === todayStr()) return 'Bugün ' + time;
    if (day === addDays(todayStr(), 1)) return 'Yarın ' + time;
    return fmtDay(day) + ' ' + time;
  }
  // Hatırlatıcının bir sonraki çalacağı zaman (yoksa null)
  function nextReminder(t) {
    const r = t.reminder;
    if (!r || t.completed) return null;
    const times = [];
    if (!r.fired && r.at) times.push(r.at);
    if (r.snooze) times.push(r.snooze);
    return times.length ? Math.min(...times) : null;
  }

  const current = () => state.tasks.find((t) => t.id === state.selectedId) || null;

  // ---------- Kayıt ----------
  async function persist(task) {
    task.updatedAt = Date.now();
    await DB.tasks.put(task);
  }
  function scheduleSave(task) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveTimer = null; persist(task); renderSidebarAndList(); }, 400);
  }
  function flushSave() {
    if (!saveTimer) return;
    clearTimeout(saveTimer);
    saveTimer = null;
    const t = current();
    if (t) persist(t);
  }
  async function saveNow(task) {
    clearTimeout(saveTimer);
    saveTimer = null;
    await persist(task);
    renderSidebarAndList();
    renderDetailMeta();
  }

  function newTask(title) {
    const now = Date.now();
    return {
      id: uid('t'), title, notes: '', priority: 1, tags: [], dueDate: null, reminder: null,
      subtasks: [], imageIds: [], completed: false, completedAt: null, createdAt: now, updatedAt: now,
    };
  }

  // ---------- Filtreleme / sıralama ----------
  function inView(t, view) {
    const today = todayStr();
    const rem = nextReminder(t);
    const remDay = rem ? dateStr(new Date(rem)) : null;
    switch (view) {
      case 'done': return t.completed;
      case 'all': return !t.completed;
      case 'today': return !t.completed && ((t.dueDate && t.dueDate <= today) || remDay === today);
      case 'upcoming': {
        const end = addDays(today, 7);
        const inRange = (d) => d && d > today && d <= end;
        return !t.completed && (inRange(t.dueDate) || inRange(remDay));
      }
      case 'overdue': return !t.completed && t.dueDate && t.dueDate < today;
    }
    return false;
  }
  function matchesSearch(t, q) {
    if (!q) return true;
    return [t.title, t.notes, ...t.tags, ...t.subtasks.map((s) => s.text)].some((s) => lower(s).includes(q));
  }
  function sortTasks(list) {
    if (state.view === 'done') return list.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    const byDue = (a, b) => (a.dueDate || '9999') .localeCompare(b.dueDate || '9999');
    const byPrio = (a, b) => b.priority - a.priority;
    const byCreated = (a, b) => b.createdAt - a.createdAt;
    const chains = { due: [byDue, byPrio, byCreated], priority: [byPrio, byDue, byCreated], created: [byCreated] };
    const chain = chains[state.sort] || chains.due;
    return list.sort((a, b) => { for (const f of chain) { const r = f(a, b); if (r) return r; } return 0; });
  }
  function visibleTasks() {
    const q = lower(state.search.trim());
    return sortTasks(state.tasks.filter((t) =>
      inView(t, state.view) && (!state.tag || t.tags.includes(state.tag)) && matchesSearch(t, q)));
  }

  // ---------- Çizim ----------
  function render() {
    renderSidebarAndList();
    renderDetail();
  }
  function renderSidebarAndList() {
    renderSidebar();
    renderList();
  }

  function renderSidebar() {
    document.querySelectorAll('#views .nav-item').forEach((b) => {
      const v = b.dataset.view;
      b.classList.toggle('active', !state.tag && state.view === v);
      const n = state.tasks.filter((t) => inView(t, v)).length;
      b.querySelector('b').textContent = n && v !== 'done' ? n : '';
    });
    const counts = new Map();
    state.tasks.filter((t) => !t.completed).forEach((t) => t.tags.forEach((g) => counts.set(g, (counts.get(g) || 0) + 1)));
    const list = $('tagList');
    list.replaceChildren();
    [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'tr')).forEach(([tag, n]) => {
      list.append(el('button', {
        class: 'nav-item' + (state.tag === tag ? ' active' : ''),
        onclick: () => setTag(state.tag === tag ? null : tag),
      }, el('span', { text: '#' + tag }), el('b', { text: n })));
    });
    if (!counts.size) list.append(el('div', { class: 'nav-item', style: 'color:var(--muted);cursor:default', text: 'Henüz etiket yok' }));
  }

  function renderList() {
    $('viewTitle').textContent = VIEW_TITLES[state.view];
    const af = $('activeFilter');
    af.hidden = !state.tag;
    if (state.tag) af.textContent = '#' + state.tag + '  ✕';

    const tasks = visibleTasks();
    const ul = $('taskList');
    ul.replaceChildren(...tasks.map(taskRow));
    const empty = $('empty');
    empty.hidden = tasks.length > 0;
    if (!tasks.length) empty.textContent = state.search ? 'Aramayla eşleşen görev yok.' : (state.tag ? 'Bu etikette görev yok.' : EMPTY_TEXTS[state.view]);
  }

  function taskRow(t) {
    const meta = el('div', { class: 't-meta' });
    if (t.dueDate) { const d = fmtDue(t.dueDate); meta.append(el('span', { class: t.completed ? '' : d.cls, text: '📅 ' + d.text })); }
    const rem = nextReminder(t);
    if (rem) meta.append(el('span', { text: '🔔 ' + fmtDateTime(rem) + (t.reminder.repeat !== 'none' ? ' ↻' : '') }));
    if (t.priority >= 2) meta.append(el('span', { style: `color:var(--p${t.priority})`, text: PRIO_NAMES[t.priority] }));
    if (t.subtasks.length) meta.append(el('span', { text: '☑ ' + t.subtasks.filter((s) => s.done).length + '/' + t.subtasks.length }));
    if (t.imageIds.length) meta.append(el('span', { text: '📎 ' + t.imageIds.length }));
    if (t.notes.trim()) meta.append(el('span', { title: 'Not var', text: '📝' }));
    t.tags.forEach((g) => meta.append(el('span', {
      class: 'tag', text: '#' + g,
      onclick: (e) => { e.stopPropagation(); setTag(g); },
    })));

    const cb = el('input', { type: 'checkbox', 'aria-label': 'Tamamlandı', onclick: (e) => e.stopPropagation(), onchange: () => toggleComplete(t) });
    cb.checked = t.completed;

    return el('li', {
      class: 'task' + (t.completed ? ' completed' : '') + (t.id === state.selectedId ? ' selected' : ''),
      style: `--prio: var(--p${t.priority})`,
      onclick: () => openTask(t.id),
    },
    el('label', { class: 'check', onclick: (e) => e.stopPropagation() }, cb, el('span')),
    el('div', { class: 't-body' }, el('div', { class: 't-title', text: t.title }), meta.childNodes.length ? meta : null));
  }

  // ---------- Detay paneli ----------
  function openTask(id) {
    if (state.selectedId !== id) flushSave();
    state.selectedId = id;
    renderList();
    renderDetail();
  }
  function closeDetail() {
    flushSave();
    state.selectedId = null;
    renderList();
    renderDetail();
  }

  function renderDetail() {
    const t = current();
    $('detail').hidden = !t;
    if (!t) { releaseImageUrls(); return; }
    $('dCompleted').checked = t.completed;
    $('dTitle').value = t.title;
    $('dPriority').value = String(t.priority);
    $('dDue').value = t.dueDate || '';
    $('dNotes').value = t.notes;
    renderReminderFields();
    renderTags();
    renderSubtasks();
    renderImages();
    renderDetailMeta();
  }
  function renderReminderFields() {
    const t = current();
    if (!t) return;
    const r = t.reminder;
    $('dReminder').value = r && r.at ? toLocalInput(r.at) : '';
    $('dRepeat').value = r ? r.repeat : 'none';
  }
  function renderDetailMeta() {
    const t = current();
    if (!t) return;
    const parts = ['Oluşturuldu: ' + new Date(t.createdAt).toLocaleString('tr-TR')];
    if (t.completed && t.completedAt) parts.push('Tamamlandı: ' + new Date(t.completedAt).toLocaleString('tr-TR'));
    if (t.reminder && t.reminder.snooze) parts.push('Ertelendi: ' + fmtDateTime(t.reminder.snooze));
    if (t.reminder && t.reminder.fired && !t.reminder.snooze) parts.push('Hatırlatıcı çaldı');
    $('dMeta').textContent = parts.join(' · ');
  }
  function renderTags() {
    const t = current();
    const box = $('dTags');
    box.querySelectorAll('.tag').forEach((n) => n.remove());
    const input = $('dTagInput');
    t.tags.forEach((g) => box.insertBefore(el('span', { class: 'tag' }, '#' + g,
      el('button', { type: 'button', title: 'Kaldır', text: '✕', onclick: () => { t.tags = t.tags.filter((x) => x !== g); renderTags(); saveNow(t); } })), input));
  }
  function renderSubtasks() {
    const t = current();
    const ul = $('dSubtasks');
    ul.replaceChildren(...t.subtasks.map((s) => {
      const cb = el('input', { type: 'checkbox', onchange: () => { s.done = cb.checked; renderSubtasks(); saveNow(t); } });
      cb.checked = s.done;
      const text = el('span', { class: 's-text', text: s.text, title: 'Düzenlemek için çift tıkla' });
      text.addEventListener('dblclick', () => {
        const v = prompt('Alt görevi düzenle', s.text);
        if (v != null && v.trim()) { s.text = v.trim(); renderSubtasks(); saveNow(t); }
      });
      return el('li', { class: s.done ? 'done' : '' },
        el('label', { class: 'check' }, cb, el('span')), text,
        el('button', { class: 's-del', title: 'Sil', text: '✕', onclick: () => { t.subtasks = t.subtasks.filter((x) => x !== s); renderSubtasks(); saveNow(t); } }));
    }));
    const done = t.subtasks.filter((s) => s.done).length;
    $('dSubProgress').textContent = t.subtasks.length ? `(${done}/${t.subtasks.length})` : '';
  }

  // ---------- Resimler ----------
  function releaseImageUrls() {
    objectUrls.forEach((u) => URL.revokeObjectURL(u));
    objectUrls.clear();
  }
  async function renderImages() {
    const t = current();
    const box = $('dImages');
    const taskId = t.id;
    const imgs = await Promise.all(t.imageIds.map((id) => DB.images.get(id)));
    if (state.selectedId !== taskId) return; // bu arada başka göreve geçildi
    // Artık gösterilmeyen URL'leri bırak
    for (const [id, u] of objectUrls) if (!t.imageIds.includes(id)) { URL.revokeObjectURL(u); objectUrls.delete(id); }
    box.replaceChildren(...imgs.filter(Boolean).map((img) => {
      if (!objectUrls.has(img.id)) objectUrls.set(img.id, URL.createObjectURL(img.blob));
      const url = objectUrls.get(img.id);
      return el('div', { class: 'thumb' },
        el('img', { src: url, alt: img.name, title: img.name, onclick: () => openLightbox(url) }),
        el('button', { type: 'button', title: 'Resmi sil', text: '✕', onclick: () => removeImage(t, img.id) }));
    }));
  }

  // Büyük resimleri en uzun kenarı 1920 px olacak şekilde küçültür
  function resizeImage(file, max = 1920) {
    return new Promise((resolve) => {
      if (/gif|svg/.test(file.type)) { resolve(file); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        if (scale === 1) { resolve(file); return; }
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        c.toBlob((b) => resolve(b || file), type, 0.88);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  async function addImages(files) {
    const t = current();
    if (!t) return;
    const images = [...files].filter((f) => f.type.startsWith('image/'));
    if (!images.length) { toast('Yalnızca resim dosyaları eklenebilir.'); return; }
    for (const f of images) {
      const blob = await resizeImage(f);
      const rec = { id: uid('i'), taskId: t.id, name: f.name || 'yapistirilan-resim.png', type: blob.type || f.type, blob, createdAt: Date.now() };
      await DB.images.put(rec);
      t.imageIds.push(rec.id);
    }
    await saveNow(t);
    renderImages();
    toast(images.length === 1 ? 'Resim eklendi.' : images.length + ' resim eklendi.');
  }
  async function removeImage(t, imageId) {
    if (!confirm('Bu resim silinsin mi?')) return;
    await DB.images.del(imageId);
    t.imageIds = t.imageIds.filter((x) => x !== imageId);
    await saveNow(t);
    renderImages();
  }

  function openLightbox(url) { $('lightboxImg').src = url; $('lightbox').hidden = false; }
  function closeLightbox() { $('lightbox').hidden = true; $('lightboxImg').removeAttribute('src'); }

  // ---------- Eylemler ----------
  async function addTask(title) {
    const t = newTask(title);
    if (state.view === 'today') t.dueDate = todayStr();
    if (state.view === 'upcoming') t.dueDate = addDays(todayStr(), 1);
    if (state.tag) t.tags.push(state.tag);
    state.tasks.push(t);
    await persist(t);
    if (state.view === 'done' || state.view === 'overdue') setView('all');
    else renderSidebarAndList();
  }

  async function toggleComplete(t, value = !t.completed) {
    t.completed = value;
    t.completedAt = value ? Date.now() : null;
    await persist(t);
    render();
    if (value) toast('Görev tamamlandı 👍', 'Geri al', () => toggleComplete(t, false));
  }

  async function deleteTask(t) {
    flushSave();
    const images = await DB.deleteTaskWithImages(t.id);
    state.tasks = state.tasks.filter((x) => x.id !== t.id);
    if (state.selectedId === t.id) state.selectedId = null;
    render();
    toast('Görev silindi.', 'Geri al', async () => {
      for (const img of images) await DB.images.put(img);
      await DB.tasks.put(t);
      state.tasks.push(t);
      render();
    });
  }

  function setView(v) {
    state.view = v;
    state.tag = null;
    renderSidebarAndList();
  }
  function setTag(tag) {
    state.tag = tag;
    if (tag && state.view === 'done') state.view = 'all';
    renderSidebarAndList();
  }

  async function setReminder(t, at) {
    if (at == null) {
      t.reminder = null;
    } else {
      t.reminder = { at, repeat: $('dRepeat').value || 'none', fired: false };
      const perm = await Reminders.requestPermission();
      if (perm === 'denied') toast('Masaüstü bildirimleri kapalı; uyarı sayfa içinde görünecek.');
      if (at <= Date.now()) toast('Geçmiş bir zaman seçildi, hatırlatıcı hemen çalacak.');
    }
    renderReminderFields();
    await saveNow(t);
    Reminders.check();
  }

  function quickReminderTime(kind) {
    const d = new Date();
    if (kind === '1h') { d.setHours(d.getHours() + 1, d.getMinutes(), 0, 0); return d.getTime(); }
    if (kind === 'tomorrow') { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.getTime(); }
    if (kind === 'monday') {
      const add = ((8 - d.getDay()) % 7) || 7;
      d.setDate(d.getDate() + add);
      d.setHours(9, 0, 0, 0);
      return d.getTime();
    }
    return null;
  }

  // ---------- Hatırlatıcı uyarı kartı ----------
  function showReminderAlert(t) {
    const box = $('alerts');
    box.querySelector(`[data-task="${t.id}"]`)?.remove();
    const card = el('div', { class: 'alert', 'data-task': t.id });
    const close = () => card.remove();
    const snooze = async (ms) => {
      const live = state.tasks.find((x) => x.id === t.id);
      if (!live) return close();
      if (!live.reminder) live.reminder = { at: null, repeat: 'none', fired: true };
      live.reminder.snooze = ms;
      await persist(live);
      render();
      toast('Ertelendi: ' + fmtDateTime(ms));
      close();
    };
    card.append(
      el('div', { class: 'alert-title', text: '⏰ Hatırlatıcı' }),
      el('div', { class: 'alert-text', text: t.title, title: 'Görevi aç', onclick: () => { openTask(t.id); close(); } }),
      el('div', { class: 'alert-actions' },
        el('button', { class: 'chip', text: '10 dk ertele', onclick: () => snooze(Date.now() + 10 * 60000) }),
        el('button', { class: 'chip', text: '1 saat ertele', onclick: () => snooze(Date.now() + 60 * 60000) }),
        el('button', { class: 'chip', text: 'Yarın 09:00', onclick: () => snooze(quickReminderTime('tomorrow')) }),
        el('button', { class: 'chip', text: '✓ Tamamla', onclick: () => { const live = state.tasks.find((x) => x.id === t.id); if (live) toggleComplete(live, true); close(); } }),
        el('button', { class: 'chip ghost', text: 'Kapat', onclick: close })));
    box.append(card);
  }

  function onReminderFired(t) {
    showReminderAlert(t);
    renderSidebarAndList();
    if (state.selectedId === t.id) { renderReminderFields(); renderDetailMeta(); }
  }

  // ---------- Bildirimler (toast) ----------
  function toast(text, actionText, action) {
    const box = $('toasts');
    const item = el('div', { class: 'toast' }, el('span', { text }));
    let timer = setTimeout(() => item.remove(), actionText ? 5000 : 2600);
    if (actionText) item.append(el('button', { text: actionText, onclick: () => { clearTimeout(timer); item.remove(); action(); } }));
    box.append(item);
    while (box.children.length > 3) box.firstChild.remove();
  }

  function showModal(title, body) {
    $('modalTitle').textContent = title;
    $('modalBody').replaceChildren(body);
    $('modal').hidden = false;
    $('modalOk').focus();
  }

  // ---------- Tema ----------
  function applyThemeButton() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    $('themeBtn').textContent = dark ? '☀' : '☾';
    $('themeBtn').title = (dark ? 'Açık moda geç' : 'Karanlık moda geç') + ' (T)';
  }
  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    lsSet('isListesi.theme', next);
    applyThemeButton();
  }

  // ---------- Yedekleme ----------
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }
  function dataUrlToBlob(dataUrl) {
    const [head, b64] = dataUrl.split(',');
    const type = (head.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type });
  }

  async function exportBackup() {
    flushSave();
    const images = await DB.images.all();
    const data = {
      app: 'is-listesi', version: 1, exportedAt: new Date().toISOString(),
      tasks: state.tasks,
      images: await Promise.all(images.map(async (i) => ({
        id: i.id, taskId: i.taskId, name: i.name, type: i.type, createdAt: i.createdAt, dataUrl: await blobToDataUrl(i.blob),
      }))),
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `is-listesi-yedek-${todayStr()}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(`Yedek indirildi (${data.tasks.length} görev, ${data.images.length} resim).`);
  }

  async function importBackup(file) {
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'is-listesi' || !Array.isArray(data.tasks)) throw new Error('format');
      if (!confirm(`${data.tasks.length} görev içe aktarılacak. Aynı kimlikli görevlerin üzerine yazılacak. Devam edilsin mi?`)) return;
      for (const i of data.images || []) {
        await DB.images.put({ id: i.id, taskId: i.taskId, name: i.name, type: i.type, createdAt: i.createdAt, blob: dataUrlToBlob(i.dataUrl) });
      }
      for (const t of data.tasks) await DB.tasks.put(normalizeTask(t));
      state.tasks = (await DB.tasks.all()).map(normalizeTask);
      render();
      toast('Yedek içe aktarıldı.');
    } catch (e) {
      alert('Yedek dosyası okunamadı. Bu uygulamadan alınmış bir .json yedeği seçtiğinden emin ol.');
    }
  }

  // Eksik alanları tamamlar (eski/yarım kayıtlar için)
  function normalizeTask(t) {
    return Object.assign(newTask(t.title || 'Adsız görev'), t, {
      tags: Array.isArray(t.tags) ? t.tags : [],
      subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
      imageIds: Array.isArray(t.imageIds) ? t.imageIds : [],
      notes: t.notes || '',
    });
  }

  function shortcutsBody() {
    const rows = [['N', 'Yeni görev'], ['/', 'Ara'], ['Esc', 'Paneli / pencereyi kapat'], ['T', 'Tema değiştir'], ['Ctrl + V', 'Açık göreve resim yapıştır']];
    return el('table', {}, ...rows.map(([k, v]) => el('tr', {}, el('td', {}, el('kbd', { text: k })), el('td', { text: v }))));
  }

  // ---------- Olaylar ----------
  function bindEvents() {
    $('quickAdd').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('quickTitle').value.trim();
      if (!v) return;
      $('quickTitle').value = '';
      addTask(v);
    });

    $('search').addEventListener('input', (e) => { state.search = e.target.value; renderList(); });
    $('sort').value = state.sort;
    $('sort').addEventListener('change', (e) => { state.sort = e.target.value; lsSet('isListesi.sort', state.sort); renderList(); });
    $('themeBtn').addEventListener('click', toggleTheme);
    $('views').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); });
    $('activeFilter').addEventListener('click', () => setTag(null));

    // Menü
    $('menuBtn').addEventListener('click', (e) => { e.stopPropagation(); $('menu').hidden = !$('menu').hidden; });
    document.addEventListener('click', () => { $('menu').hidden = true; });
    $('menu').addEventListener('click', async (e) => {
      const a = e.target.closest('[data-action]')?.dataset.action;
      if (a === 'export') exportBackup();
      if (a === 'import') $('importFile').click();
      if (a === 'shortcuts') showModal('Klavye kısayolları', shortcutsBody());
      if (a === 'notify') {
        const p = await Reminders.requestPermission();
        const msg = { granted: 'Masaüstü bildirimleri açık ✅', denied: 'Bildirimler engellenmiş. Adres çubuğundaki kilit / bilgi simgesinden "Bildirimler"e izin verebilirsin. Engelli olsa da hatırlatıcılar sayfa içinde ve sesli olarak çalışır.', unsupported: 'Bu tarayıcı masaüstü bildirimlerini desteklemiyor.' }[p] || 'Bildirim izni henüz verilmedi.';
        showModal('Bildirim izni', el('p', { text: msg }));
        if (p === 'granted') Reminders.beep();
      }
    });
    $('importFile').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) importBackup(f); e.target.value = ''; });
    $('modalOk').addEventListener('click', () => { $('modal').hidden = true; });
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') $('modal').hidden = true; });

    // Detay alanları
    $('dClose').addEventListener('click', closeDetail);
    $('dCompleted').addEventListener('change', (e) => { const t = current(); if (t) toggleComplete(t, e.target.checked); });
    $('dTitle').addEventListener('input', (e) => { const t = current(); if (!t) return; t.title = e.target.value.trim() || 'Adsız görev'; scheduleSave(t); });
    $('dNotes').addEventListener('input', (e) => { const t = current(); if (!t) return; t.notes = e.target.value; scheduleSave(t); });
    $('dPriority').addEventListener('change', (e) => { const t = current(); if (!t) return; t.priority = Number(e.target.value); saveNow(t); });
    $('dDue').addEventListener('change', (e) => { const t = current(); if (!t) return; t.dueDate = e.target.value || null; saveNow(t); });
    $('dReminder').addEventListener('change', (e) => { const t = current(); if (t) setReminder(t, e.target.value ? fromLocalInput(e.target.value) : null); });
    $('dRepeat').addEventListener('change', (e) => {
      const t = current();
      if (!t) return;
      if (!t.reminder || !t.reminder.at) { toast('Önce bir hatırlatıcı zamanı seç.'); e.target.value = 'none'; return; }
      t.reminder.repeat = e.target.value;
      if (t.reminder.repeat !== 'none' && t.reminder.fired) {
        t.reminder.fired = false;
        t.reminder.at = Reminders.nextTime(t.reminder.at, t.reminder.repeat);
        renderReminderFields();
      }
      saveNow(t);
    });
    document.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => {
      const t = current();
      if (t) setReminder(t, quickReminderTime(b.dataset.quick));
    }));

    $('dTagInput').addEventListener('keydown', (e) => {
      const t = current();
      if (!t) return;
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const v = lower(e.target.value.trim().replace(/^#/, '').replace(/\s+/g, '-'));
        if (v && !t.tags.includes(v)) { t.tags.push(v); renderTags(); saveNow(t); }
        e.target.value = '';
      } else if (e.key === 'Backspace' && !e.target.value && t.tags.length) {
        t.tags.pop(); renderTags(); saveNow(t);
      }
    });
    $('dSubInput').addEventListener('keydown', (e) => {
      const t = current();
      if (!t || e.key !== 'Enter') return;
      e.preventDefault();
      const v = e.target.value.trim();
      if (!v) return;
      t.subtasks.push({ id: uid('s'), text: v, done: false });
      e.target.value = '';
      renderSubtasks();
      saveNow(t);
    });
    $('dDelete').addEventListener('click', () => {
      const t = current();
      if (t && confirm(`"${t.title}" silinsin mi?`)) deleteTask(t);
    });

    // Resimler: dosya seç, sürükle-bırak, yapıştır
    $('dAddImage').addEventListener('click', () => $('dImageFile').click());
    $('dImageFile').addEventListener('change', (e) => { addImages(e.target.files); e.target.value = ''; });
    const dz = $('dropZone');
    const detail = $('detail');
    detail.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); dz.classList.add('over'); } });
    detail.addEventListener('dragleave', (e) => { if (!detail.contains(e.relatedTarget)) dz.classList.remove('over'); });
    detail.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer.files.length) addImages(e.dataTransfer.files); });
    // Panel dışına bırakılan dosyanın tarayıcıda açılmasını engelle
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());
    document.addEventListener('paste', (e) => {
      if (!current()) return;
      const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
      if (!files.length) return;
      e.preventDefault();
      addImages(files);
    });

    $('lbClose').addEventListener('click', closeLightbox);
    $('lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') closeLightbox(); });

    // Klavye kısayolları
    document.addEventListener('keydown', (e) => {
      const typing = e.target.closest('input, textarea, select, [contenteditable]');
      if (e.key === 'Escape') {
        if (!$('lightbox').hidden) return closeLightbox();
        if (!$('modal').hidden) { $('modal').hidden = true; return; }
        if (!$('menu').hidden) { $('menu').hidden = true; return; }
        if (typing && e.target.id === 'search' && e.target.value) return; // aramayı tarayıcı temizler
        if (typing) { e.target.blur(); return; }
        if (current()) closeDetail();
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); $('quickTitle').focus(); }
      else if (e.key === '/') { e.preventDefault(); $('search').focus(); }
      else if (e.key === 't' || e.key === 'T') toggleTheme();
    });

    // Gece yarısı geçince "Bugün/Gecikmiş" doğru kalsın
    let lastDay = todayStr();
    setInterval(() => { if (todayStr() !== lastDay) { lastDay = todayStr(); renderSidebarAndList(); } }, 60000);
    window.addEventListener('beforeunload', flushSave);
  }

  // ---------- Başlat ----------
  async function init() {
    applyThemeButton();
    try {
      await DB.open();
      state.tasks = (await DB.tasks.all()).map(normalizeTask);
    } catch (e) {
      document.querySelector('.main').replaceChildren(el('div', { class: 'empty', text: 'Veritabanı açılamadı: ' + e.message + ' — Gizli pencere kullanıyorsan normal pencerede aç.' }));
      return;
    }
    bindEvents();
    render();
    Reminders.start({ getTasks: () => state.tasks, save: persist, onFire: onReminderFired });
  }

  document.addEventListener('DOMContentLoaded', init);
  return { openTask };
})();
