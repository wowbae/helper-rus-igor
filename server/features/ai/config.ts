// Конфигурация ассистента
import 'dotenv/config';

export const aiConfig = {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API || 'https://gptunnel.ru/v1',
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
    gpt5Nano: 'gpt-4o-mini', // алиас для удобства (заменить на реальную модель когда появится)
    gpt35Turbo: 'gpt-3.5-turbo',
} as const;

export type AiModel = (typeof aiModels)[keyof typeof aiModels];
 