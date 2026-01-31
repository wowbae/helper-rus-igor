// Конфигурация AI ассистента
import 'dotenv/config';

// ============ МОДЕЛИ ============
// Маппинг Prisma enum → реальное название модели для OpenRouter API
// Ключи должны совпадать с AiModelEnum из schema.prisma
export const AI_MODEL_MAP = {
    gpt_4o: 'gpt-4o',
    gpt_4o_mini: 'gpt-4o-mini',
    gpt_5_nano: 'gpt-5-nano',
    deepseek_v3_2: 'deepseek/deepseek-v3.2',
} as const;

// Модели по умолчанию (централизованная настройка)
export const DEFAULT_MODELS = {
    // Чат-модель (используется если нет в БД)
    chat: 'deepseek_v3_2' as keyof typeof AI_MODEL_MAP,
    // Модель эмбеддингов для RAG
    embedding: 'mistralai/mistral-embed-2312',
} as const;

// ============ СИСТЕМНЫЙ ПРОМПТ ============
export const systemPromptDefault =
    'Ты - умный ассистент экcперта, который отвечает на вопросы, используя только базу знаний. Попутно твоя задача собирать информацию с пользователя, чтобы предложить ему подходящий продукт из продуктовой линейки. Первый раз предлагай самый дешевый для быстрого закрытия сделки и знакомства с экспертом. Отвечай на том же языке, что и собеседник.';

// ============ КОНФИГУРАЦИЯ ============
export const aiConfig = {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_API,
    temperature: 0.7,
    maxContext: 20, // количество сообщений для запоминания
    systemPrompt: systemPromptDefault,
};

// Тип для безопасного получения модели
export type AiModelKey = keyof typeof AI_MODEL_MAP;
export type AiModelValue = (typeof AI_MODEL_MAP)[AiModelKey];

// Хелпер для получения реального названия модели из enum
export function getModelName(enumValue: AiModelKey): AiModelValue {
    return AI_MODEL_MAP[enumValue];
}
