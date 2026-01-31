// AI Агент с tool calling для RAG (pgvector)
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { customOpenAI } from './provider';
import { searchKnowledge, type SearchResult } from './knowledge/search';
import { prisma } from 'prisma/client';
import { getModelName, type AiModelKey } from './config';

// Опции для запуска агента
interface AgentOptions {
    userId: string;
    agentConfigId?: number;
}

// Результат для tool calling
interface ToolSearchResult {
    title: string;
    text: string;
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

    // Получаем реальное название модели из enum
    const modelName = agentConfig?.model 
        ? getModelName(agentConfig.model as AiModelKey) 
        : 'gpt-4o-mini';

    const { text } = await generateText({
        model: customOpenAI(modelName),
        system: systemPrompt,
        prompt,
        stopWhen: stepCountIs(10),
        tools: {
            searchKnowledge: tool({
                description:
                    'Поиск информации в базе знаний. Используй этот инструмент когда нужно найти информацию о продукте, услугах, FAQ или другие данные.',
                inputSchema: z.object({
                    query: z
                        .string()
                        .describe('Поисковый запрос на естественном языке'),
                    limit: z
                        .number()
                        .optional()
                        .default(5)
                        .describe('Количество результатов'),
                }),
                execute: async ({
                    query,
                    limit = 5,
                }): Promise<string | ToolSearchResult[]> => {
                    const results = await searchKnowledge(query, limit);

                    if (!results.length) {
                        return 'Информация по запросу не найдена в базе знаний.';
                    }

                    return results.map((r: SearchResult) => ({
                        title: r.title,
                        text: r.text.slice(0, 500),
                        score: r.score,
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
