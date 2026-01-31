import { Role } from '@prisma/client';
import { saveUser } from 'prisma/service/user';
import { NewMessageEvent } from 'telegram/events';

export async function handleCommands(ctx: NewMessageEvent) {
    const chatId = ctx.message.chatId!.toString();
    const text = ctx.message.text;
    const [command, payload] = text.split(' ');

    switch (command) {
        case '/start':
            // сохраняем пользователя, если новый
            saveUser({
                telegramId: chatId,
                firstName: ctx.message.contact?.firstName || '',
                role: Role.user,
            });
            ctx.message.reply({ message: 'Добро пожаловать в бота!' });

            break;
        default:
            ctx.message.reply({ message: 'Unknown command' });
            break;
    }
}
