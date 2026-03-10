import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

const router = Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// ─── GET /api/profiles/:userId ── Get student profile ─────────────────────
router.get('/:userId', (req: Request, res: Response) => {
  const db = getDb();
  const profile = db.prepare(`
    SELECT sp.*, u.name, u.email, u.avatar, u.languages
    FROM student_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.user_id = ?
  `).get(req.params.userId);

  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

// ─── POST /api/profiles ── Save student onboarding profile ────────────────
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const {
    user_id, age_group, education_level, location,
    learning_goals, interests, skills, preferred_languages,
    preferred_schedule, experience_level, daily_hours,
  } = req.body;

  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  const existing = db.prepare('SELECT user_id FROM student_profiles WHERE user_id = ?').get(user_id);

  if (existing) {
    db.prepare(`
      UPDATE student_profiles SET
        age_group = ?, education_level = ?, location = ?,
        learning_goals = ?, interests = ?, skills = ?,
        preferred_languages = ?, preferred_schedule = ?,
        experience_level = ?, daily_hours = ?,
        onboarding_complete = 1, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(
      age_group, education_level, location,
      JSON.stringify(learning_goals || []),
      JSON.stringify(interests || []),
      JSON.stringify(skills || []),
      JSON.stringify(preferred_languages || []),
      preferred_schedule, experience_level, daily_hours,
      user_id
    );
  } else {
    db.prepare(`
      INSERT INTO student_profiles (
        user_id, age_group, education_level, location,
        learning_goals, interests, skills, preferred_languages,
        preferred_schedule, experience_level, daily_hours, onboarding_complete
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      user_id, age_group, education_level, location,
      JSON.stringify(learning_goals || []),
      JSON.stringify(interests || []),
      JSON.stringify(skills || []),
      JSON.stringify(preferred_languages || []),
      preferred_schedule, experience_level, daily_hours
    );
  }

  // After saving profile, generate mentor recommendations
  generateRecommendations(user_id);

  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user_id);
  res.json(profile);
});

// ─── GET /api/profiles/:userId/recommendations ── Get mentor matches ──────
router.get('/:userId/recommendations', (req: Request, res: Response) => {
  const db = getDb();
  const recs = db.prepare(`
    SELECT mr.*, u.name as mentor_name, u.email as mentor_email,
           u.avatar as mentor_avatar, u.languages as mentor_languages,
           mp.bio, mp.expertise, mp.experience_years, mp.rating,
           mp.total_sessions, mp.total_students, mp.availability,
           mp.teaching_style, mp.location as mentor_location
    FROM mentor_recommendations mr
    JOIN users u ON mr.mentor_id = u.id
    LEFT JOIN mentor_profiles mp ON mr.mentor_id = mp.user_id
    WHERE mr.student_id = ?
    ORDER BY mr.match_score DESC
  `).all(req.params.userId);

  res.json(recs);
});

