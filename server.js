const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8080 });

let tasks = [{ id: 1, title: 'Приклад завдання', status: 'new' }];
let nextId = 2;
const STATUSES = ['new', 'in_progress', 'done'];

const send = (ws, obj) => ws.readyState === 1 && ws.send(JSON.stringify(obj));
const broadcast = (obj) => wss.clients.forEach((c) => send(c, obj));

wss.on('connection', (ws) => {
  console.log('Клієнт підключився. Усього клієнтів:', wss.clients.size);

  ws.on('message', (raw) => {
    console.log('Отримано:', raw.toString());
    let msg;
    try { msg = JSON.parse(raw); }
    catch { return send(ws, { type: 'error', message: 'Некоректний JSON' }); }

    switch (msg.action) {
      case 'get_tasks':
        send(ws, { type: 'tasks', data: tasks });
        break;
      case 'add_task':
        if (!msg.title || !msg.title.trim())
          return send(ws, { type: 'error', message: 'Порожня назва завдання' });
        tasks.push({ id: nextId++, title: msg.title.trim(), status: 'new' });
        broadcast({ type: 'tasks', data: tasks });   // усім клієнтам
        break;
      case 'update_status': {
        const t = tasks.find((x) => x.id === msg.id);
        if (!t) return send(ws, { type: 'error', message: 'Завдання не знайдено' });
        if (!STATUSES.includes(msg.status))
          return send(ws, { type: 'error', message: 'Невірний статус' });
        t.status = msg.status;
        broadcast({ type: 'tasks', data: tasks });   // усім клієнтам
        break;
      }
      default:
        send(ws, { type: 'error', message: 'Невідома операція' });
    }
  });

  ws.on('close', () => console.log('Клієнт відключився. Залишилось:', wss.clients.size));
});

console.log('WebSocket-сервер запущено: ws://localhost:8080');