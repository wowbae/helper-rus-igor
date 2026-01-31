import { Composer } from 'grammy';
import { triggers, type TriggerKeys } from './triggers';
import { runAgentWithHistory } from '../../../ai/agent';

export const textComposer = new Composer();
textComposer.on('message:text', async (ctx, next) => {
    const chatId = ctx.chatId.toString();
    const userId = ctx.from?.id.toString();
    const text = ctx.message.text;
    const isCommand = text.startsWith('/');
    const trigger = Object.keys(triggers).find((key) =>
        triggers[key].includes(ctx.message.text)
    ) as TriggerKeys;

    if (trigger || isCommand || ctx.chat.type !== 'private') {
        // обработает другой и читаем только в личке
        return next();
    }

    if (!userId) return;

    console.log(`handle simple text from ${chatId}`);

    // показываем индикатор набора текста 5 секунд 
    await ctx.replyWithChatAction('typing');

    try {
        // запускаем агента с сохранением истории
        const response = await runAgentWithHistory(text, { userId });
        
        // Пытаемся отправить с Markdown, если ошибка - отправляем без форматирования
        try {
            await ctx.reply(response, { parse_mode: 'Markdown' });
        } catch {
            // Markdown невалидный - отправляем как есть
            await ctx.reply(response);
        }
    } catch (error) {
        console.error('Ошибка агента:', error);
        await ctx.reply('Произошла ошибка при обработке запроса. Попробуйте позже.');
    }
});
