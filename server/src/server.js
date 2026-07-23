const app = require('./app');
const connectDB = require('./config/db');
const { port } = require('./config/env');
const dailyAffirmationJob = require('./jobs/dailyAffirmation.job');

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
connectDB().then(() => {
  dailyAffirmationJob.start();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});