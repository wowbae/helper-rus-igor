// Синхронизация документов из Prisma в Upstash Search
import { prisma } from 'prisma/client';
import { knowledgeIndex, isUpstashConfigured } from './search';

// Синхронизация всех документов из Prisma в Upstash
export async function syncDocumentsToUpstash(agentId?: number) {
    if (!isUpstashConfigured()) {
        return 0;
    }

    const documents = await prisma.document.findMany({
        where: agentId ? { agentId } : undefined,
    });

    if (!documents.length) {
        return 0;
    }

    const batch = documents.map((doc) => ({
        id: `doc-${doc.id}`,
        content: {
            text: doc.content,
            title: doc.title,
            category: doc.category,
            documentId: doc.id,
        },
    }));

    await knowledgeIndex.upsert(batch);

    return batch.length;
}

// Удаление документа из Upstash
export async function deleteDocumentFromUpstash(documentId: number) {
    await knowledgeIndex.delete([`doc-${documentId}`]);
}

// Полная инициализация: загрузка файлов + синхронизация
export async function initKnowledgeBase(agentId: number) {
    const { loadLocalDocuments } = await import('./loader');

    // 1. Загружаем локальные файлы в Prisma
    const { loaded, skipped, updated } = await loadLocalDocuments(agentId);
    console.log(
        `📚 Документы: загружено ${loaded}, обновлено ${updated}, пропущено ${skipped}`
    );

    // 2. Синхронизируем в Upstash (если настроен)
    if (isUpstashConfigured()) {
        const synced = await syncDocumentsToUpstash(agentId);
        console.log(`🔄 Синхронизировано в Upstash: ${synced} документов`);
        return { loaded, skipped, updated, synced };
    } else {
        console.log(
            '⚠️ Upstash Search не настроен (UPSTASH_SEARCH_REST_URL и UPSTASH_SEARCH_REST_TOKEN пустые)'
        );
        console.log('   RAG-поиск будет недоступен до настройки Upstash');
        return { loaded, skipped, updated, synced: 0 };
    }
}
