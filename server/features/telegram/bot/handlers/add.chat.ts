// следим за добавлением в чаты
import { Composer } from 'grammy';
// import { userbot } from 'server/init';
import { Api } from 'telegram';

export const addChatComposer = new Composer();

addChatComposer.on(':new_chat_members:me', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const chatTitle = ctx.chat.title || chatId;
    const userId = ctx.from!.id.toString();
    const firstName = ctx.from!.first_name;

    // ctx.api.sendMessage(userId, `Добро пожаловать в чат ${chatTitle}`);

    // добавляем userbot в этот чат на правах админа, читаем участников и сразу удаляем, удаляем смс о добавлении и удалении
    // const userbotId = (await userbot.getMe()).id;
    // await ctx.api.unbanChatMember(chatId, Number(userbotId), {
        // only_if_banned: true,
    // });

	// получаем ссылку
	// const invite = await ctx.api.createChatInviteLink(chatId);

	// проходим в чат с помощью ссылки
	// await userbot.invoke(
        // new Api.messages.ImportChatInvite({ hash: 'uploadsheet' })
    // );

    // const chatMembers = await ctx.api.getChatMembers(chatId);
    // await ctx.api.deleteChatMessage(chatId, ctx.message!.message_id);

});

// важно чтобы бот был админом, чтобы он мог удалять сообщения
addChatComposer.on("msg:new_chat_members", async (ctx) => {
    ctx.deleteMessage();
});

addChatComposer.on("msg:left_chat_member", async (ctx) => {
    ctx.deleteMessage();
});
