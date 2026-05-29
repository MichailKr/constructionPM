import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'constructionpm',
  user: 'constructionpm',
  password: 'devpass',
});

try {
  await client.connect();
  console.log('✅ Подключение успешно!');
  await client.end();
} catch (err) {
  // Выводим код ошибки — он всегда на английском
  console.error('❌ Код ошибки:', err.code);
  console.error('❌ Сообщение:', err.message);
  process.exit(1);
}