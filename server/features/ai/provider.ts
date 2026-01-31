// OpenRouter провайдер для чатов и эмбеддингов
import { createOpenAI } from '@ai-sdk/openai';
import { aiConfig } from './config';

// OpenRouter провайдер (для чатов и эмбеддингов)
const openrouterProvider = createOpenAI({
    apiKey: aiConfig.apiKey,
    baseURL: aiConfig.baseURL,
});

// Функция для Chat Completions API
// OpenRouter не поддерживает Responses API, только /chat/completions
export function customOpenAI(modelId: string) {
    return openrouterProvider.chat(modelId);
}

// Экспортируем провайдер для эмбеддингов
export { openrouterProvider };
