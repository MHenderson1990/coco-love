let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth.middleware');
let admin = require('../middleware/admin.middleware');
let videoController = require('../controllers/video.controller');

router.post('/', auth, admin, videoController.create);
router.get('/', auth, videoController.list);
router.get('/:id', auth, videoController.getOne);
router.delete('/:id', auth, admin, videoController.remove);

module.exports = router;