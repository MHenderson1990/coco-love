let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth.middleware');
let admin = require('../middleware/admin.middleware');
let adminController = require('../controllers/admin.controller');

router.get('/stats', auth, admin, adminController.stats);
router.get('/affirmations/top', auth, admin, adminController.topAffirmations);
router.post('/notifications/run', auth, admin, adminController.runNotifications);

module.exports = router;