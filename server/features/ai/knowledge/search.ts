// Upstash Search клиент для RAG
import { Search, type Index } from '@upstash/search';
import 'dotenv/config';

// Интерфейс содержимого документа в индексе
export interface KnowledgeContent {
    text: string;
    title: string;
    category: string | null;
    documentId: number;
}

// Проверка наличия переменных окружения
export function isUpstashConfigured(): boolean {
    return !!(
        process.env.UPSTASH_SEARCH_REST_URL &&
        process.env.UPSTASH_SEARCH_REST_TOKEN
    );
}

// Ленивая инициализация клиента (только когда нужен и настроен)
let _knowledgeIndex: Index<KnowledgeContent> | null = null;

export function getKnowledgeIndex(): Index<KnowledgeContent> | null {
    if (!isUpstashConfigured()) {
        return null;
    }

    if (!_knowledgeIndex) {
        const search = new Search({
            url: process.env.UPSTASH_SEARCH_REST_URL!,
            token: process.env.UPSTASH_SEARCH_REST_TOKEN!,
        });
        _knowledgeIndex = search.index<KnowledgeContent>('knowledge-base');
    }

    return _knowledgeIndex;
}

// Для обратной совместимости (выбросит ошибку если не настроен)
export const knowledgeIndex = {
    search: async (...args: Parameters<Index<KnowledgeContent>['search']>) => {
        const index = getKnowledgeIndex();
        if (!index) {
            console.warn('⚠️ Upstash Search не настроен, поиск недоступен');
            return [];
        }
        return index.search(...args);
    },
    upsert: async (...args: Parameters<Index<KnowledgeContent>['upsert']>) => {
        const index = getKnowledgeIndex();
        if (!index) {
            console.warn('⚠️ Upstash Search не настроен, синхронизация пропущена');
            return;
        }
        return index.upsert(...args);
    },
    delete: async (...args: Parameters<Index<KnowledgeContent>['delete']>) => {
        const index = getKnowledgeIndex();
        if (!index) {
            console.warn('⚠️ Upstash Search не настроен, удаление пропущено');
            return;
        }
        return index.delete(...args);
    },
};
