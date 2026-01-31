// Система классификации интентов (категорий вопросов)
// Позволяет определять тип запроса без LLM для оптимизации

// ============ КАТЕГОРИИ ИНТЕНТОВ ============
export const INTENT_CATEGORIES = {
    pricing: 'pricing',       // Вопросы о ценах
    product: 'product',       // Вопросы о продуктах/услугах
    purchase: 'purchase',     // Намерение купить
    contact: 'contact',       // Контакты и связь
    faq: 'faq',              // Общие вопросы FAQ
    greeting: 'greeting',     // Приветствие
    gratitude: 'gratitude',   // Благодарность
    general: 'general',       // Общий вопрос (не классифицирован)
} as const;

export type IntentCategory = (typeof INTENT_CATEGORIES)[keyof typeof INTENT_CATEGORIES];

// ============ ПАТТЕРНЫ ДЛЯ КЛАССИФИКАЦИИ ============
// Каждый паттерн - массив regex для определения категории
// Легко расширять: просто добавляй новые regex в массив

interface IntentPattern {
    category: IntentCategory;
    patterns: RegExp[];
    needsKnowledge: boolean; // Нужен ли поиск в базе знаний
}

const INTENT_PATTERNS: IntentPattern[] = [
    {
        category: 'greeting',
        patterns: [
            /^(привет|здравствуй|добр(ый|ое|ого)|хай|hello|hi|hey)[\s!?.]*$/i,
            /^как\s+(дела|жизнь|ты|поживаешь)/i,
        ],
        needsKnowledge: false,
    },
    {
        category: 'gratitude',
        patterns: [
            /^(спасибо|благодар|thanks|thank you)/i,
            /спс|пасиб/i,
        ],
        needsKnowledge: false,
    },
    {
        category: 'pricing',
        patterns: [
            /цен[аыу]?|стои(т|мость)|скольк|прайс|тариф/i,
            /почём|по\s*чём|сколько\s*(стоит|будет)/i,
            /расценк|прейскурант/i,
        ],
        needsKnowledge: true,
    },
    {
        category: 'product',
        patterns: [
            /продукт|товар|услуг/i,
            /курс|тренинг|тренировк|занят/i,
            /видео[-\s]?курс|онлайн[-\s]?курс/i,
            /тренажёр|тренажер/i,
            /что\s+(есть|предлага|продаё)/i,
        ],
        needsKnowledge: true,
    },
    {
        category: 'purchase',
        patterns: [
            /куп(ить|лю|им)|заказ(ать)?|оплат(ить|а)/i,
            /приобрести|оформ(ить|ление)/i,
            /хочу\s+(купить|заказать|записаться)/i,
            /запис(аться|ь\s+на)/i,
        ],
        needsKnowledge: true,
    },
    {
        category: 'contact',
        patterns: [
            /контакт|телефон|почт[аеу]|email|e-mail/i,
            /связ(ь|аться)|написать|позвонить/i,
            /как\s+(связаться|написать|позвонить)/i,
            /где\s+(найти|искать)/i,
        ],
        needsKnowledge: true,
    },
    {
        category: 'faq',
        patterns: [
            /как\s+(это|так|работает|сделать|можно)/i,
            /что\s+(это|такое|значит|делать)/i,
            /почему|зачем|когда|где|кто/i,
            /faq|вопрос|подскаж/i,
            /расскаж|объясн|помог/i,
        ],
        needsKnowledge: true,
    },
];

// ============ ФУНКЦИИ КЛАССИФИКАЦИИ ============

// Определение категории вопроса
export function detectIntent(text: string): IntentCategory {
    const normalizedText = text.trim().toLowerCase();
    
    for (const { category, patterns } of INTENT_PATTERNS) {
        if (patterns.some(pattern => pattern.test(normalizedText))) {
            return category;
        }
    }
    
    return 'general';
}

// Проверка нужен ли поиск в базе знаний
export function needsKnowledgeSearch(text: string): boolean {
    const normalizedText = text.trim().toLowerCase();
    
    for (const { patterns, needsKnowledge } of INTENT_PATTERNS) {
        if (patterns.some(pattern => pattern.test(normalizedText))) {
            return needsKnowledge;
        }
    }
    
    // По умолчанию для неклассифицированных - делаем поиск
    return true;
}

// Полная информация об интенте
export interface IntentResult {
    category: IntentCategory;
    needsKnowledge: boolean;
    confidence: 'high' | 'low'; // high = найден паттерн, low = general
}

export function analyzeIntent(text: string): IntentResult {
    const category = detectIntent(text);
    const needsKnowledge = needsKnowledgeSearch(text);
    
    return {
        category,
        needsKnowledge,
        confidence: category === 'general' ? 'low' : 'high',
    };
}

// ============ БЫСТРЫЕ ОТВЕТЫ (БЕЗ LLM) ============
// Для простых интентов отвечаем случайной заготовкой - экономия токенов

const QUICK_RESPONSES: Partial<Record<IntentCategory, string[]>> = {
    greeting: [
        'Привет! Чем могу помочь?',
        'Здравствуйте! Рад вас видеть. Какой у вас вопрос?',
        'Привет! Я помощник Игоря. Спрашивайте, с удовольствием помогу!',
        'Добрый день! Готов ответить на ваши вопросы.',
        'Привет! Что вас интересует?',
    ],
    gratitude: [
        'Пожалуйста! Обращайтесь, если будут ещё вопросы.',
        'Рад был помочь! Если что — пишите.',
        'Не за что! Буду рад помочь снова.',
        'Всегда пожалуйста! Хорошего дня!',
        'Обращайтесь! Удачи!',
    ],
};

// Получить случайный быстрый ответ (или null если нет заготовки)
export function getQuickResponse(category: IntentCategory): string | null {
    const responses = QUICK_RESPONSES[category];
    if (!responses || responses.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
}

// Проверка есть ли быстрый ответ для интента
export function hasQuickResponse(category: IntentCategory): boolean {
    return category in QUICK_RESPONSES;
}

// ============ ХЕЛПЕРЫ ДЛЯ РАСШИРЕНИЯ ============

// Добавление нового паттерна в рантайме (для тестов или динамического расширения)
export function addPattern(
    category: IntentCategory,
    pattern: RegExp,
    needsKnowledge: boolean
): void {
    const existing = INTENT_PATTERNS.find(p => p.category === category);
    if (existing) {
        existing.patterns.push(pattern);
    } else {
        INTENT_PATTERNS.push({ category, patterns: [pattern], needsKnowledge });
    }
}

// Добавление быстрого ответа для категории
export function addQuickResponse(category: IntentCategory, response: string): void {
    if (!QUICK_RESPONSES[category]) {
        QUICK_RESPONSES[category] = [];
    }
    QUICK_RESPONSES[category]!.push(response);
}
