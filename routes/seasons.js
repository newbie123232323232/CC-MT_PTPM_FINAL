const router = require('express').Router();
const verify = require('../verifyToken');
const Series = require('../models/Series');
const Season = require('../models/Season');
const Episode = require('../models/Episode');

router.post('/', verify, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json('Not authorized to create season');
  const { seriesId } = req.body;
  try {
    const series = await Series.findById(seriesId);
    if (!series) return res.status(404).json('Series not found');
    const saved = await new Season(req.body).save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/:id', verify, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json('Not authorized to update season');
  try {
    const updated = await Season.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/:id', verify, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json('Not authorized to delete season');
  try {
    await Promise.all([
      Season.findByIdAndDelete(req.params.id),
      Episode.deleteMany({ seasonId: req.params.id }),
    ]);
    res.status(200).json('Season deleted successfully');
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/', verify, async (req, res) => {
  const { seriesId } = req.query;
  try {
    const query = {};
    if (seriesId) query.seriesId = seriesId;
    const items = await Season.find(query).sort({ seasonNumber: 1 });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
