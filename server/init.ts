// express server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerRoutes } from './routes';
import { startUserBot } from './features/telegram/userbot/init';
import { Bot } from 'grammy';
import { handlers } from './features/telegram/bot/handlers/export';
import { initKnowledgeBase } from './features/ai/knowledge/sync';
import { prisma } from 'prisma/client';


dotenv.config();

export const app = express();

// middleware
app.use(express.json());
app.use(cors());


// регистрация маршрутов, если будут сюда их добавлять
registerRoutes(app, []);

// запуск сервера
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Обработка ошибок сервера
server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    } else {
        console.error('Server error:', error);
        process.exit(1);
    }
});

// Обработка сигналов завершения для корректного освобождения порта
function gracefulShutdown(signal: string) {
    console.log(`\n${signal} received, shutting down gracefully...`);
    server.close(() => {
        console.log('Server closed, port is now free');
        Promise.all([
            // userbot.disconnect().catch(console.error), // GramJS
            bot.stop().catch(console.error), // grammY
        ]).finally(() => {
            process.exit(0); // или просто завершить если все дисконнекты прошли
        });
    });

    // Принудительное завершение через 10 секунд, если сервер не закрылся
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// запуск юзер бота
// export const { userbot, telegram: userbotTelegram } = await startUserBot();
// if (!userbot) {
    // console.log('Клиент бота не получен');
// }

// запуск юзер бота
export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// регистрируем обработчики, ПОРЯДОК ВАЖЕН
handlers.map((h) => bot.use(h));

await bot.start({
    drop_pending_updates: true, // удалить накопившиеся апдейты на стороне Telegram
    onStart: (me) => {
        console.log(`✅ Bot @${me.username} is running`);
    },
});

// Инициализация базы знаний агента при старте сервера
async function initAgent() {
    try {
        // Получаем или создаём активного агента
        let agent = await prisma.agentConfig.findFirst({
            where: { isActive: true },
        });

        if (!agent) {
            // Создаём агента по умолчанию если нет
            agent = await prisma.agentConfig.create({
                data: {
                    name: 'Помощник',
                    systemPrompt:
                        'Ты умный ассистент. Используй базу знаний для ответов на вопросы пользователя. Отвечай на том же языке, на котором задан вопрос.',
                    model: 'gpt-4o-mini',
                    temperature: 0.7,
                    isActive: true,
                },
            });
            console.log('📝 Создан агент по умолчанию');
        }

        // Инициализируем базу знаний (загрузка файлов + синхронизация с Upstash)
        if (process.env.SYNC_KNOWLEDGE_ON_START !== 'false') {
            await initKnowledgeBase(agent.id);
        }
    } catch (error) {
        console.error('Ошибка инициализации агента:', error);
    }
}

initAgent();
