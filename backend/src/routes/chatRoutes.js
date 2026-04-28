/**
 * Chat Routes — AI Mentor Chatbot
 * Provides the mentor chat endpoint at /api/chat/mentor.
 *
 * POST /api/chat/mentor
 *   Body: { message, taskId?, history? }
 *   Returns: { success, reply }
 *
 * All routes are protected by JWT middleware.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const groqService = require('../services/groqService');
const InternshipTask = require('../models/InternshipTask');

// All routes require authentication
router.use(protect);

/**
 * POST /api/chat/mentor
 *
 * Body:
 *   message  {String}  required — student's question
 *   taskId   {String}  optional — ObjectId of the current task for context
 *   history  {Array}   optional — last N chat messages [{role, content}]
 *
 * The mentor NEVER provides full code solutions.
 * It gives hints, pseudocode, and conceptual guidance only.
 */
router.post('/mentor', async (req, res) => {
  try {
    const { message, taskId, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'message is required',
      });
    }

    // Build task context string if a taskId was provided
    let taskContext = '';
    if (taskId) {
      const task = await InternshipTask.findById(taskId).lean();
      if (task) {
        taskContext = `Task Title: ${task.title}\nTask Description: ${task.description}`;
        if (Array.isArray(task.requirements) && task.requirements.length) {
          taskContext += `\nRequirements:\n${task.requirements.map(r => `- ${r}`).join('\n')}`;
        }
      }
    }

    const reply = await groqService.chatMentorResponse(taskContext, message.trim(), history);

    res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error('chatMentor error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentor chat failed',
      error: error.message,
    });
  }
});

module.exports = router;
