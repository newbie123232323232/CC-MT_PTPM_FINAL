const router = require('express').Router();
const Movie = require('../models/Movie');
const Profile = require('../models/Profile');
const verify = require('../verifyToken');
const { notifyNewRelease } = require('../services/notificationService');
const {
  buildProfileContentFilter,
  isContentAllowedForProfile,
} = require('../utils/contentPolicy');

// Create
router.post('/', verify, async (req, res) => {
  if (req.user.isAdmin) {
    const newMovie = new Movie(req.body);

    try {
      const savedMovie = await newMovie.save();
      try {
        await notifyNewRelease(savedMovie);
      } catch (nErr) {
        console.error('notifyNewRelease:', nErr);
      }
      res.status(201).json(savedMovie);
    } catch (err) {
      res.status(500).json({ message: err.message || String(err) });
    }
  } else {
    res.status(403).json('Not authorized to create movies');
  }
});

// Update
router.put('/:id', verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const updatedMovie = await Movie.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      res.status(200).json(updatedMovie);
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json('Not authorized to update movies');
  }
});

// Delete
router.delete('/:id', verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      await Movie.findByIdAndDelete(req.params.id);
      res.status(200).json('Movie deleted successfully');
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json('Not authorized to delete movies');
  }
});

// Get
router.get('/find/:id', verify, async (req, res) => {
  try {
    const { profileId } = req.query;
    let profile = null;
    if (profileId) {
      profile = await Profile.findById(profileId);
      if (!profile || String(profile.userId) !== req.user.id) {
        return res.status(403).json('Not authorized for this profile');
      }
    }
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json('Movie not found');
    }
    if (profile && !isContentAllowedForProfile(profile, movie)) {
      return res.status(403).json('Content blocked by maturity settings');
    }
    res.status(200).json(movie);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get random
router.get('/random', verify, async (req, res) => {
  const type = req.query.type;
  const { profileId } = req.query;
  let movie;
  try {
    let profile = null;
    if (profileId) {
      profile = await Profile.findById(profileId);
      if (!profile || String(profile.userId) !== req.user.id) {
        return res.status(403).json('Not authorized for this profile');
      }
    }

    const profileFilter = profile ? buildProfileContentFilter(profile) : {};

    if (type === 'series') {
      movie = await Movie.aggregate([
        { $match: { isSeries: true, ...profileFilter } },
        { $sample: { size: 1 } },
      ]);
    } else {
      movie = await Movie.aggregate([
        { $match: { isSeries: false, ...profileFilter } },
        { $sample: { size: 1 } },
      ]);
    }
    res.status(200).json(movie);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get all
router.get('/', verify, async (req, res) => {
  const query = req.query.new;

  if (req.user.isAdmin) {
    try {
      const movies = query
        ? await Movie.find().sort({ _id: -1 }).limit(5)
        : await Movie.find();
      res.status(200).json(movies.reverse());
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json('Not authorized to view all movies');
  }
});

module.exports = router;
