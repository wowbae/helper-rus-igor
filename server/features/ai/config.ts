// Конфигурация ассистента
import 'dotenv/config';

export const aiConfig = {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_API || 'https://gptunnel.ru/v1',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 150,
    assistantCode: process.env.ASSISTANT_CODE, // код ассистента из веб-интерфейса
    maxContext: 20, // количество сообщений для запоминания
    systemPrompt:
        'Ты - умный ассистент, который может помогать с различными вопросами, отвечай на том же языке, что и собеседник.',
};

// Маппинг Prisma enum → реальное название модели для API
// Ключи должны совпадать с AiModelEnum из schema.prisma
export const AI_MODEL_MAP = {
    gpt_4o: 'gpt-4o',
    gpt_4o_mini: 'gpt-4o-mini',
    gpt_5_nano: 'gpt-5-nano',
    deepseek_v3_2: 'deepseek/deepseek-v3.2',
} as const;

// Тип для безопасного получения модели
export type AiModelKey = keyof typeof AI_MODEL_MAP;
export type AiModelValue = (typeof AI_MODEL_MAP)[AiModelKey];

// Хелпер для получения реального названия модели из enum
export function getModelName(enumValue: AiModelKey): AiModelValue {
    return AI_MODEL_MAP[enumValue];
}
