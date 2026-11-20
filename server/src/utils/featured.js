let Audio = require('../models/Audio');
let Video = require('../models/Video');

// only one featured item per section: one video and one audio
exports.clearFeatured = async (kind, exceptId) => {
  let Model = kind === 'audio' ? Audio : Video;
  await Model.updateMany({ featured: true, _id: { $ne: exceptId } }, { featured: false });
};