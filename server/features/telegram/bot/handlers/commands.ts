import { saveUser } from 'prisma/service/user';
import { Role } from '@prisma/client';
import { Composer, InlineKeyboard } from 'grammy';

import { Actions_NewTask } from './callback';
import { prisma } from 'prisma/client';
import { DateTime } from 'luxon';
import { INewTaskButtonConfig } from '../service/keyboards/interfaces.keyboard';
import { buildKeyboard_NewTask } from '../service/keyboards/build.keyboards';
import { projectListMap } from '../maps';

export const commandsComposer = new Composer();

// начало работы с ботом
commandsComposer.command('start', async (ctx) => {
    saveUser({
        telegramId: ctx.from?.id.toString() || '',
        firstName: ctx.from?.first_name || '',
        role: Role.user,
    });
    ctx.reply('Добро пожаловать, чем могу помочь?');
});
