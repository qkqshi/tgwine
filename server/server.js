import express from "express";
import multer from "multer";
import OpenAI from "openai";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

app.use(cors());
app.use(express.json());

// ⚙️ КОНФИГУРАЦИЯ МОДЕЛЕЙ
const MODELS = {
  vision: {
    primary: "openai/gpt-4o-mini",
    fallback: "google/gemini-flash-1.5", // Пример фоллбэка
  },
  text: {
    primary: "anthropic/claude-3-5-sonnet",
    fallback: "openai/gpt-4o-mini",
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://t.me/YourBotName", // Укажите реальный бот
    "X-Title": "Sommelier App",
  },
});

/**
 * Универсальная функция вызова AI с обработкой JSON и (опционально) повторной попыткой
 */
async function safeAiCall(messages, modelType = "text") {
  const primaryModel = modelType === "vision" ? MODELS.vision.primary : MODELS.text.primary;
  
  // В продакшене можно добавить логику retry с fallback моделями
  // Сейчас для простоты используем primary
  const modelToUse = primaryModel;

  try {
    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages: messages,
      max_tokens: 1500,
      temperature: 0.7,
    });

    const text = response?.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("EMPTY_MODEL_RESPONSE");

    // Попытка найти JSON в ответе
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`BAD_JSON: ${text.substring(0, 100)}...`);

    return JSON.parse(match[0]);
  } catch (e) {
    console.error(`AI Error (${modelToUse}):`, e.message);
    throw e; // Пробрасываем ошибку выше
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Шаг 1: Фото этикетки → распознавание
// ══════════════════════════════════════════════════════════════════════════════
app.post("/api/sommelier/label-to-dishes", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Нет изображения" });

    const base64 = req.file.buffer.toString("base64");
    const mime = req.file.mimetype || "image/jpeg";

    const prompt = `Ты — опытный сомелье. Определи напиток по этикетке.
    Подбери 3-5 идеально подходящих блюд.
    Ответь ТОЛЬКО валидным JSON:
    {
      "drink": {"name":"Название","type":"Тип (Вино/Пиво/...)","country":"Страна","notes":["нота1","нота2"]},
      "dishes":[{"name":"Блюдо 1", "desc":"Короткое пояснение"},{"name":"Блюдо 2", "desc":"..."}]
    }`;

    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } }
        ],
      },
    ];

    const data = await safeAiCall(messages, "vision");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Ошибка анализа этикетки", details: e.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Шаг 1б: Получить рецепт
// ══════════════════════════════════════════════════════════════════════════════
app.post("/api/sommelier/get-recipe", async (req, res) => {
  try {
    const { dishName } = req.body;
    if (!dishName) return res.status(400).json({ error: "Нужно название блюда" });

    const prompt = `Напиши рецепт для "${dishName}" на русском.
    Кратко и по делу.
    Ответь ТОЛЬКО JSON:
    {
      "recipe": "Текст рецепта с ингредиентами и шагами (используй \\n для переноса строк)"
    }`;

    const data = await safeAiCall([{ role: "user", content: prompt }], "text");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Ошибка генерации рецепта", details: e.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Шаг 2: Персональные рекомендации
// ══════════════════════════════════════════════════════════════════════════════
app.post("/api/sommelier/personalized-drinks", async (req, res) => {
  try {
    const { type, country, notes } = req.body;
    const prompt = `Рекомендуй 3-4 напитка: Тип: ${type}, Страна: ${country || "любая"}, Ноты: ${notes}.
    Ответь ТОЛЬКО JSON:
    {
      "recommendations": [
        {"name":"Название","region":"Регион","notes":["нота"],"priceUSD":"$$"}
      ]
    }`;

    const data = await safeAiCall([{ role: "user", content: prompt }], "text");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Ошибка рекомендаций", details: e.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Шаг 3: Фото блюда → вино
// ══════════════════════════════════════════════════════════════════════════════
app.post("/api/sommelier/dish-to-wine", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Нет изображения" });
    
    const base64 = req.file.buffer.toString("base64");
    const mime = req.file.mimetype || "image/jpeg";

    const prompt = `Определи блюдо и посоветуй 2 вина к нему.
    Ответь ТОЛЬКО JSON:
    {
      "dish":"Название блюда",
      "wines":[
        {"name":"Вино 1","type":"Красное/Белое","why":"Почему подходит"}
      ]
    }`;

    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } }
        ],
      },
    ];

    const data = await safeAiCall(messages, "vision");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Ошибка подбора вина", details: e.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Шаг 4: Похмельные тренировки
// ══════════════════════════════════════════════════════════════════════════════
app.post("/api/sommelier/hangover-workouts", async (req, res) => {
  try {
    const { level } = req.body;
    const prompt = `Составь легкую тренировку от похмелья. Уровень: ${level || "light"}.
    Ответь ТОЛЬКО JSON:
    {
      "level": "${level}",
      "duration": "15 мин",
      "exercises": [{"name": "Упр 1", "reps": "10 раз", "notes": "Аккуратно"}],
      "tips": ["Совет 1"]
    }`;

    const data = await safeAiCall([{ role: "user", content: prompt }], "text");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Ошибка тренировки", details: e.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Шаг 5: Советы (статичный JSON можно кэшировать, но пока оставим AI)
// ══════════════════════════════════════════════════════════════════════════════
app.post("/api/sommelier/hangover-tips", async (req, res) => {
  try {
    const prompt = `Как избавиться от похмелья? Краткие советы.
    Ответь ТОЛЬКО JSON:
    {
      "hydration": ["Совет 1"],
      "nutrition": ["Совет 1"],
      "supplements": ["Совет 1"],
      "activity": ["Совет 1"],
      "duration": "Время"
    }`;

    const data = await safeAiCall([{ role: "user", content: prompt }], "text");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Ошибка советов", details: e.message });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`🍷 Sommelier API ready on port ${process.env.PORT || 3001}`);
});