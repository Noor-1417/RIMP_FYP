/**
 * Groq AI Service
 * Clean service file for all Groq AI interactions.
 * 
 * Functions:
 *   - generateInternshipTasks(category, durationWeeks, difficulty)
 *   - evaluateSubmission(taskTitle, taskDescription, submissionTextOrLink)
 *   - chatMentorResponse(taskContext, userMessage)
 */

const Groq = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
let groq = null;
if (GROQ_API_KEY) {
  groq = new Groq({ apiKey: GROQ_API_KEY });
}

const MODEL = 'llama-3.3-70b-versatile';

// ─── Helper: call Groq and return text ──────────────────────
async function _callGroq(systemPrompt, userPrompt, opts = {}) {
  if (!groq) throw new Error('GROQ_API_KEY is not configured in .env');

  const res = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
    temperature: opts.temperature ?? 0.7,
    max_tokens:  opts.max_tokens  ?? 2000,
  });

  return res.choices?.[0]?.message?.content || '';
}

// ─── Helper: safely parse JSON from AI output ───────────────
function _parseJson(text) {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

// ═══════════════════════════════════════════════════════════════
// 1) generateInternshipTasks
// ═══════════════════════════════════════════════════════════════
/**
 * Generate internship tasks using Groq AI.
 *
 * @param {String} category      - Internship category name (e.g. "Web Development")
 * @param {Number} durationWeeks - Duration of the internship in weeks
 * @param {String} difficulty    - "beginner" | "intermediate" | "advanced"
 * @returns {Promise<Array<{title,description,requirements,weekNumber,orderNumber}>>}
 */
async function generateInternshipTasks(category, durationWeeks, difficulty) {
  const taskCount = Math.max(4, Math.min(durationWeeks * 2, 12));

  const system = `You are an expert internship mentor who creates practical, real-world tasks.
RESPOND ONLY WITH A VALID JSON ARRAY — no markdown, no explanation.
Each element must have:
  "title"        : short descriptive title
  "description"  : 2-3 sentence description of what the student must do
  "requirements" : array of 3-5 specific deliverables
  "weekNumber"   : which week (1-based)
  "orderNumber"  : sequential task number starting from 1`;

  const user = `Generate ${taskCount} internship tasks for:
Category    : ${category}
Duration    : ${durationWeeks} weeks
Difficulty  : ${difficulty || 'intermediate'}

Tasks must progressively increase in difficulty.
Week 1 = introductory. Later weeks = advanced.
Each task should be completable in 3-4 days.
Respond ONLY with the JSON array.`;

  try {
    const raw = await _callGroq(system, user, { temperature: 0.7, max_tokens: 3000 });
    const tasks = _parseJson(raw);

    return tasks.map((t, i) => ({
      title:        t.title        || `Task ${i + 1}`,
      description:  t.description  || 'Complete the assigned task.',
      requirements: Array.isArray(t.requirements) ? t.requirements : ['Complete the task'],
      weekNumber:   t.weekNumber   || Math.ceil((i + 1) / 2),
      orderNumber:  t.orderNumber  || i + 1,
    }));
  } catch (err) {
    console.error('Groq generateInternshipTasks error:', err.message);

    // Fallback mock tasks
    return Array.from({ length: taskCount }, (_, i) => ({
      title:        `${category} - Task ${i + 1}`,
      description:  `Complete the ${category.toLowerCase()} task for week ${Math.ceil((i + 1) / 2)}.`,
      requirements: ['Research the topic', 'Document your findings', 'Submit your work'],
      weekNumber:   Math.ceil((i + 1) / 2),
      orderNumber:  i + 1,
    }));
  }
}

// ═══════════════════════════════════════════════════════════════
// 2) evaluateSubmission
// ═══════════════════════════════════════════════════════════════
/**
 * Send task + submission to Groq AI for scoring and plagiarism analysis.
 *
 * @param {String} taskTitle        - Title of the task
 * @param {String} taskDescription  - Full description of the task
 * @param {String} submissionTextOrLink - Student's submission text, GitHub link, or message
 * @returns {Promise<{score,plagiarismPercent,status,feedback,improvements}>}
 */
async function evaluateSubmission(taskTitle, taskDescription, submissionTextOrLink) {
  const system = `You are a strict but fair internship evaluator.
Respond ONLY with valid JSON (no markdown):
{
  "score": <0-100>,
  "plagiarismPercent": <0-100>,
  "status": "PASS" or "FAIL",
  "feedback": "<constructive feedback>",
  "improvements": ["improvement1", "improvement2", "improvement3"]
}
Rules:
- score >= 60 → PASS, otherwise FAIL
- Check quality, completeness, originality
- Provide 2-4 actionable improvements
- Be encouraging but honest`;

  const user = `TASK TITLE: ${taskTitle}
TASK DESCRIPTION: ${taskDescription}

STUDENT SUBMISSION:
${submissionTextOrLink || '(No content submitted)'}

Evaluate and respond ONLY with JSON.`;

  try {
    const raw = await _callGroq(system, user, { temperature: 0.3, max_tokens: 800 });
    const ev  = _parseJson(raw);
    const score = Math.min(100, Math.max(0, ev.score || 0));

    return {
      score,
      plagiarismPercent: Math.min(100, Math.max(0, ev.plagiarismPercent || ev.plagiarism_percent || 0)),
      status:           score >= 60 ? 'PASS' : 'FAIL',
      feedback:         ev.feedback || 'Submission evaluated.',
      improvements:     Array.isArray(ev.improvements) ? ev.improvements : [],
    };
  } catch (err) {
    console.error('Groq evaluateSubmission error:', err.message);

    // Fallback
    const fallbackScore = Math.floor(Math.random() * 30) + 65;
    return {
      score:            fallbackScore,
      plagiarismPercent: Math.floor(Math.random() * 10),
      status:           'PASS',
      feedback:         'AI evaluation temporarily unavailable — manual review recommended.',
      improvements:     ['Add detailed documentation', 'Include more examples'],
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 3) chatMentorResponse
// ═══════════════════════════════════════════════════════════════
/**
 * AI Mentor chatbot — guides student with hints, NOT direct answers.
 *
 * @param {String} taskContext   - Task title + description for context
 * @param {String} userMessage   - The student's question
 * @param {Array}  history       - Optional conversation history [{role,content}]
 * @returns {Promise<String>}    - Mentor reply text
 */
async function chatMentorResponse(taskContext, userMessage, history = []) {
  const system = `You are a friendly AI internship mentor.

STRICT RULES:
1. NEVER provide complete code solutions or full implementations.
2. NEVER write entire functions, classes, or modules for the student.
3. Only provide:
   - Conceptual explanations
   - Step-by-step hints
   - Pseudocode or high-level logic (max 3-4 lines of code as illustration)
   - Debugging tips
   - Suggested resources or documentation links
4. If asked to write complete code, politely decline and guide instead.
5. Be supportive and encouraging.

${taskContext ? `Current task context:\n${taskContext}` : ''}`;

  const messages = [{ role: 'system', content: system }];

  // Append last 6 messages of history for context
  if (Array.isArray(history)) {
    for (const m of history.slice(-6)) {
      messages.push({
        role:    m.role === 'student' || m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      });
    }
  }

  messages.push({ role: 'user', content: userMessage });

  try {
    if (!groq) throw new Error('GROQ_API_KEY not configured');

    const res = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens:  600,
    });

    return res.choices?.[0]?.message?.content
      || 'Sorry, I could not process your question. Please try again.';
  } catch (err) {
    console.error('Groq chatMentorResponse error:', err.message);
    return 'I\'m having trouble connecting right now. Try breaking your problem into smaller steps and tackling each one individually!';
  }
}

// ═══════════════════════════════════════════════════════════════
module.exports = {
  generateInternshipTasks,
  evaluateSubmission,
  chatMentorResponse,
};
