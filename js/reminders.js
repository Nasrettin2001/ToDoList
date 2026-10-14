// Hatırlatıcı zamanlayıcı: kontrol, bildirim, ses, tekrar hesabı
const Reminders = (() => {
  const CHECK_MS = 15000;
  let hooks = null; // { getTasks, save, onFire } — app.js tarafından verilir
  let timer = null;
  let checking = false;

  // Tekrar kuralına göre bir sonraki zamanı hesaplar (geçmişte kalmayacak şekilde)
  function nextTime(at, repeat) {
    const d = new Date(at);
    const now = Date.now();
    const step = () => {
      switch (repeat) {
        case 'daily': d.setDate(d.getDate() + 1); break;
        case 'weekdays':
          do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
          break;
        case 'weekly': d.setDate(d.getDate() + 7); break;
        case 'monthly': d.setMonth(d.getMonth() + 1); break;
        default: return false;
      }
      return true;
    };
    if (!step()) return null;
    while (d.getTime() <= now) step();
    return d.getTime();
  }

  // Görevin çalması gerekiyorsa hatırlatıcıyı ilerletir ve true döner
  function advanceIfDue(task, now) {
    const r = task.reminder;
    if (!r || task.completed) return false;
    const mainDue = !r.fired && r.at && r.at <= now;
    const snoozeDue = r.snooze && r.snooze <= now;
    if (!mainDue && !snoozeDue) return false;
    if (snoozeDue) delete r.snooze;
    if (mainDue) {
      if (r.repeat && r.repeat !== 'none') r.at = nextTime(r.at, r.repeat);
      else r.fired = true;
    }
    return true;
  }

  async function check() {
    if (!hooks || checking) return;
    checking = true;
    try {
      const now = Date.now();
      for (const t of hooks.getTasks()) {
        if (!advanceIfDue(t, now)) continue;
        await hooks.save(t);
        notify(t);
        hooks.onFire(t);
      }
    } finally {
      checking = false;
    }
  }

  function notify(task) {
    beep();
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const n = new Notification('⏰ Hatırlatıcı', {
        body: task.title,
        tag: task.id,
        requireInteraction: true,
      });
      n.onclick = () => {
        window.focus();
        if (typeof App !== 'undefined') App.openTask(task.id);
        n.close();
      };
    } catch (e) { /* bazı ortamlarda bildirim oluşturulamaz */ }
  }

  function beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      [0, 0.25].forEach((offset) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + offset + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.2);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + offset);
        o.stop(ctx.currentTime + offset + 0.22);
      });
      setTimeout(() => ctx.close(), 800);
    } catch (e) { /* ses çalınamazsa sessiz geç */ }
  }

  async function requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'default') {
      try { return await Notification.requestPermission(); } catch (e) { return 'denied'; }
    }
    return Notification.permission;
  }

  function start(h) {
    hooks = h;
    check();
    clearInterval(timer);
    timer = setInterval(check, CHECK_MS);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) check();
    });
  }

  return { start, check, nextTime, requestPermission, beep };
})();
