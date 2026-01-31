import { prisma } from 'prisma/client';
import { Role } from '@prisma/client';


export interface newUser {
    telegramId: string;
    firstName: string;
    role: Role;
}

// надо добавить новое сообщение к имеющимся в массиве
export async function saveUser(info: newUser) {
    const telegramId = info.telegramId || '';

    await prisma.user.upsert({
        where: {
            telegramId,
        },
        update: {
            // @ts-ignore, тут точно есть firstName
            firstName: info.firstName || '',
        },
        create: {
            telegramId,
            role: info.role || Role.user,
            createdAt: new Date(),
            // @ts-ignore, тут точно есть firstName
            firstName: info.firstName || '',
        },
    });
}
