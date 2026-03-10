const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = 'google/gemini-2.0-flash-001';

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
        model: MODEL,
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
        model: MODEL,
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
        model: MODEL,
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
  },

  async generateDashboardData(profile: any) {
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
          content: `Based on this student profile, generate personalized dashboard data.
Profile: interests=${profile.interests}, skills=${profile.skills}, goals=${profile.learning_goals}, experience=${profile.experience_level}, daily_hours=${profile.daily_hours}, schedule=${profile.preferred_schedule}.

Return JSON with this exact structure:
{
  "weeklyGoalPercent": number (0-100),
  "stats": { "coursesActive": number, "mentorSessions": number, "learningHours": string, "skillPoints": string },
  "weeklyActivity": [{"name": "Mon", "progress": number}, ...7 days],
  "activeCourses": [{"title": "string", "progress": number, "instructor": "string"}] (3 courses relevant to their interests/skills)
}`
        }],
        temperature: 0.7,
        max_tokens: 1200
      })
    });
    if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
    const data = await response.json();
    const content = data.choices[0].message.content;
    try { return JSON.parse(content); } catch { const m = content.match(/```json\n([\s\S]*?)\n```/); if (m) return JSON.parse(m[1]); throw new Error('Parse error'); }
  },

  async generatePersonalizedCourses(profile: any) {
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
          content: `Generate 6 personalized course recommendations for a student.
Profile: interests=${profile.interests}, skills=${profile.skills}, goals=${profile.learning_goals}, experience=${profile.experience_level}, education=${profile.education_level}.

Return JSON array with this structure:
[{"id": "1", "title": "string", "instructor": "AI-generated realistic name", "progress": 0, "category": "string", "duration": "Xh Ym", "students": number, "rating": number(4.0-5.0), "description": "brief description"}]

Categories should be relevant to their interests. Make courses appropriate for their experience level.`
        }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
    const data = await response.json();
    const content = data.choices[0].message.content;
    try { return JSON.parse(content); } catch { const m = content.match(/```json\n([\s\S]*?)\n```/); if (m) return JSON.parse(m[1]); throw new Error('Parse error'); }
  },

  async generatePersonalizedMentors(profile: any) {
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
          content: `Generate 4 personalized mentor recommendations for a student.
Profile: interests=${profile.interests}, skills=${profile.skills}, goals=${profile.learning_goals}, preferred_languages=${profile.preferred_languages}, schedule=${profile.preferred_schedule}.

Return JSON array:
[{"id": "1", "name": "realistic full name", "expertise": ["string","string"], "experience": "X years", "rating": number(4.5-5.0), "languages": ["string"], "availability": "string matching student schedule", "status": "online"|"busy"|"offline", "matchReason": "why this mentor is a great fit"}]

Match mentors to the student's interests, language preferences, and schedule.`
        }],
        temperature: 0.7,
        max_tokens: 1200
      })
    });
    if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
    const data = await response.json();
    const content = data.choices[0].message.content;
    try { return JSON.parse(content); } catch { const m = content.match(/```json\n([\s\S]*?)\n```/); if (m) return JSON.parse(m[1]); throw new Error('Parse error'); }
  },

  async generateSkillAnalytics(profile: any) {
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
          content: `Generate skill analytics data for a student.
Profile: interests=${profile.interests}, skills=${profile.skills}, goals=${profile.learning_goals}, experience=${profile.experience_level}, daily_hours=${profile.daily_hours}.

Return JSON:
{
  "skillData": [{"subject": "string relevant to their interests", "A": number(30-140), "fullMark": 150}] (6 skills based on their interests/skills),
  "progressData": [{"name": "Week 1", "completed": number, "hours": number}] (4 weeks),
  "stats": [{"label": "string", "value": "string", "sub": "string"}] (3 stats),
  "insights": [{"insight": "string", "recommendation": "string"}] (3 AI insights)
}

Base skill scores on their experience level. Beginners should have lower scores.`
        }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
    const data = await response.json();
    const content = data.choices[0].message.content;
    try { return JSON.parse(content); } catch { const m = content.match(/```json\n([\s\S]*?)\n```/); if (m) return JSON.parse(m[1]); throw new Error('Parse error'); }
  },

  async generateCommunityData(profile: any) {
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
          content: `Generate personalized community data for a student.
Profile: interests=${profile.interests}, skills=${profile.skills}, goals=${profile.learning_goals}, preferred_languages=${profile.preferred_languages}.

Return JSON:
{
  "channels": ["string"] (4 discussion channels relevant to their interests),
  "studyGroups": ["string"] (3 study groups matching their goals),
  "onlineUsers": [{"name": "realistic name", "status": "Mentor"|"Student", "online": true}] (4 users),
  "recentMessages": [{"user": "name", "role": "Mentor"|"Student", "msg": "relevant discussion message about their interests", "time": "HH:MM AM/PM"}] (3 messages)
}`
        }],
        temperature: 0.7,
        max_tokens: 1200
      })
    });
    if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
    const data = await response.json();
    const content = data.choices[0].message.content;
    try { return JSON.parse(content); } catch { const m = content.match(/```json\n([\s\S]*?)\n```/); if (m) return JSON.parse(m[1]); throw new Error('Parse error'); }
  }
};
