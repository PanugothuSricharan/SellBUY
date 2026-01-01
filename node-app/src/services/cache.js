const User = require("../models/User");
const { BLOCKED_USERS_CACHE_TTL_MS } = require("../config/constants");

/**
 * Blocked Users Cache Service
 * Caches blocked user IDs to avoid repeated database queries
 */

let blockedUsersCache = {
  ids: [],
  lastFetched: 0,
};

/**
 * Get cached blocked user IDs
 * Returns cached data if valid, otherwise fetches fresh data
 */
const getBlockedUserIds = async () => {
  const now = Date.now();
  
  // Return cached data if cache is valid (has been fetched and not expired)
  if (blockedUsersCache.lastFetched > 0 && 
      (now - blockedUsersCache.lastFetched) < BLOCKED_USERS_CACHE_TTL_MS) {
    return blockedUsersCache.ids;
  }
  
  // Fetch fresh data
  const blockedUsers = await User.find({ isBlocked: true }).select("_id").lean();
  blockedUsersCache.ids = blockedUsers.map(u => u._id);
  blockedUsersCache.lastFetched = now;
  
  return blockedUsersCache.ids;
};

/**
 * Invalidate the blocked users cache
 * Call this when a user is blocked/unblocked
 */
const invalidateBlockedUsersCache = () => {
  blockedUsersCache.lastFetched = 0;
  blockedUsersCache.ids = [];
};

module.exports = {
  getBlockedUserIds,
  invalidateBlockedUsersCache,
};
