const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const geminiService = {
  async chat(message: string, history: ChatMessage[] = []) {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: "You are EduBridge AI, a helpful and encouraging tutor for students in rural areas. Your goal is to explain complex technical concepts in simple, relatable terms. Use analogies from daily life or nature when possible. Support multiple languages if the user asks."
      },
      ...history.map(h => ({
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
        model: 'anthropic/claude-3.5-sonnet',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  async generateQuiz(topic: string) {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edubridge.vercel.app',
        'X-Title': 'EduBridge AI Tutor'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
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
      return JSON.parse(content);
    } catch (e) {
      // Fallback parsing if JSON is wrapped in markdown
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Failed to parse quiz response');
    }
  },

  async explainConcept(concept: string) {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edubridge.vercel.app',
        'X-Title': 'EduBridge AI Tutor'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
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
    return data.choices[0].message.content;
  },

  async generateLessonPlan(topic: string) {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edubridge.vercel.app',
        'X-Title': 'EduBridge AI Tutor'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{
          role: 'user',
          content: `Generate a structured lesson plan for the topic: "${topic}". Include learning objectives, key concepts, and suggested activities. Return it in JSON format with this structure: {"topic": "string", "learningObjectives": ["string"], "keyConcepts": [{"concept": "string", "explanation": "string"}], "suggestedActivities": ["string"]}`
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
      return JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Failed to parse lesson plan response');
    }
  },

  async generateLearningPath(goal: string) {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edubridge.vercel.app',
        'X-Title': 'EduBridge AI Tutor'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
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
      return JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Failed to parse learning path response');
    }
  },

  async analyzePerformance(stats: any) {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edubridge.vercel.app',
        'X-Title': 'EduBridge AI Tutor'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{
          role: 'user',
          content: `Analyze these student performance statistics and provide 3 actionable insights: ${JSON.stringify(stats)}. Return it in JSON format with this structure: [{"insight": "string", "recommendation": "string"}]`
        }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      return JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Failed to parse performance analysis response');
    }
  },

  async recommendCourses(interests: string[]) {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edubridge.vercel.app',
        'X-Title': 'EduBridge AI Tutor'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{
          role: 'user',
          content: `Based on these interests: ${interests.join(', ')}, recommend 3 course titles and brief descriptions. Return it in JSON format with this structure: [{"title": "string", "description": "string"}]`
        }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      return JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Failed to parse course recommendations response');
    }
  }
};
