let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth.middleware');
let admin = require('../middleware/admin.middleware');
let announcementController = require('../controllers/announcement.controller');

router.post('/', auth, admin, announcementController.create);
router.get('/', auth, announcementController.list);

module.exports = router;