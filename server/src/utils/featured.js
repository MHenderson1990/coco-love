let Audio = require('../models/Audio');
let Video = require('../models/Video');

// only one item across videos and audio can be featured at a time
exports.clearFeatured = async (exceptId) => {
  await Promise.all([
    Audio.updateMany({ featured: true, _id: { $ne: exceptId } }, { featured: false }),
    Video.updateMany({ featured: true, _id: { $ne: exceptId } }, { featured: false }),
  ]);
};