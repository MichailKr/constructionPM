// test-socket.js — Тест-клиент для Socket.io
import { io } from 'socket.io-client';

// Читаем аргументы: токен и проект
const [TOKEN, PROJECT_ID] = process.argv.slice(2);

if (!TOKEN) {
  console.error('❌ Usage: node test-socket.js YOUR_JWT_TOKEN [PROJECT_ID]');
  process.exit(1);
}

console.log('🔌 Connecting to socket.io...');
console.log(`   Token: ${TOKEN.slice(0, 20)}...`);
console.log(`   Project: ${PROJECT_ID || 'not specified'}`);

const socket = io('http://localhost:4000', {
  auth: { token: TOKEN },
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5
});

// ✅ Подключение
socket.on('connect', () => {
  console.log('✅ Connected to server!');

  // Если указан проект — подписываемся
  if (PROJECT_ID) {
    socket.emit('subscribe:project', PROJECT_ID, (err) => {
      if (err) {
        console.log('❌ Subscribe error:', err);
      } else {
        console.log(`✅ Subscribed to project: ${PROJECT_ID}`);
        console.log('📡 Listening for events...\n');
      }
    });
  }
});

// 🔔 Слушаем события
socket.on('task:updated', (data) => {
  console.log('📋 [task:updated]', data.message);
  console.log('   Data:', data.data);
});

socket.on('task:status_changed', (data) => {
  console.log('🔄 [task:status_changed]', data.message);
  console.log('   New status:', data.data?.newStatus);
});

socket.on('team:assigned', (data) => {
  console.log('👥 [team:assigned]', data.message);
  console.log('   Team:', data.data?.teamName);
});

socket.on('equipment:requested', (data) => {
  console.log('🚜 [equipment:requested]', data.message);
  console.log('   Equipment:', data.data?.equipmentId);
});

socket.on('deadline:approaching', (data) => {
  console.log('⏰ [deadline:approaching]', data.message);
  console.log('   Days left:', data.data?.daysLeft);
});

socket.on('notification:deadline', (data) => {
  console.log('🔔 [notification:deadline]', data.message);
});

// ❌ Ошибки
socket.on('connect_error', (err) => {
  console.log('❌ Connection error:', err.message);
  if (err.message === 'Authentication error') {
    console.log('💡 Check your JWT token — maybe expired?');
  }
  process.exit(1);
});

socket.on('error', (err) => {
  console.log('❌ Socket error:', err);
});

// 🔄 Переподключение
socket.on('reconnect', (attempt) => {
  console.log(`🔁 Reconnected (attempt #${attempt})`);
});

// 🛑 Завершение
process.on('SIGINT', () => {
  console.log('\n👋 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});