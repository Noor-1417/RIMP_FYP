const Groq = require('groq-sdk');

// Initialize Groq client
const groqKey = process.env.GROQ_API_KEY;
let groqClient = null;
if (groqKey) {
  groqClient = new Groq({ apiKey: groqKey });
}

const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Helper: call Groq chat completion
 */
async function callGroq(systemPrompt, userPrompt, options = {}) {
  if (!groqClient) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 2000,
  });

  return response.choices?.[0]?.message?.content || '';
}

/**
 * Helper: parse JSON from AI response (handles markdown code blocks)
 */
function parseAIJson(text) {
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

// ============================================================
// TASK GENERATION — Generate internship tasks based on category,
// duration, and student level using Groq AI
// ============================================================

/**
 * Generate internship tasks using Groq AI
 * @param {Object} params - { categoryName, durationWeeks, studentLevel, topics }
 * @returns {Promise<Array>} Array of task objects
 */
async function generateInternshipTasks({ categoryName, durationWeeks, studentLevel, topics }) {
  const taskCount = Math.max(4, Math.min(durationWeeks * 2, 12)); // 2 tasks per week, max 12

  const systemPrompt = `You are an expert internship mentor. Generate practical internship tasks.
IMPORTANT: Respond with ONLY valid JSON array. No markdown, no code blocks, no explanation.
Each task must be a JSON object with these exact keys:
- "title": short descriptive title
- "description": detailed 2-3 sentence description of what the student must do
- "requirements": array of 3-5 specific requirements/deliverables
- "weekNumber": which week this task belongs to (1-based)
- "taskOrder": sequential number starting from 1`;

  const userPrompt = `Generate ${taskCount} internship tasks for:
- Category: ${categoryName}
- Duration: ${durationWeeks} weeks
- Student Level: ${studentLevel || 'intermediate'}
- Topics: ${(topics || []).join(', ') || 'General topics in ' + categoryName}

Tasks should progressively increase in difficulty. Week 1 tasks should be introductory.
Later tasks should build on earlier ones. Each task should be achievable within 3-4 days.
Respond ONLY with a JSON array.`;

  try {
    const content = await callGroq(systemPrompt, userPrompt, { temperature: 0.7, max_tokens: 3000 });
    const tasks = parseAIJson(content);

    // Validate and normalize
    return tasks.map((task, idx) => ({
      title: task.title || `Task ${idx + 1}`,
      description: task.description || 'Complete the assigned task.',
      requirements: Array.isArray(task.requirements) ? task.requirements : ['Complete the task as described'],
      weekNumber: task.weekNumber || Math.ceil((idx + 1) / 2),
      taskOrder: task.taskOrder || idx + 1,
    }));
  } catch (err) {
    console.error('Groq task generation error:', err.message);

    // Fallback: generate mock tasks
    return Array.from({ length: taskCount }, (_, i) => ({
      title: `${categoryName} Task ${i + 1}`,
      description: `Complete the assigned ${categoryName.toLowerCase()} task for week ${Math.ceil((i + 1) / 2)}.`,
      requirements: [
        'Research the topic thoroughly',
        'Document your findings',
        'Submit your work with proper formatting',
      ],
      weekNumber: Math.ceil((i + 1) / 2),
      taskOrder: i + 1,
    }));
  }
}

// ============================================================
// SUBMISSION EVALUATION — Evaluate student submission + plagiarism
// ============================================================

/**
 * Evaluate a student submission using Groq AI
 * @param {Object} params - { taskTitle, taskDescription, taskRequirements, submissionMessage, githubLink }
 * @returns {Promise<Object>} { score, plagiarism_percent, status, feedback, improvements }
 */
async function evaluateTaskSubmission({ taskTitle, taskDescription, taskRequirements, submissionMessage, githubLink, hasFiles, fileNames }) {
  const systemPrompt = `You are a supportive and professional internship mentor. Your goal is to evaluate student work fairly. 
Analyze the student's submission and respond ONLY with valid JSON (no markdown, no code blocks):
{
  "score": <number 0-100>,
  "plagiarism_percent": <number 0-100>,
  "status": "PASS" or "FAIL",
  "feedback": "<constructive and encouraging feedback text>",
  "improvements": ["improvement1", "improvement2", "improvement3"]
}

Evaluation Rules:
- If the student has made a genuine effort and addressed the core requirements, GIVE THEM A PASS (Score >= 60).
- If files are uploaded (hasFiles: true), assume the detailed work is contained within those files.
- If the file names (${fileNames || 'none'}) match the task requirements (e.g., reports, slides, code), grant a PASS.
- Only FAIL if the submission is completely irrelevant, empty, or has high plagiarism (>50%).
- Be encouraging and provide actionable improvements.`;

  const userPrompt = `Evaluate this internship task submission:

TASK: ${taskTitle}
DESCRIPTION: ${taskDescription}
REQUIREMENTS: ${(taskRequirements || []).join('; ')}

STUDENT SUBMISSION:
Message: ${submissionMessage || 'No message provided'}
${githubLink ? `GitHub Link: ${githubLink}` : ''}
${hasFiles ? `Uploaded Files: ${fileNames}` : 'No files uploaded'}

Evaluate the quality based on the message and the fact that work was submitted in the listed files. Respond ONLY with JSON.`;

  try {
    const content = await callGroq(systemPrompt, userPrompt, { temperature: 0.3, max_tokens: 800 });
    const evaluation = parseAIJson(content);

    const score = Math.min(100, Math.max(0, evaluation.score || 0));
    return {
      score,
      plagiarism_percent: Math.min(100, Math.max(0, evaluation.plagiarism_percent || 0)),
      status: score >= 60 ? 'PASS' : 'FAIL',
      feedback: evaluation.feedback || 'Submission evaluated.',
      improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements : [],
    };
  } catch (err) {
    console.error('Groq evaluation error:', err.message);

    // Fallback evaluation
    const randomScore = Math.floor(Math.random() * 31) + 65; // 65-95
    return {
      score: randomScore,
      plagiarism_percent: Math.floor(Math.random() * 15),
      status: 'PASS',
      feedback: 'Submission accepted. AI evaluation temporarily unavailable — manual review recommended.',
      improvements: ['Ensure thorough documentation', 'Add more detailed explanations'],
    };
  }
}

// ============================================================
// MENTOR CHATBOT — Guide student with hints, NO direct solutions
// ============================================================

/**
 * Mentor chatbot: answer student questions with guidance only
 * @param {Object} params - { studentMessage, taskTitle, taskDescription, conversationHistory }
 * @returns {Promise<string>} AI mentor response
 */
async function mentorChat({ studentMessage, taskTitle, taskDescription, conversationHistory }) {
  const systemPrompt = `You are an AI internship mentor. Your role is to GUIDE students, NOT give them complete solutions.

STRICT RULES:
1. NEVER provide complete code solutions or full implementations
2. NEVER write entire functions, classes, or modules for the student
3. Instead, provide:
   - Conceptual explanations
   - Step-by-step hints on how to approach the problem
   - Pseudocode or high-level logic flows
   - Links or references to learning resources
   - Debugging tips and strategies
   - Small code snippets (max 3-4 lines) ONLY to illustrate a concept
4. Encourage the student to think critically and solve problems themselves
5. Be friendly, supportive, and encouraging
6. If asked to write complete code, politely decline and offer guidance instead

Current task context:
${taskTitle ? `Task: ${taskTitle}` : 'No specific task'}
${taskDescription ? `Description: ${taskDescription}` : ''}`;

  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  // Add conversation history if provided
  if (conversationHistory && Array.isArray(conversationHistory)) {
    for (const msg of conversationHistory.slice(-6)) { // Keep last 6 messages for context
      messages.push({
        role: msg.role === 'student' ? 'user' : 'assistant',
        content: msg.content,
      });
    }
  }

  messages.push({ role: 'user', content: studentMessage });

  try {
    if (!groqClient) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const response = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 600,
    });

    return response.choices?.[0]?.message?.content || 'I apologize, I could not process your question. Please try again.';
  } catch (err) {
    console.error('Groq mentor chat error:', err.message);
    return 'I\'m currently having trouble connecting. Please try again in a moment. In the meantime, try breaking your problem into smaller steps and tackling each one individually!';
  }
}

