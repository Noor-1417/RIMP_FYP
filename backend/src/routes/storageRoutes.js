const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');

router.post('/presigned', storageController.getPresigned);

module.exports = router;
