let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth.middleware');
let promoController = require('../controllers/promo.controller');

router.get('/', auth, promoController.getMyPromo);

module.exports = router;