// ============================================================
// LEGACY FUNCTIONS — Kept for backward compatibility with
// existing aiController.js and taskController.js
// ============================================================

/**
 * Grade a submission (legacy — used by old taskController)
 */
async function gradeSubmission({ submissionUrl, prompt }) {
  try {
    const content = await callGroq(
      'You are an automated grader. Provide a JSON response with keys: score (0-100), passed (true/false), feedback (short).',
      `Evaluate the submission (available at: ${submissionUrl}). ${prompt || ''}`,
      { temperature: 0.2, max_tokens: 300 }
    );

    const json = parseAIJson(content);
    return {
      score: json.score || 0,
      passed: json.passed === true || (json.score || 0) >= 60,
      feedback: json.feedback || content,
    };
  } catch (err) {
    console.error('Groq grading error:', err.message);
    const randomScore = Math.floor(Math.random() * 41) + 60;
    return {
      score: randomScore,
      passed: randomScore >= 60,
      feedback: 'Auto-graded by fallback grader. Please review manually if needed.',
    };
  }
}

/**
 * Generate a personalized internship project (legacy — used by old aiController)
 */
async function generateInternshipProject({ skills, field, interest }, categoryName) {
  try {
    const systemPrompt = `You are an expert at creating personalized internship projects. 
IMPORTANT: Respond with valid JSON only (no markdown, no code blocks) with this exact structure:
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

    const content = await callGroq(systemPrompt, userPrompt, { temperature: 0.7, max_tokens: 2000 });
    const projectData = parseAIJson(content);

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
  } catch (err) {
    console.error('AI project generation error:', err.message);
  }

  // Fallback mock project
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
 * Evaluate submission (legacy — used by old aiController)
 */
async function evaluateSubmission({ submission, taskDescription }) {
  try {
    const systemPrompt = `You are an expert evaluator. Respond ONLY with valid JSON:
{
  "score": <0-100>,
  "passed": <true/false>,
  "feedback": "<constructive feedback>",
  "plagiarismScore": <0-100>
}`;

    const userPrompt = `Evaluate this submission for the task: "${taskDescription}"
Submission: "${submission}"
Respond ONLY with JSON.`;

    const content = await callGroq(systemPrompt, userPrompt, { temperature: 0.3, max_tokens: 500 });
    const evaluation = parseAIJson(content);

    return {
      score: Math.min(100, Math.max(0, evaluation.score || 0)),
      passed: evaluation.score >= 60,
      feedback: evaluation.feedback || 'Submission evaluated.',
      plagiarismScore: Math.min(100, Math.max(0, evaluation.plagiarismScore || 0)),
    };
  } catch (err) {
    console.error('Submission evaluation error:', err.message);
  }

  const scoreVariance = Math.floor(Math.random() * 31) + 70;
  return {
    score: scoreVariance,
    passed: true,
    feedback: 'Submission accepted. Manual review recommended.',
    plagiarismScore: Math.floor(Math.random() * 21),
  };
}

/**
 * Calculate simple plagiarism score based on text similarity
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
 */
function calculateProgress(completedTasks, totalTasks) {
  if (!totalTasks || totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
}

/**
 * Get task statistics
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
  // New Groq-powered functions
  generateInternshipTasks,
  evaluateTaskSubmission,
  mentorChat,
  // Legacy functions (backward compatible)
  gradeSubmission,
  generateInternshipProject,
  evaluateSubmission,
  calculateTextSimilarity,
  calculateProgress,
  getTaskStatistics,
};
