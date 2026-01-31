// Загрузчик локальных файлов в Prisma
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from 'prisma/client';

const DOCS_DIR = './docs/agent_knowledge';
const SUPPORTED_EXTENSIONS = ['.txt', '.md'];

// Вычисление SHA-256 хеша содержимого
function computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}

// Извлечение заголовка из содержимого
function extractTitle(content: string, filename: string): string {
    // Первая строка или имя файла
    const firstLine = content.split('\n')[0]?.trim();
    if (firstLine && firstLine.length > 0 && firstLine.length < 100) {
        return firstLine.replace(/^#\s*/, ''); // убираем markdown заголовок
    }
    return filename.replace(/\.[^/.]+$/, ''); // имя без расширения
}

// Загрузка локальных документов в Prisma с дедупликацией
export async function loadLocalDocuments(agentId: number) {
    if (!fs.existsSync(DOCS_DIR)) {
        console.log(`Папка ${DOCS_DIR} не существует, пропускаем загрузку`);
        return { loaded: 0, skipped: 0, updated: 0 };
    }

    const files = fs
        .readdirSync(DOCS_DIR)
        .filter((f) =>
            SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
        );

    let loaded = 0;
    let skipped = 0;
    let updated = 0;

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
            // Если файл изменился — обновляем
            if (existingByPath.contentHash !== contentHash) {
                await prisma.document.update({
                    where: { id: existingByPath.id },
                    data: {
                        content,
                        contentHash,
                        title: extractTitle(content, filename),
                    },
                });
                updated++;
            } else {
                skipped++;
            }
            continue;
        }

        // Проверяем по хешу (возможно документ был добавлен вручную с таким же содержимым)
        const existingByHash = await prisma.document.findUnique({
            where: { contentHash },
        });

        if (existingByHash) {
            skipped++;
            continue;
        }

        // Создаём новый документ
        await prisma.document.create({
            data: {
                agentId,
                title: extractTitle(content, filename),
                content,
                category: 'local-file',
                filePath: relativeFilePath,
                contentHash,
            },
        });
        loaded++;
    }

    return { loaded, skipped, updated };
}
