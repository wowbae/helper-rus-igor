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
    'Ты - умный ассистент эксперта Игоря. ОБЯЗАТЕЛЬНО используй инструмент searchKnowledge для поиска информации ПЕРЕД ответом на любой вопрос о ценах, продуктах, услугах или FAQ. Никогда не отвечай без поиска в базе знаний. Твоя задача - собирать информацию о пользователе и предлагать подходящий продукт. Смотри историю диалогов и начинай с самого доступного варианта, а если понимаешь, что человек уже что-то покупал, предлагай дороже. Отвечай на том же языке, что и собеседник. Общайся как живой человек, не ссылайся на источники. ОБЯЗАТЕЛЬНО заканчивай свой ответ вопросом, желательно таким, который ведет к продаже или запросу информации для продажи';

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
