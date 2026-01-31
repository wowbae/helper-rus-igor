// AI Агент с RAG и классификацией интентов
import { generateText } from 'ai';
import { customOpenAI } from './provider';
import { searchKnowledge, type SearchResult } from './knowledge/search';
import { prisma } from 'prisma/client';
import { getModelName, type AiModelKey, DEFAULT_MODELS, AI_MODEL_MAP } from './config';
import { analyzeIntent, getQuickResponse, type IntentCategory } from './intent';

// Опции для запуска агента
interface AgentOptions {
    userId: string;
    agentConfigId?: number;
}

// Результат работы агента с метаданными
interface AgentResult {
    text: string;
    intent: IntentCategory;
    usedKnowledge: boolean;
    usedLLM: boolean; // false = быстрый ответ без LLM
}

// Запуск агента с интеллектуальным RAG (поиск только когда нужен)
export async function runAgent(
    prompt: string,
    options: AgentOptions
): Promise<string> {
    const result = await runAgentWithMeta(prompt, options);
    return result.text;
}

// Запуск агента с возвратом метаданных (для отладки и аналитики)
export async function runAgentWithMeta(
    prompt: string,
    options: AgentOptions
): Promise<AgentResult> {
    // Анализируем интент пользователя
    const intent = analyzeIntent(prompt);
    
    // Проверяем есть ли быстрый ответ (без LLM)
    const quickResponse = getQuickResponse(intent.category);
    if (quickResponse) {
        return {
            text: quickResponse,
            intent: intent.category,
            usedKnowledge: false,
            usedLLM: false,
        };
    }
    
    // Загрузка конфига агента из БД
    const agentConfig = await prisma.agentConfig.findFirst({
        where: options.agentConfigId
            ? { id: options.agentConfigId }
            : { isActive: true },
    });

    const baseSystemPrompt =
        agentConfig?.systemPrompt ||
        'Ты умный ассистент. Отвечай на вопросы пользователя используя предоставленный контекст.';

    // Получаем реальное название модели из enum (или дефолтную из конфига)
    const modelName = agentConfig?.model 
        ? getModelName(agentConfig.model as AiModelKey) 
        : AI_MODEL_MAP[DEFAULT_MODELS.chat];

    // Поиск в базе знаний ТОЛЬКО если интент требует
    let contextBlock = '';
    let usedKnowledge = false;
    
    if (intent.needsKnowledge) {
        const knowledgeResults = await searchKnowledge(prompt, 3);
        
        if (knowledgeResults.length > 0) {
            usedKnowledge = true;
            const contextParts = knowledgeResults.map(
                (r: SearchResult) => `[${r.title}]\n${r.text}`
            );
            contextBlock = `\n\nКонтекст из базы знаний:\n${contextParts.join('\n\n')}`;
        }
    }

    // Добавляем контекст к системному промпту
    const systemPrompt = baseSystemPrompt + contextBlock;

    const { text } = await generateText({
        model: customOpenAI(modelName),
        system: systemPrompt,
        prompt,
    });

    return {
        text,
        intent: intent.category,
        usedKnowledge,
        usedLLM: true,
    };
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
