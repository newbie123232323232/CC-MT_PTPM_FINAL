async function assertProfileOwner(ProfileModel, profileId, userId) {
  if (!profileId) return false;
  const profile = await ProfileModel.findById(profileId);
  return Boolean(profile && String(profile.userId) === String(userId));
}

module.exports = { assertProfileOwner };
