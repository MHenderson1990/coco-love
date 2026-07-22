const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const affirmationController = require('../controllers/affirmation.controller');

router.get('/today', auth, affirmationController.getToday);
router.get('/history', auth, affirmationController.getHistory);

module.exports = router;