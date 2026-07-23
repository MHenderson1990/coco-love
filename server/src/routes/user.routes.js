const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

router.get('/me', auth, userController.getMe);
router.post('/checkin', auth, userController.checkIn);
router.patch('/me', auth, userController.updateMe);

module.exports = router;