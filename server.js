const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Настройка статических файлов
app.use(express.static(path.join(__dirname)));

// Обработка корневого маршрута
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API ключ для API-Football
const API_KEY = '1d1ee6a0b58d0f24b90e3f001988723f';

// Кэш для хранения данных
let matchesCache = {};
let lastUpdateTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Конфигурация Telegram бота
const TELEGRAM_BOT_TOKEN = '8053353316:AAGk7ZvU1xvQJvntsUT80C8FyVuATLceXtE';
const TELEGRAM_CHAT_ID = '945092277'; // Ваш Chat ID

// Инициализация бота
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// Функция отправки уведомления в Telegram
async function sendTelegramNotification(bookingData) {
  try {
    const message = `
🆕 Новая бронь!
👤 Имя: ${bookingData.name}
📱 Телефон: ${bookingData.phone}
📅 Дата: ${new Date(bookingData.date).toLocaleString('ru-RU')}
👥 Количество гостей: ${bookingData.guests}
    `;

    await bot.sendMessage(TELEGRAM_CHAT_ID, message);
    console.log('Уведомление успешно отправлено в Telegram');
  } catch (error) {
    console.error('Ошибка при отправке уведомления в Telegram:', error);
    throw error;
  }
}

// Функция для получения данных о матчах
async function fetchMatches(leagueId) {
  try {
    // Получаем текущую дату и дату через неделю
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Форматируем даты в нужном формате
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    const fromDate = formatDate(today);
    const toDate = formatDate(nextWeek);

    console.log(`Запрос матчей для лиги ${leagueId}:`, {
      from: fromDate,
      to: toDate
    });

    // Получаем матчи
    const response = await axios.get(`https://v3.football.api-sports.io/fixtures`, {
      params: {
        league: leagueId,
        season: 2023,
        from: fromDate,
        to: toDate,
        timezone: 'Europe/Moscow'
      },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY
      }
    });

    console.log('API Response Status:', response.status);
    console.log('API Response Data:', response.data);

    if (response.data && response.data.response) {
      console.log('API response has data.response');
      const matches = response.data.response.map(match => ({
        strEvent: `${match.teams.home.name} vs ${match.teams.away.name}`,
        dateEvent: match.fixture.date.split('T')[0],
        strTime: match.fixture.date.split('T')[1].slice(0, 5),
        status: match.fixture.status.short,
        score: match.goals.home !== null ? `${match.goals.home} - ${match.goals.away}` : null,
        venue: match.fixture.venue.name
      }));

      console.log(`Найдено ${matches.length} матчей для лиги ${leagueId}`);

      // Если нет матчей, возвращаем тестовые данные
      if (matches.length === 0) {
        console.log('API returned 0 matches. Returning test data.');
        console.log('Возвращаем тестовые данные для лиги', leagueId);
        return [
          {
            strEvent: "Тестовый матч 1",
            dateEvent: fromDate,
            strTime: "15:00",
            status: "NS",
            score: null,
            venue: "Тестовый стадион 1"
          },
          {
            strEvent: "Тестовый матч 2",
            dateEvent: fromDate,
            strTime: "18:00",
            status: "NS",
            score: null,
            venue: "Тестовый стадион 2"
          }
        ];
      }

      return matches;
    }
    return [];
  } catch (error) {
    console.error('Ошибка при получении данных:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });

    // В случае ошибки возвращаем тестовые данные
    console.log('Возвращаем тестовые данные из-за ошибки');
    return [
      {
        strEvent: "Тестовый матч 1",
        dateEvent: new Date().toISOString().split('T')[0],
        strTime: "15:00",
        status: "NS",
        score: null,
        venue: "Тестовый стадион 1"
      },
      {
        strEvent: "Тестовый матч 2",
        dateEvent: new Date().toISOString().split('T')[0],
        strTime: "18:00",
        status: "NS",
        score: null,
        venue: "Тестовый стадион 2"
      }
    ];
  }
}

// Функция обновления кэша
async function updateCache() {
  const now = Date.now();
  if (lastUpdateTime && now - lastUpdateTime < CACHE_DURATION) {
    console.log('Используем кэшированные данные');
    return;
  }

  try {
    // ID лиг в API-Football
    const leagues = {
      39: 'Английская Премьер-лига',
      140: 'Испанская Ла Лига',
      135: 'Итальянская Серия А',
      78: 'Немецкая Бундеслига',
      61: 'Французская Лига 1'
    };

    console.log('Начинаем обновление кэша...');

    for (const [leagueId, leagueName] of Object.entries(leagues)) {
      console.log(`Загрузка данных для лиги ${leagueName} (ID: ${leagueId})...`);
      const matches = await fetchMatches(leagueId);
      if (matches !== null) {
        matchesCache[leagueId] = {
          name: leagueName,
          matches: matches
        };
        console.log(`Данные для лиги ${leagueName} успешно загружены`);
      }
    }

    lastUpdateTime = now;
    console.log('Кэш успешно обновлен');
  } catch (error) {
    console.error('Ошибка при обновлении кэша:', error.message);
  }
}

// Запускаем обновление кэша каждые 5 минут
setInterval(updateCache, CACHE_DURATION);

// Инициализация кэша при запуске
updateCache();

app.get('/api/sports', async (req, res) => {
  const leagueId = req.query.id;
  console.log(`Запрос данных для лиги ID: ${leagueId}`);

  // Обновляем кэш перед каждым запросом
  await updateCache();

  const leagueData = matchesCache[leagueId];

  if (!leagueData) {
    console.log(`Нет данных для лиги ID: ${leagueId}`);
    return res.status(404).json({
      error: 'Данные о матчах временно недоступны'
    });
  }

  console.log(`Отправляем данные для лиги ID: ${leagueId}`, {
    name: leagueData.name,
    matchesCount: leagueData.matches.length
  });

  return res.json({
    name: leagueData.name,
    events: leagueData.matches
  });
});

// Новый маршрут для обработки бронирования
app.post('/api/send-booking', async (req, res) => {
  try {
    const { name, phone, date, guests } = req.body;

    // Формируем сообщение для Telegram
    const message = `
🆕 Новое бронирование!
👤 Имя: ${name}
📱 Телефон: ${phone}
📅 Дата: ${date}
👥 Гости: ${guests}
    `;

    // Отправляем уведомление в Telegram
    await bot.sendMessage(TELEGRAM_CHAT_ID, message);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при отправке бронирования:', error);
    res.status(500).json({ error: 'Ошибка при отправке бронирования' });
  }
});

// Новый маршрут для обработки заказа
app.post('/api/send-order', async (req, res) => {
  try {
    const { items, total, table, comment } = req.body;

    // Формируем сообщение для Telegram
    let message = `
🛒 Новый заказ!
📋 Столик: ${table}
💰 Итого: ${total}
📝 Комментарий: ${comment || 'Нет'}

Товары:
`;

    // Добавляем информацию о товарах
    items.forEach(item => {
      message += `- ${item.name} x${item.quantity} (${item.price * item.quantity}Р)\n`;
    });

    // Отправляем уведомление в Telegram
    await bot.sendMessage(TELEGRAM_CHAT_ID, message);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при отправке заказа:', error);
    res.status(500).json({ error: 'Ошибка при отправке заказа' });
  }
});

// Обработка ошибки 404
app.use((req, res) => {
  console.log(`404 - Не найден путь: ${req.path}`);
  res.status(404).json({ error: 'Страница не найдена' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log(`Откройте http://localhost:${port} в браузере`);
}); 