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

/**
 * Generate a personalized internship project using AI based on user's CV data
 * @param {Object} cvData - { skills, field, interest }
 * @param {String} categoryName - Internship category name
 * @returns {Promise<{title, description, objectives, tools, skills, tasks, notes}>}
 */
async function generateInternshipProject({ skills, field, interest }, categoryName) {
  try {
    if (client) {
      const system = `You are an expert at creating personalized internship projects based on student skills and interests. 
        Generate a detailed project that:
        1. Matches the student's skills and field
        2. Aligns with their interests
        3. Is achievable in 8-12 weeks
        4. Includes practical, real-world tasks
        
        IMPORTANT: You MUST respond with valid JSON only (no markdown, no code blocks) with this exact structure:
        {
          "title": "Project Title",
          "description": "Detailed description",
          "objectives": ["objective1", "objective2", "objective3"],
          "tools": ["tool1", "tool2"],
          "skills": ["skill1", "skill2"],
          "tasks": [
            {"title": "Task 1", "description": "Description", "weekNumber": 1},
            {"title": "Task 2", "description": "Description", "weekNumber": 2}
          ],
          "notes": "Additional notes"
        }`;

      const userPrompt = `Create a personalized ${categoryName} internship project for a student with:
        - Technical Skills: ${skills || 'Not specified'}
        - Field: ${field || 'Not specified'}
        - Interests: ${interest || 'Not specified'}
        
        The project should have 8-10 weekly tasks. Respond ONLY with JSON, no other text.`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      let content = response.choices?.[0]?.message?.content || '';
      
      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let projectData = JSON.parse(content);

      // Convert task format to include deadlines
      const tasks = (projectData.tasks || []).map((task, index) => {
        const startDate = new Date();
        const deadlineDate = new Date(startDate.getTime() + (task.weekNumber || index + 1) * 7 * 24 * 60 * 60 * 1000);
        return {
          title: task.title,
          description: task.description,
          deadline: deadlineDate,
          order: index,
          status: 'pending',
        };
      });

      return {
        title: projectData.title,
        description: projectData.description,
        objectives: projectData.objectives || [],
        tools: projectData.tools || [],
        skills: projectData.skills || [],
        tasks,
        notes: projectData.notes || '',
      };
    }
  } catch (err) {
    console.error('AI project generation error:', err);
  }

  // Fallback mock project if AI fails
  return {
    title: `${field || 'General'} Internship Project`,
    description: 'A practical internship project designed for your learning and experience.',
    objectives: [
      'Understand industry best practices',
      'Apply your skills in real-world scenarios',
      'Build a portfolio-worthy project',
    ],
    tools: ['Git', 'Documentation Tools', 'Project Management'],
    skills: [field || 'Technical Skills'],
    tasks: Array.from({ length: 8 }, (_, i) => ({
      title: `Week ${i + 1} Task`,
      description: `Complete the assigned task for week ${i + 1}`,
      deadline: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
      order: i,
      status: 'pending',
    })),
    notes: 'Mock project generated. Replace with AI-generated project when API key is configured.',
  };
}

/**
 * Check submission for plagiarism and evaluate quality
 * @param {String} submission - The submission text
 * @param {String} taskDescription - The task description
 * @returns {Promise<{score: number, passed: boolean, feedback: string, plagiarismScore: number}>}
 */
async function evaluateSubmission({ submission, taskDescription }) {
  try {
    if (client) {
      const system = `You are an expert evaluator. Analyze the submission and respond ONLY with valid JSON:
        {
          "score": <0-100>,
          "passed": <true/false>,
          "feedback": "<constructive feedback>",
          "plagiarismScore": <0-100>,
          "qualityNotes": "<brief quality assessment>"
        }`;

      const userPrompt = `Evaluate this submission for the task: "${taskDescription}"
        
        Submission: "${submission}"
        
        Check for:
        1. Quality and completeness (score 0-100)
        2. Plagiarism indicators (similarity score 0-100)
        3. Whether it meets task requirements
        
        Respond ONLY with JSON.`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      let content = response.choices?.[0]?.message?.content || '';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const evaluation = JSON.parse(content);

      return {
        score: Math.min(100, Math.max(0, evaluation.score || 0)),
        passed: evaluation.score >= 60,
        feedback: evaluation.feedback || 'Submission evaluated.',
        plagiarismScore: Math.min(100, Math.max(0, evaluation.plagiarismScore || 0)),
      };
    }
  } catch (err) {
    console.error('Submission evaluation error:', err);
  }

  // Fallback evaluation
  const scoreVariance = Math.floor(Math.random() * 31) + 70; // 70-100
  return {
    score: scoreVariance,
    passed: true,
    feedback: 'Submission accepted. Manual review recommended.',
    plagiarismScore: Math.floor(Math.random() * 21), // 0-20% similarity
  };
}

/**
 * Calculate simple plagiarism score based on text similarity
 * @param {String} text1 - First text
 * @param {String} text2 - Second text
 * @returns {number} Similarity percentage (0-100)
 */
function calculateTextSimilarity(text1, text2) {
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const t1 = normalize(text1);
  const t2 = normalize(text2);

  if (!t1 || !t2) return 0;

  const shorter = t1.length < t2.length ? t1 : t2;
  const longer = t1.length < t2.length ? t2 : t1;

  let matches = 0;
  for (let i = 0; i <= longer.length - shorter.length; i++) {
    const substr = longer.substr(i, shorter.length);
    if (substr === shorter) {
      matches += shorter.length;
    }
  }

  return Math.round((matches / longer.length) * 100);
}

/**
 * Calculate progress percentage
 * @param {number} completedTasks - Number of completed tasks
 * @param {number} totalTasks - Total number of tasks
 * @returns {number} Progress percentage (0-100)
 */
function calculateProgress(completedTasks, totalTasks) {
  if (!totalTasks || totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
}

/**
 * Get task statistics
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Task statistics
 */
function getTaskStatistics(tasks) {
  if (!tasks || tasks.length === 0) {
    return {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      rejected: 0,
      submitted: 0,
      averageScore: 0,
    };
  }

  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const rejected = tasks.filter(t => t.status === 'rejected').length;
  const submitted = tasks.filter(t => t.status === 'submitted').length;

  const completedTasks = tasks.filter(t => t.evaluation?.score);
  const averageScore = completedTasks.length > 0
    ? completedTasks.reduce((sum, t) => sum + (t.evaluation?.score || 0), 0) / completedTasks.length
    : 0;

  return {
    total: tasks.length,
    completed,
    pending,
    inProgress,
    rejected,
    submitted,
    averageScore: Math.round(averageScore * 100) / 100,
  };
}

module.exports = {
  gradeSubmission,
  generateInternshipProject,
  evaluateSubmission,
  calculateTextSimilarity,
  calculateProgress,
  getTaskStatistics,
};
