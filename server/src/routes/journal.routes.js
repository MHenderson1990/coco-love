let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth.middleware');
let journalController = require('../controllers/journal.controller');

router.post('/', auth, journalController.create);
router.get('/', auth, journalController.list);
router.patch('/:id', auth, journalController.update);
router.delete('/:id', auth, journalController.remove);

module.exports = router;