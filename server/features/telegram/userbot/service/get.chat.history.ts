import { userbot } from 'server/init';
import { Api } from 'telegram';
import { BigInteger } from 'big-integer';

export async function getChatHistoryFromTelegram(chatId: string, accessHash: Number = 0) {
    const bigIntChatId = BigInt(chatId); // встроенный bigint
    const chatIdForApi = bigIntChatId as unknown as BigInteger;

    const history = await userbot.invoke(
        new Api.messages.GetHistory({
            peer: new Api.InputPeerUser({
                userId: chatIdForApi,
                accessHash: accessHash as unknown as BigInteger,
            }),
            offsetId: 0,
            addOffset: 0,
            limit: 20,
            maxId: 0,
            minId: 0,
            // hash: 0n, // hash здесь не нужен, важно для каналов
        })
    );

    return history;
}
