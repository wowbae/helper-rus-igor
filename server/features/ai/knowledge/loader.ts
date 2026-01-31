// Загрузчик локальных файлов в Prisma с созданием эмбеддингов
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from 'prisma/client';
import { createEmbedding } from './search';

const DOCS_DIR = './docs/agent_knowledge';
const SUPPORTED_EXTENSIONS = ['.txt', '.md'];
const MIN_CHUNK_LENGTH = 50; // минимальная длина чанка

// Вычисление SHA-256 хеша содержимого
function computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}

// Извлечение заголовка из содержимого
function extractTitle(content: string, filename: string): string {
    const firstLine = content.split('\n')[0]?.trim();
    if (firstLine && firstLine.length > 0 && firstLine.length < 100) {
        return firstLine.replace(/^#\s*/, '');
    }
    return filename.replace(/\.[^/.]+$/, '');
}

// Разбиение текста на чанки (по параграфам)
function splitIntoChunks(content: string): string[] {
    return content
        .split(/\n\s*\n/) // разбиваем по пустым строкам
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length >= MIN_CHUNK_LENGTH);
}

// Генерация уникального ID для чанка
function generateChunkId(): string {
    return `chunk_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// Создание чанков с эмбеддингами для документа
async function createChunksForDocument(
    documentId: number,
    content: string
): Promise<number> {
    const chunks = splitIntoChunks(content);
    let created = 0;

    for (const chunkText of chunks) {
        try {
            const embedding = await createEmbedding(chunkText);
            const embeddingStr = `[${embedding.join(',')}]`;
            const chunkId = generateChunkId();

            await prisma.$executeRawUnsafe(`
                INSERT INTO document_chunks (id, "documentId", text, embedding, "createdAt")
                VALUES ('${chunkId}', ${documentId}, $1, '${embeddingStr}'::vector, NOW())
            `, chunkText);

            created++;
        } catch (error) {
            console.error(`Ошибка создания чанка для документа ${documentId}:`, error);
        }
    }

    return created;
}

// Удаление всех чанков документа
async function deleteChunksForDocument(documentId: number): Promise<void> {
    await prisma.$executeRaw`
        DELETE FROM document_chunks WHERE "documentId" = ${documentId}
    `;
}

// Загрузка локальных документов в Prisma с созданием эмбеддингов
export async function loadLocalDocuments(agentId: number) {
    if (!fs.existsSync(DOCS_DIR)) {
        console.log(`📁 Папка ${DOCS_DIR} не существует, пропускаем загрузку`);
        return { loaded: 0, skipped: 0, updated: 0, chunks: 0 };
    }

    const files = fs
        .readdirSync(DOCS_DIR)
        .filter((f) =>
            SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
        );

    if (!files.length) {
        console.log(`📁 Папка ${DOCS_DIR} пуста`);
        return { loaded: 0, skipped: 0, updated: 0, chunks: 0 };
    }

    let loaded = 0;
    let skipped = 0;
    let updated = 0;
    let totalChunks = 0;

    for (const filename of files) {
        const filePath = path.join(DOCS_DIR, filename);
        const content = fs.readFileSync(filePath, 'utf8');
        const contentHash = computeHash(content);
        const relativeFilePath = `docs/agent_knowledge/${filename}`;

        // Проверяем дедупликацию по пути к файлу
        const existingByPath = await prisma.document.findUnique({
            where: { filePath: relativeFilePath },
        });

        if (existingByPath) {
            // Если файл изменился — обновляем документ и пересоздаём чанки
            if (existingByPath.contentHash !== contentHash) {
                await prisma.document.update({
                    where: { id: existingByPath.id },
                    data: {
                        content,
                        contentHash,
                        title: extractTitle(content, filename),
                    },
                });

                // Удаляем старые чанки и создаём новые
                await deleteChunksForDocument(existingByPath.id);
                const chunksCreated = await createChunksForDocument(
                    existingByPath.id,
                    content
                );
                totalChunks += chunksCreated;
                updated++;
            } else {
                skipped++;
            }
            continue;
        }

        // Проверяем по хешу
        const existingByHash = await prisma.document.findUnique({
            where: { contentHash },
        });

        if (existingByHash) {
            skipped++;
            continue;
        }

        // Создаём новый документ
        const newDocument = await prisma.document.create({
            data: {
                agentId,
                title: extractTitle(content, filename),
                content,
                category: 'local-file',
                filePath: relativeFilePath,
                contentHash,
            },
        });

        // Создаём чанки с эмбеддингами
        const chunksCreated = await createChunksForDocument(
            newDocument.id,
            content
        );
        totalChunks += chunksCreated;
        loaded++;
    }

    return { loaded, skipped, updated, chunks: totalChunks };
}
