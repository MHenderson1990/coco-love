let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth.middleware');
let admin = require('../middleware/admin.middleware');
let affirmationController = require('../controllers/affirmation.controller');

router.get('/today', auth, affirmationController.getToday);
router.get('/history', auth, affirmationController.getHistory);
router.get('/all', auth, admin, affirmationController.listAll);

router.post('/', auth, admin, affirmationController.create);
router.patch('/:id', auth, admin, affirmationController.update);
router.delete('/:id', auth, admin, affirmationController.remove);

module.exports = router;