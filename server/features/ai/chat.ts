import { RoleAi } from '@prisma/client';
import { aiConfig} from './config';

// todo здесь функции из sdk добавить

interface ChatMessage {
    role: RoleAi;
    content: string;
}

interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// Отправка запроса в чат (completion API)
export async function sendChatRequest(
    messages: ChatMessage[],
    model = 'gpt-4o-mini'
): Promise<string> {
    const response = await fetch(`${aiConfig.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
            temperature: aiConfig.temperature,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка запроса к AI: ${response.status} - ${errorText}`);
    }

    const data: ChatCompletionResponse = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
        throw new Error('AI не вернул ответ');
    }

    return assistantMessage;
}
