const express = require('express');
const app = express();
const routes = require('./routes');
const ApiError = require('./utils/ApiError');
const errorHandler = require('./middleware/error.middleware');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

app.use(express.json());
app.use(helmet());
app.use(cors()); // open for now; lock to the app's origin at deploy time

// throttle auth routes against brute-force
let authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Try again later.' },
});
app.use('/api/auth', authLimiter);
app.use('/api', routes);
// unknown route → 404 through the same handler
app.use((req, res, next) => {
  next(new ApiError(404, 'Not found'));
});

app.use(errorHandler);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;