// ─── POST /api/profiles/:userId/recommendations/generate ── AI recommend ──
router.post('/:userId/recommendations/generate', async (req: Request, res: Response) => {
  try {
    await generateRecommendations(req.params.userId);
    const db = getDb();
    const recs = db.prepare(`
      SELECT mr.*, u.name as mentor_name, u.email as mentor_email,
             u.avatar as mentor_avatar, u.languages as mentor_languages,
             mp.bio, mp.expertise, mp.experience_years, mp.rating,
             mp.total_sessions, mp.total_students, mp.availability,
             mp.teaching_style, mp.location as mentor_location
      FROM mentor_recommendations mr
      JOIN users u ON mr.mentor_id = u.id
      LEFT JOIN mentor_profiles mp ON mr.mentor_id = mp.user_id
      WHERE mr.student_id = ?
      ORDER BY mr.match_score DESC
    `).all(req.params.userId);
    res.json(recs);
  } catch (err: any) {
    console.error('Recommendation error:', err.message);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// ─── GET /api/profiles/mentors/all ── Get all mentor profiles ─────────────
router.get('/mentors/all', (_req: Request, res: Response) => {
  const db = getDb();
  const mentors = db.prepare(`
    SELECT mp.*, u.name, u.email, u.avatar, u.languages
    FROM mentor_profiles mp
    JOIN users u ON mp.user_id = u.id
  `).all();
  res.json(mentors);
});

// ─── Recommendation engine ────────────────────────────────────────────────

async function generateRecommendations(studentId: string) {
  const db = getDb();

  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId) as any;
  if (!profile) return;

  const mentors = db.prepare(`
    SELECT mp.*, u.name, u.languages
    FROM mentor_profiles mp
    JOIN users u ON mp.user_id = u.id
  `).all() as any[];

  if (mentors.length === 0) return;

  // Clear old recommendations
  db.prepare('DELETE FROM mentor_recommendations WHERE student_id = ?').run(studentId);

  const studentInterests = JSON.parse(profile.interests || '[]');
  const studentSkills = JSON.parse(profile.skills || '[]');
  const studentGoals = JSON.parse(profile.learning_goals || '[]');
  const studentLangs = JSON.parse(profile.preferred_languages || '[]');

  const insertRec = db.prepare(`
    INSERT OR REPLACE INTO mentor_recommendations (student_id, mentor_id, match_score, match_reasons)
    VALUES (?, ?, ?, ?)
  `);

  for (const mentor of mentors) {
    const mentorExpertise = JSON.parse(mentor.expertise || '[]');
    const mentorLangs = JSON.parse(mentor.languages || '[]');
    const reasons: string[] = [];
    let score = 0;

    // Match interests/goals to mentor expertise
    const allStudentTopics = [...studentInterests, ...studentSkills, ...studentGoals]
      .map((s: string) => s.toLowerCase());
    const mentorTopics = mentorExpertise.map((s: string) => s.toLowerCase());

    let topicMatches = 0;
    for (const topic of allStudentTopics) {
      for (const exp of mentorTopics) {
        if (exp.includes(topic) || topic.includes(exp)) {
          topicMatches++;
        }
      }
    }
    if (topicMatches > 0) {
      score += Math.min(topicMatches * 15, 45);
      reasons.push(`Expertise matches your interests in ${mentorExpertise.slice(0, 3).join(', ')}`);
    }

    // Language match
    const langMatches = studentLangs.filter((l: string) =>
      mentorLangs.some((ml: string) => ml.toLowerCase() === l.toLowerCase())
    );
    if (langMatches.length > 0) {
      score += langMatches.length * 10;
      reasons.push(`Speaks ${langMatches.join(', ')}`);
    }

    // Rating bonus
    if (mentor.rating >= 4.8) {
      score += 15;
      reasons.push(`Highly rated (${mentor.rating}/5)`);
    } else if (mentor.rating >= 4.5) {
      score += 10;
    }

    // Experience bonus
    if (mentor.experience_years >= 10) {
      score += 10;
      reasons.push(`${mentor.experience_years} years of experience`);
    }

    // Session count bonus
    if (mentor.total_sessions > 100) {
      score += 10;
      reasons.push(`Conducted ${mentor.total_sessions}+ sessions`);
    }

    // Normalize score to 0-100
    score = Math.min(score, 100);

    if (score > 0) {
      insertRec.run(studentId, mentor.user_id, score, JSON.stringify(reasons));
    }
  }

  // If we have an OpenRouter key, enhance with AI reasoning
  if (OPENROUTER_API_KEY) {
    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://edubridge.vercel.app',
          'X-Title': 'EduBridge Mentor Matching'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [{
            role: 'user',
            content: `Given this student profile:
- Interests: ${studentInterests.join(', ')}
- Skills: ${studentSkills.join(', ')}
- Goals: ${studentGoals.join(', ')}
- Experience: ${profile.experience_level}
- Languages: ${studentLangs.join(', ')}

And these mentors:
${mentors.map(m => `- ${m.name}: expertise in ${m.expertise}, speaks ${m.languages}, ${m.experience_years}yr exp, rating ${m.rating}`).join('\n')}

For each mentor provide a brief 1-sentence personalized reason why they'd be a good match for this student. Return JSON array: [{"mentor_id": "id", "reason": "sentence"}]`
          }],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        let aiReasons: any[];
        try {
          aiReasons = JSON.parse(content);
        } catch {
          const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
          aiReasons = jsonMatch ? JSON.parse(jsonMatch[1]) : [];
        }

        for (const r of aiReasons) {
          const existing = db.prepare(
            'SELECT match_reasons FROM mentor_recommendations WHERE student_id = ? AND mentor_id = ?'
          ).get(studentId, r.mentor_id) as any;
          if (existing) {
            const reasons = JSON.parse(existing.match_reasons || '[]');
            reasons.unshift(r.reason);
            db.prepare(
              'UPDATE mentor_recommendations SET match_reasons = ? WHERE student_id = ? AND mentor_id = ?'
            ).run(JSON.stringify(reasons), studentId, r.mentor_id);
          }
        }
      }
    } catch (err) {
      console.error('AI recommendation enhancement failed:', err);
    }
  }
}

export default router;
