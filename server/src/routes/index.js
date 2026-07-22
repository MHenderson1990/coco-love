const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const affirmationRoutes = require('./affirmation.routes');
const favoriteRoutes = require('./favorite.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/affirmations', affirmationRoutes);
router.use('/favorites', favoriteRoutes);

module.exports = router;