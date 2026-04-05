const router = require('express').Router();
const mongoose = require('mongoose');
const verify = require('../verifyToken');
const ContentReview = require('../models/ContentReview');
const Movie = require('../models/Movie');
const Profile = require('../models/Profile');
const { assertProfileOwner } = require('../utils/profileOwnership');

function sendError(res, status, code, message) {
  return res.status(status).json({ code, message });
}

router.get('/content/:contentId', verify, async (req, res) => {
  const { contentId } = req.params;
  const { profileId, page = 1, limit = 20 } = req.query;
  const pageN = Math.max(parseInt(page, 10) || 1, 1);
  const limitN = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (pageN - 1) * limitN;

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return sendError(res, 400, 'BAD_REQUEST', 'Invalid contentId');
  }

  try {
    const movie = await Movie.findById(contentId);
    if (!movie) return sendError(res, 404, 'NOT_FOUND', 'Content not found');

    const [agg, total, items, mine] = await Promise.all([
      ContentReview.aggregate([
        { $match: { contentId: new mongoose.Types.ObjectId(contentId) } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]),
      ContentReview.countDocuments({ contentId }),
      ContentReview.aggregate([
        { $match: { contentId: new mongoose.Types.ObjectId(contentId) } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitN },
        {
          $lookup: {
            from: 'profiles',
            localField: 'profileId',
            foreignField: '_id',
            as: 'p',
          },
        },
        {
          $project: {
            _id: 1,
            rating: 1,
            text: 1,
            createdAt: 1,
            profileId: 1,
            profileName: { $arrayElemAt: ['$p.name', 0] },
          },
        },
      ]),
      profileId && mongoose.Types.ObjectId.isValid(profileId)
        ? ContentReview.findOne({
            contentId,
            profileId,
          }).lean()
        : null,
    ]);

    const summary = agg[0] || { averageRating: null, count: 0 };

    res.status(200).json({
      averageRating:
        summary.averageRating != null
          ? Math.round(summary.averageRating * 10) / 10
          : null,
      count: total,
      items,
      myReview: mine,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'REVIEWS_FETCH_FAILED', 'Failed to load reviews');
  }
});

router.post('/content/:contentId', verify, async (req, res) => {
  const { contentId } = req.params;
  const { profileId, rating, text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return sendError(res, 400, 'BAD_REQUEST', 'Invalid contentId');
  }
  if (!profileId) {
    return sendError(res, 400, 'BAD_REQUEST', 'profileId is required');
  }

  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return sendError(res, 400, 'BAD_REQUEST', 'rating must be integer 1–5');
  }
  const body = String(text || '').trim();
  if (body.length < 1) {
    return sendError(res, 400, 'BAD_REQUEST', 'text is required');
  }

  try {
    const isOwner = await assertProfileOwner(Profile, profileId, req.user.id);
    if (!isOwner) {
      return sendError(res, 403, 'FORBIDDEN', 'Not authorized for this profile');
    }

    const movie = await Movie.findById(contentId);
    if (!movie) return sendError(res, 404, 'NOT_FOUND', 'Content not found');

    const doc = await ContentReview.create({
      profileId,
      userId: req.user.id,
      contentId,
      rating: r,
      text: body,
    });

    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) {
      return sendError(
        res,
        409,
        'DUPLICATE',
        'Profile already reviewed this title — use PUT to update'
      );
    }
    console.error(err);
    sendError(res, 500, 'REVIEW_CREATE_FAILED', 'Failed to create review');
  }
});

router.put('/content/:contentId', verify, async (req, res) => {
  const { contentId } = req.params;
  const { profileId, rating, text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return sendError(res, 400, 'BAD_REQUEST', 'Invalid contentId');
  }
  if (!profileId) {
    return sendError(res, 400, 'BAD_REQUEST', 'profileId is required');
  }

  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return sendError(res, 400, 'BAD_REQUEST', 'rating must be integer 1–5');
  }
  const body = String(text || '').trim();
  if (body.length < 1) {
    return sendError(res, 400, 'BAD_REQUEST', 'text is required');
  }

  try {
    const isOwner = await assertProfileOwner(Profile, profileId, req.user.id);
    if (!isOwner) {
      return sendError(res, 403, 'FORBIDDEN', 'Not authorized for this profile');
    }

    const updated = await ContentReview.findOneAndUpdate(
      { contentId, profileId, userId: req.user.id },
      { $set: { rating: r, text: body } },
      { new: true }
    );

    if (!updated) {
      return sendError(res, 404, 'NOT_FOUND', 'No review to update');
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'REVIEW_UPDATE_FAILED', 'Failed to update review');
  }
});

router.delete('/content/:contentId', verify, async (req, res) => {
  const { contentId } = req.params;
  const { profileId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return sendError(res, 400, 'BAD_REQUEST', 'Invalid contentId');
  }
  if (!profileId) {
    return sendError(res, 400, 'BAD_REQUEST', 'profileId is required');
  }

  try {
    const isOwner = await assertProfileOwner(Profile, profileId, req.user.id);
    if (!isOwner) {
      return sendError(res, 403, 'FORBIDDEN', 'Not authorized for this profile');
    }

    const del = await ContentReview.findOneAndDelete({
      contentId,
      profileId,
      userId: req.user.id,
    });

    if (!del) {
      return sendError(res, 404, 'NOT_FOUND', 'No review to delete');
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'REVIEW_DELETE_FAILED', 'Failed to delete review');
  }
});

module.exports = router;
