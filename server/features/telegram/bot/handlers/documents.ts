// Управление документами базы знаний через Telegram
import { Composer, InlineKeyboard } from 'grammy';
import { prisma } from 'prisma/client';
import { deleteDocumentFromUpstash } from '../../../ai/knowledge/sync';

// Actions для callback'ов документов
export const Actions_Documents = {
    delete: 'doc_delete',
    confirm_delete: 'doc_confirm_delete',
    cancel_delete: 'doc_cancel_delete',
} as const;

export const documentsComposer = new Composer();

// Команда /delete — показывает список документов для удаления
documentsComposer.command('delete', async (ctx) => {
    const documents = await prisma.document.findMany({
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' },
        take: 20, // ограничение, чтобы не перегружать клавиатуру
    });

    if (!documents.length) {
        return ctx.reply('База знаний пуста.');
    }

    const keyboard = new InlineKeyboard();

    for (const doc of documents) {
        const title =
            doc.title.length > 30 ? doc.title.slice(0, 27) + '...' : doc.title;
        keyboard
            .text(`🗑 ${title}`, `${Actions_Documents.delete}:${doc.id}`)
            .row();
    }

    await ctx.reply('Выберите документ для удаления:', {
        reply_markup: keyboard,
    });
});

// Обработка нажатия на кнопку удаления
documentsComposer.on('callback_query:data', async (ctx, next) => {
    const data = ctx.callbackQuery.data;

    // Проверяем, что это наш callback
    if (!data.startsWith('doc_')) return next();

    const [action, docIdStr] = data.split(':');
    const docId = parseInt(docIdStr, 10);

    switch (action) {
        case Actions_Documents.delete: {
            // Показываем подтверждение
            const doc = await prisma.document.findUnique({
                where: { id: docId },
            });

            if (!doc) {
                await ctx.answerCallbackQuery({ text: 'Документ не найден' });
                return;
            }

            const confirmKeyboard = new InlineKeyboard()
                .text(
                    '✅ Да, удалить',
                    `${Actions_Documents.confirm_delete}:${docId}`
                )
                .text('❌ Отмена', Actions_Documents.cancel_delete);

            await ctx.editMessageText(`Удалить документ "${doc.title}"?`, {
                reply_markup: confirmKeyboard,
            });
            break;
        }

        case Actions_Documents.confirm_delete: {
            try {
                // Удаляем из Prisma
                await prisma.document.delete({ where: { id: docId } });

                // Удаляем из Upstash
                await deleteDocumentFromUpstash(docId);

                await ctx.editMessageText('✅ Документ удалён из базы знаний.');
                await ctx.answerCallbackQuery({ text: 'Удалено' });
            } catch (error) {
                console.error('Ошибка удаления документа:', error);
                await ctx.answerCallbackQuery({
                    text: 'Ошибка при удалении',
                    show_alert: true,
                });
            }
            break;
        }

        case Actions_Documents.cancel_delete: {
            await ctx.editMessageText('Удаление отменено.');
            await ctx.answerCallbackQuery();
            break;
        }
    }
});
