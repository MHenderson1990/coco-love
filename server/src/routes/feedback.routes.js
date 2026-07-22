let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth.middleware');
let feedbackController = require('../controllers/feedback.controller');

router.post('/', auth, feedbackController.submit);

module.exports = router;