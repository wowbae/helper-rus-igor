import { userbot } from 'server/init';

export function test() {
    userbot.sendMessage('wowbae', { message: 'test' });
}
