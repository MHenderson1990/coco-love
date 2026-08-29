let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth.middleware');
let admin = require('../middleware/admin.middleware');
let adminController = require('../controllers/admin.controller');

router.get('/stats', auth, admin, adminController.stats);
router.get('/affirmations/engagement', auth, admin, adminController.affirmationEngagement);
router.get('/affirmations/:id/savers', auth, admin, adminController.affirmationSavers);
router.get('/users/:id/favorites', auth, admin, adminController.userFavorites);
router.get('/affirmations/top', auth, admin, adminController.topAffirmations);
router.post('/notifications/run', auth, admin, adminController.runNotifications);
router.get('/upload-signature', auth, admin, adminController.uploadSignature);
router.get('/promo', auth, admin, adminController.getPromo);
router.put('/promo', auth, admin, adminController.setPromo);

module.exports = router;