// пример cron задачи
import { sendChatRequest } from 'server/features/ai/chat';
import type { ICronJob } from '../interfaces';
import { RoleAi } from '@prisma/client';
import { bot } from 'server/init';
import { aiModels } from 'server/features/ai/config';


export const socialHooksCronJob: ICronJob = {
    name: 'social-hooks-job',
    // секунды, минуты, часы, день, месяц, день недели
    schedule: '0 0 10 */1 * *',
    enabled: true, // включена по умолчанию
    handler: async () => {

        try {
            const systemPrompt = `Write шт Russian language, ultra-short, high-grip posts for Threads/Twitter about fitness, weight loss, and habit formation using "Atomic Habits" principles. Each post must be 1–3 sentences, strike a core pain point, deliver one micro-solution, and end with "👇🏻". Alternative - just motivation quote from famous people. Target audience: adults 25–40 working office/remote who want to lose 5–15 kg, reclaim energy, and feel control; pains include no time, evening binges, plateaus, and "start-then-quit"; they value simple steps and visible micro-results within 7–14 days. Structure every post as: pain-first hook → one action (reduce friction, +1% progress, anchor to an existing routine) → a specific felt benefit + "👇🏻" at the end. Tone and format: plain, concrete, zero fluff, no hashtags; analysis and link go in the first comment.`;
            const userPrompt =
                'Напиши 5 постов для Threads/Twitter, избегай банальных советов и тем, ищи реальные лайфхаки.';

            const hooks = await sendChatRequest(
                [
                    { role: RoleAi.system, content: systemPrompt },
                    { role: RoleAi.user, content: userPrompt },
                ],
                aiModels.gpt5Nano
            );

            console.log('🔍 hooks: ', hooks);

            const splittedByLines = hooks.split('\n\n');
            for (const line of splittedByLines) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }


        } catch (error) {
            // проверяем тип ошибки
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            // если ошибка связана с балансом, логируем и пропускаем выполнение
            if (
                errorMessage.includes('insufficient_balance_error') ||
                errorMessage.includes('balance is too low')
            ) {
                console.warn(
                    '⚠️  Cron job "social-hooks-job" пропущен: недостаточный баланс API'
                );
                return; // выходим без ошибки, чтобы задача не считалась проваленной
            }

            // для других ошибок пробрасываем дальше
            throw error;
        }
    },
};
