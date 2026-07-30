let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth.middleware');
let journalController = require('../controllers/journal.controller');

router.post('/', auth, journalController.create);
router.get('/', auth, journalController.list);
router.get('/upload-signature', auth, journalController.uploadSignature);
router.post('/media/destroy', auth, journalController.destroyMedia);
router.post('/voice/presign-upload', auth, journalController.presignVoiceUpload);
router.get('/voice/play', auth, journalController.presignVoicePlay);
router.patch('/:id', auth, journalController.update);
router.delete('/:id', auth, journalController.remove);

module.exports = router;