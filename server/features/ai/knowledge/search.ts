// Векторный поиск через pgvector
import { prisma } from 'prisma/client';
import { embed } from 'ai';
import { openrouterProvider } from '../provider';
import { DEFAULT_MODELS } from '../config';

// Интерфейс результата поиска
export interface SearchResult {
    id: string;
    text: string;
    documentId: number;
    title: string;
    score: number;
}

// Создание эмбеддинга для текста через OpenRouter
export async function createEmbedding(text: string): Promise<number[]> {
    const { embedding } = await embed({
        model: openrouterProvider.embedding(DEFAULT_MODELS.embedding),
        value: text,
    });
    return embedding;
}

// Поиск похожих чанков через pgvector (косинусное сходство)
export async function searchKnowledge(
    query: string,
    limit: number = 5
): Promise<SearchResult[]> {
    try {
        const queryEmbedding = await createEmbedding(query);
        const embeddingStr = `[${queryEmbedding.join(',')}]`;

        const results = await prisma.$queryRawUnsafe<SearchResult[]>(`
            SELECT
                dc.id,
                dc.text,
                dc."documentId",
                d.title,
                1 - (dc.embedding <=> '${embeddingStr}'::vector) as score
            FROM document_chunks dc
            JOIN "Document" d ON d.id = dc."documentId"
            ORDER BY dc.embedding <=> '${embeddingStr}'::vector
            LIMIT ${limit}
        `);

        return results;
    } catch (error) {
        console.error('Ошибка поиска в базе знаний:', error);
        return [];
    }
}

// Проверка доступности pgvector
export async function isPgvectorAvailable(): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1 FROM pg_extension WHERE extname = 'vector'`;
        return true;
    } catch {
        return false;
    }
}
