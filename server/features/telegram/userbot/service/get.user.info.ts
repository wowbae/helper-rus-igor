// получаем инфо о пользователе

import { userbot } from 'server/init';
import { Api } from 'telegram';
import { NewMessageEvent } from 'telegram/events';

export async function getUserInfo(ctx: NewMessageEvent) {
    const userId = ctx.message.chatId?.toString() || '';
    const users = await userbot.invoke(
        new Api.users.GetUsers({
            id: [userId],
        })
    );

    return users[0];
}

