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

// Доступные модели AI
export const aiModels = {
    gpt4o: 'gpt-4o',
    gpt4oMini: 'gpt-4o-mini',
    gpt5Nano: 'gpt-5-nano', // алиас для удобства (заменить на реальную модель когда появится)
} as const;

export type AiModel = (typeof aiModels)[keyof typeof aiModels];
