const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const favoriteController = require('../controllers/favorite.controller');

router.post('/', auth, favoriteController.add);
router.get('/', auth, favoriteController.list);
router.delete('/:affirmationId', auth, favoriteController.remove);

module.exports = router;