let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth.middleware');
let admin = require('../middleware/admin.middleware');
let fallbackController = require('../controllers/fallback.controller');

router.get('/', auth, admin, fallbackController.list);
router.post('/', auth, admin, fallbackController.create);
router.patch('/:id', auth, admin, fallbackController.update);
router.delete('/:id', auth, admin, fallbackController.remove);

module.exports = router;