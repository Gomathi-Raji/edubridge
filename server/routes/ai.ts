import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
}

const MODEL = 'gemini-3-flash-preview';
const SYSTEM_INSTRUCTION = 'You are EduBridge AI, a helpful and encouraging tutor for students in rural areas. Your goal is to explain complex technical concepts in simple, relatable terms. Use analogies from daily life or nature when possible. Support multiple languages if the user asks.';

// ─── POST /api/ai/chat ── Chat with AI tutor ──────────────────────────────
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const ai = getAI();
    const chat = ai.chats.create({
      model: MODEL,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
      history: (history || []).map((h: any) => ({ role: h.role, parts: h.parts })),
    });
    const result = await chat.sendMessage({ message });
    res.json({ text: result.text });
  } catch (err: any) {
    console.error('AI chat error:', err.message);
    res.status(500).json({ error: 'AI service error', details: err.message });
  }
});

// ─── POST /api/ai/summarize ── Summarize session content ──────────────────
router.post('/summarize', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Summarize this live lecture in 3 concise bullet points:\n${text}`,
    });
    res.json({ summary: response.text });
  } catch (err: any) {
    console.error('AI summarize error:', err.message);
    res.status(500).json({ error: 'AI service error', details: err.message });
  }
});

// ─── POST /api/ai/quiz ── Generate quiz ───────────────────────────────────
router.post('/quiz', async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic required' });

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Generate a 3-question multiple choice quiz about ${topic}. Return it in JSON format.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
            },
            required: ['question', 'options', 'correctAnswer'],
          },
        },
      },
    });
    res.json(JSON.parse(response.text ?? '[]'));
  } catch (err: any) {
    console.error('AI quiz error:', err.message);
    res.status(500).json({ error: 'AI service error', details: err.message });
  }
});

// ─── POST /api/ai/explain ── Explain a concept ───────────────────────────
router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { concept } = req.body;
    if (!concept) return res.status(400).json({ error: 'concept required' });

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Explain the concept of "${concept}" to a 15-year-old student living in a rural village. Use a simple analogy related to farming, community, or nature.`,
    });
    res.json({ explanation: response.text });
  } catch (err: any) {
    console.error('AI explain error:', err.message);
    res.status(500).json({ error: 'AI service error', details: err.message });
  }
});

// ─── POST /api/ai/learning-path ── Generate learning path ────────────────
router.post('/learning-path', async (req: Request, res: Response) => {
  try {
    const { goal } = req.body;
    if (!goal) return res.status(400).json({ error: 'goal required' });

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Generate a personalized learning path for the goal: "${goal}". Include 5 milestones with titles and descriptions. Return it in JSON format.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ['title', 'description'],
          },
        },
      },
    });
    res.json(JSON.parse(response.text ?? '[]'));
  } catch (err: any) {
    console.error('AI learning-path error:', err.message);
    res.status(500).json({ error: 'AI service error', details: err.message });
  }
});

export default router;
