const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const affirmationRoutes = require('./affirmation.routes');
const favoriteRoutes = require('./favorite.routes');
const feedbackRoutes = require('./feedback.routes');
const journalRoutes = require('./journal.routes');
const announcementRoutes = require('./announcement.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/affirmations', affirmationRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/journal', journalRoutes);
router.use('/announcements', announcementRoutes);

module.exports = router;