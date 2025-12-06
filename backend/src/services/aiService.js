const fetch = require('node-fetch');
const OpenAI = require('openai');

const openaiKey = process.env.OPENAI_API_KEY;
let client = null;
if (openaiKey) {
  client = new OpenAI({ apiKey: openaiKey });
}

/**
 * Grade a submission using OpenAI or a mocked grader when API key missing.
 * @param {Object} params - { submissionUrl, prompt }
 * @returns {Promise<{score:number,passed:boolean,feedback:string}>}
 */
async function gradeSubmission({ submissionUrl, prompt }) {
  // If OpenAI is configured, call it to evaluate the submission content.
  try {
    if (client) {
      // Basic prompt: ask model to grade 0-100 and provide feedback
      const system = `You are an automated grader. Provide a JSON response with keys: score (0-100), passed (true/false), feedback (short).`;
      const userPrompt = `${system}\nEvaluate the submission (available at: ${submissionUrl}). ${prompt || ''}`;

      const resp = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 300,
      });

      const text = resp.choices?.[0]?.message?.content || '';
      // Try to parse JSON out of response
      let json = null;
      try {
        json = JSON.parse(text);
      } catch (e) {
        // fallback: attempt to extract numbers
        const scoreMatch = text.match(/(\d{1,3})/);
        const score = scoreMatch ? Number(scoreMatch[1]) : 0;
        json = { score, passed: score >= 60, feedback: text };
      }

      return {
        score: json.score || 0,
        passed: json.passed === true,
        feedback: json.feedback || text,
      };
    }
  } catch (err) {
    console.error('OpenAI grading error:', err);
  }

  // Fallback mock grading if OpenAI not configured
  const randomScore = Math.floor(Math.random() * 41) + 60; // 60-100
  return {
    score: randomScore,
    passed: randomScore >= 60,
    feedback: 'Auto-graded by fallback grader. Please review manually if needed.',
  };
}

module.exports = {
  gradeSubmission,
};
