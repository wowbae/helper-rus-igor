// AI Агент с tool calling для RAG
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { customOpenAI } from './provider';
import { knowledgeIndex } from './knowledge/search';
import { prisma } from 'prisma/client';

// Опции для запуска агента
interface AgentOptions {
    userId: string;
    agentConfigId?: number;
}

// Результат поиска в базе знаний
interface SearchResult {
    title: string | undefined;
    text: string | undefined;
    score: number;
}

// Запуск агента с контекстом из базы знаний
export async function runAgent(
    prompt: string,
    options: AgentOptions
): Promise<string> {
    // Загрузка конфига агента из БД
    const agentConfig = await prisma.agentConfig.findFirst({
        where: options.agentConfigId
            ? { id: options.agentConfigId }
            : { isActive: true },
    });

    const systemPrompt =
        agentConfig?.systemPrompt ||
        'Ты умный ассистент. Используй базу знаний для ответов на вопросы пользователя.';

    const { text } = await generateText({
        model: customOpenAI(agentConfig?.model || 'gpt-4o-mini'),
        system: systemPrompt,
        prompt,
        maxSteps: 10,
        tools: {
            searchKnowledge: tool({
                description:
                    'Поиск информации в базе знаний. Используй этот инструмент когда нужно найти информацию о продукте, услугах, FAQ или другие данные.',
                parameters: z.object({
                    query: z
                        .string()
                        .describe('Поисковый запрос на естественном языке'),
                    limit: z
                        .number()
                        .optional()
                        .default(5)
                        .describe('Количество результатов'),
                }),
                execute: async ({ query, limit = 5 }): Promise<string | SearchResult[]> => {
                    const results = await knowledgeIndex.search({
                        query,
                        limit,
                        reranking: true,
                    });

                    if (!results.length) {
                        return 'Информация по запросу не найдена в базе знаний.';
                    }

                    return results.map((hit) => ({
                        title: hit.content?.title,
                        text: hit.content?.text.slice(0, 500),
                        score: hit.score,
                    }));
                },
            }),
        },
    });

    return text;
}

// Запуск агента с сохранением истории сообщений
export async function runAgentWithHistory(
    prompt: string,
    options: AgentOptions
): Promise<string> {
    // Сохраняем входящее сообщение пользователя
    await prisma.message.create({
        data: {
            userId: options.userId,
            role: 'user',
            content: prompt,
        },
    });

    // Получаем ответ от агента
    const response = await runAgent(prompt, options);

    // Сохраняем ответ агента
    await prisma.message.create({
        data: {
            userId: options.userId,
            role: 'assistant',
            content: response,
        },
    });

    return response;
}
