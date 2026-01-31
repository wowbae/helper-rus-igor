import { addChatComposer } from './add.chat';
import { commandsComposer } from './commands';
import { triggerComposer } from './triggers';
import { textComposer } from './simple.text';
import { callbackComposer } from './callback';
import { documentsComposer } from './documents';

// Агрегированный экспорт одной переменной с композерами.
// Порядок важен: сначала события чата, затем команды, триггеры, документы, и простой текст.
export const handlers = [
    addChatComposer,
    callbackComposer,
    commandsComposer,
    triggerComposer,
    documentsComposer, // команда /delete и callback'и документов
    textComposer,
];
