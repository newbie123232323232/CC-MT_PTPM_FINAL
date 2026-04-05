const router = require('express').Router();
const verify = require('../verifyToken');
const Series = require('../models/Series');
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const { notifyNewEpisode } = require('../services/notificationService');

router.post('/', verify, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json('Not authorized to create episode');
  const { seriesId, seasonId } = req.body;
  try {
    const [series, season] = await Promise.all([
      Series.findById(seriesId),
      Season.findById(seasonId),
    ]);
    if (!series) return res.status(404).json('Series not found');
    if (!season) return res.status(404).json('Season not found');
    const saved = await new Episode(req.body).save();
    await notifyNewEpisode(series, saved);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/:id', verify, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json('Not authorized to update episode');
  try {
    const updated = await Episode.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/:id', verify, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json('Not authorized to delete episode');
  try {
    await Episode.findByIdAndDelete(req.params.id);
    res.status(200).json('Episode deleted successfully');
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/', verify, async (req, res) => {
  const { seasonId, seriesId } = req.query;
  try {
    const query = {};
    if (seasonId) query.seasonId = seasonId;
    if (seriesId) query.seriesId = seriesId;
    const items = await Episode.find(query).sort({ episodeNumber: 1 });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
