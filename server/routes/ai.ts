import { Router, Request, Response } from 'express';

const router = Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = 'google/gemini-2.0-flash-001';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_INSTRUCTION = 'You are EduBridge AI, a helpful and encouraging tutor for students in rural areas. Your goal is to explain complex technical concepts in simple, relatable terms. Use analogies from daily life or nature when possible. Support multiple languages if the user asks.';

// ─── POST /api/ai/chat ── Chat with AI tutor ──────────────────────────────
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...(history || []).map((h: any) => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        content: h.parts?.[0]?.text || h.content || ''
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edubridge.vercel.app',
        'X-Title': 'EduBridge AI Tutor'
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    res.json({ response: data.choices[0].message.content });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// ─── POST /api/ai/summarize ── Summarize session content ──────────────────
router.post('/summarize', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edubridge.vercel.app',
        'X-Title': 'EduBridge AI Tutor'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{
          role: 'user',
          content: `Summarize this live lecture in 3 concise bullet points:\n${text}`
        }],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    res.json({ summary: data.choices[0].message.content });
  } catch (error) {
    console.error('AI Summarize Error:', error);
    res.status(500).json({ error: 'Failed to summarize content' });
  }
});

// ─── POST /api/ai/quiz ── Generate quiz ───────────────────────────────────
router.post('/quiz', async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic required' });

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edubridge.vercel.app',
        'X-Title': 'EduBridge AI Tutor'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{
          role: 'user',
          content: `Generate a 3-question multiple choice quiz about ${topic}. Return it in JSON format with this structure: [{"question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "A"}]`
        }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const quiz = JSON.parse(content);
      res.json(quiz);
    } catch (e) {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[1]));
      } else {
        throw new Error('Failed to parse quiz response');
      }
    }
  } catch (error) {
    console.error('AI Quiz Error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// ─── POST /api/ai/explain ── Explain a concept ───────────────────────────
router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { concept } = req.body;
    if (!concept) return res.status(400).json({ error: 'concept required' });

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edubridge.vercel.app',
        'X-Title': 'EduBridge AI Tutor'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{
          role: 'user',
          content: `Explain the concept of "${concept}" to a 15-year-old student living in a rural village. Use a simple analogy related to farming, community, or nature.`
        }],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    res.json({ explanation: data.choices[0].message.content });
  } catch (error) {
    console.error('AI Explain Error:', error);
    res.status(500).json({ error: 'Failed to explain concept' });
  }
});

// ─── POST /api/ai/learning-path ── Generate learning path ────────────────
router.post('/learning-path', async (req: Request, res: Response) => {
  try {
    const { goal } = req.body;
    if (!goal) return res.status(400).json({ error: 'goal required' });

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edubridge.vercel.app',
        'X-Title': 'EduBridge AI Tutor'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{
          role: 'user',
          content: `Generate a personalized learning path for the goal: "${goal}". Include 5 milestones with titles and descriptions. Return it in JSON format with this structure: [{"title": "string", "description": "string"}]`
        }],
        temperature: 0.7,
        max_tokens: 1200
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const path = JSON.parse(content);
      res.json(path);
    } catch (e) {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[1]));
      } else {
        throw new Error('Failed to parse learning path response');
      }
    }
  } catch (error) {
    console.error('AI Learning Path Error:', error);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

export default router;
