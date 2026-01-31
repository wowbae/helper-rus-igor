// Кастомный OpenAI провайдер для gptunnel.ru
import { createOpenAI } from '@ai-sdk/openai';
import { aiConfig } from './config';

// Создаём провайдер с кастомным baseURL
export const customOpenAI = createOpenAI({
    apiKey: aiConfig.apiKey,
    baseURL: aiConfig.baseURL, // https://gptunnel.ru/v1
});
