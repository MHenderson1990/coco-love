let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth.middleware');
let admin = require('../middleware/admin.middleware');
let audioController = require('../controllers/audio.controller');

router.post('/upload-url', auth, admin, audioController.uploadUrl);
router.post('/', auth, admin, audioController.create);
router.get('/', auth, audioController.list);
router.get('/:id/play', auth, audioController.play);
router.patch('/:id', auth, admin, audioController.update);
router.delete('/:id', auth, admin, audioController.remove);

module.exports = router;