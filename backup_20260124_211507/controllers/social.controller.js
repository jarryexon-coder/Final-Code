// controllers/social.controller.js - COMPLETE VERSION
import Post from '../models/Post.js';
import User from '../models/user.js';
import Follow from '../models/Follow.js';
import Notification from '../models/Notification.js';
import { redisClient } from '../config/redis.js';

// Get social feed
export const getSocialFeed = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const {
      type = 'following', // following, trending, recent, user
      userId: targetUserId,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};
    let sort = { createdAt: -1 };

    if (type === 'following') {
      // Get users that current user is following
      const following = await Follow.find({ follower: userId })
        .select('following')
        .lean();
      
      const followingIds = following.map(f => f.following);
      followingIds.push(userId); // Include user's own posts

      query.userId = { $in: followingIds };
      query.visibility = { $in: ['public', 'followers'] };
    } else if (type === 'trending') {
      // Trending posts (most likes/comments in last 24h)
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24);
      
      query.createdAt = { $gte: cutoffDate };
      query.visibility = 'public';
      
      // Sort by engagement score
      sort = { engagementScore: -1 };
    } else if (type === 'recent') {
      // All recent public posts
      query.visibility = 'public';
    } else if (type === 'user' && targetUserId) {
      // Specific user's posts
      query.userId = targetUserId;
      query.visibility = { $in: ['public', 'followers'] };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid feed type or missing user ID'
      });
    }

    // Get posts
    const posts = await Post.find(query)
      .populate('userId', 'username name avatar')
      .populate('likes', 'username name')
      .populate('comments.userId', 'username name avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Calculate engagement metrics for each post
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const engagement = await calculatePostEngagement(post._id);
        const userLiked = post.likes.some(like => 
          like._id.toString() === userId.toString()
        );
        const userCommented = post.comments.some(comment =>
          comment.userId._id.toString() === userId.toString()
        );

        return {
          ...post,
          engagement,
          userInteraction: {
            liked: userLiked,
            commented: userCommented,
            saved: false // You would check from saved posts collection
          }
        };
      })
    );

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: {
        feedType: type,
        posts: enrichedPosts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        metadata: {
          followingCount: type === 'following' ? 
            await Follow.countDocuments({ follower: userId }) : null,
          trendingCount: type === 'trending' ? 
            await Post.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }, visibility: 'public' }) : null
        }
      }
    });
  } catch (error) {
    console.error('Get social feed error:', error);
    res.status(500).json({ success: false, message: 'Failed to get social feed', error: error.message });
  }
};

// Post to feed
export const postToFeed = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const {
      content,
      media = [],
      visibility = 'public',
      tags = [],
      mentions = [],
      location,
      selectionId,
      gameId
    } = req.body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot be empty'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Post content exceeds maximum length of 1000 characters'
      });
    }

    // Create post
    const post = new Post({
      userId,
      content: content.trim(),
      media,
      visibility,
      tags,
      mentions,
      location,
      selectionId,
      gameId,
      engagementScore: 0
    });

    await post.save();

    // Populate for response
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'username name avatar')
      .lean();

    // Clear feed cache for user and followers
    if (redisClient) {
      const cacheKeys = [
        `feed:${userId}:*`,
        `user_posts:${userId}:*`
      ];
      
      // Get followers to clear their cache too
      const followers = await Follow.find({ following: userId })
        .select('follower')
        .lean();
      
      followers.forEach(follower => {
        cacheKeys.push(`feed:${follower.follower}:*`);
      });

      for (const pattern of cacheKeys) {
        const keys = await redisClient.keys(pattern);
        for (const key of keys) {
          await redisClient.del(key);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: populatedPost
    });
  } catch (error) {
    console.error('Post to feed error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post', error: error.message });
  }
};

// Like post
export const likePost = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user can view post
    if (!canUserViewPost(post, userId)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot like this post'
      });
    }

    // Check if already liked
    const alreadyLiked = post.likes.includes(userId);
    
    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(likeId => 
        likeId.toString() !== userId.toString()
      );
    } else {
      // Like
      post.likes.push(userId);
    }

    // Update engagement score
    post.engagementScore = calculateEngagementScore(
      post.likes.length,
      post.comments.length,
      post.shares || 0
    );

    await post.save();

    // Send notification to post owner if liking (not unliking)
    if (!alreadyLiked && post.userId.toString() !== userId.toString()) {
      await createNotification({
        userId: post.userId,
        type: 'post_like',
        data: {
          postId: post._id,
          likedBy: userId,
          postContent: post.content.substring(0, 100)
        },
        read: false
      });
    }

    res.json({
      success: true,
      message: alreadyLiked ? 'Post unliked' : 'Post liked',
      data: {
        postId: post._id,
        liked: !alreadyLiked,
        likesCount: post.likes.length,
        engagementScore: post.engagementScore
      }
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: 'Failed to like post', error: error.message });
  }
};

// Comment on post
export const commentOnPost = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty'
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment exceeds maximum length of 500 characters'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user can comment on post
    if (!canUserViewPost(post, userId)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot comment on this post'
      });
    }

    // Create comment
    const comment = {
      userId,
      content: content.trim(),
      parentCommentId: parentCommentId || null,
      createdAt: new Date(),
      likes: [],
      replies: []
    };

    // Add to post
    if (parentCommentId) {
      // Find parent comment and add reply
      const parentComment = post.comments.id(parentCommentId);
      if (parentComment) {
        parentComment.replies.push(comment);
      } else {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    } else {
      post.comments.push(comment);
    }

    // Update engagement score
    post.engagementScore = calculateEngagementScore(
      post.likes.length,
      post.comments.length,
      post.shares || 0
    );

    await post.save();

    // Send notification to post owner and parent commenter
    if (post.userId.toString() !== userId.toString()) {
      await createNotification({
        userId: post.userId,
        type: 'post_comment',
        data: {
          postId: post._id,
          commentedBy: userId,
          commentContent: content.substring(0, 100)
        },
        read: false
      });
    }

    if (parentCommentId) {
      const parentComment = post.comments.id(parentCommentId);
      if (parentComment && parentComment.userId.toString() !== userId.toString()) {
        await createNotification({
          userId: parentComment.userId,
          type: 'comment_reply',
          data: {
            postId: post._id,
            commentId: parentCommentId,
            repliedBy: userId,
            replyContent: content.substring(0, 100)
          },
          read: false
        });
      }
    }

    // Get updated post with populated comments
    const updatedPost = await Post.findById(postId)
      .populate('comments.userId', 'username name avatar')
      .populate('comments.replies.userId', 'username name avatar')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        postId: post._id,
        comment,
        commentsCount: updatedPost.comments.length,
        engagementScore: updatedPost.engagementScore
      }
    });
  } catch (error) {
    console.error('Comment on post error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
};

// Share post
export const sharePost = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { postId } = req.params;
    const { content, visibility = 'public' } = req.body;

    const originalPost = await Post.findById(postId)
      .populate('userId', 'username name')
      .lean();

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Original post not found'
      });
    }

    // Check if user can view post
    if (!canUserViewPost(originalPost, userId)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot share this post'
      });
    }

    // Create shared post
    const sharedPost = new Post({
      userId,
      content: content || `Shared from @${originalPost.userId.username}`,
      sharedPost: postId,
      visibility,
      engagementScore: 0
    });

    await sharedPost.save();

    // Update original post share count
    await Post.findByIdAndUpdate(postId, {
      $inc: { shares: 1 }
    });

    // Send notification to original post owner
    if (originalPost.userId._id.toString() !== userId.toString()) {
      await createNotification({
        userId: originalPost.userId._id,
        type: 'post_share',
        data: {
          postId: originalPost._id,
          sharedBy: userId,
          shareContent: content || 'Shared your post'
        },
        read: false
      });
    }

    // Populate for response
    const populatedPost = await Post.findById(sharedPost._id)
      .populate('userId', 'username name avatar')
      .populate('sharedPost', 'content userId')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Post shared successfully',
      data: populatedPost
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ success: false, message: 'Failed to share post', error: error.message });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.userId || req.user?._id;

    const user = await User.findOne({ username })
      .select('-password -refreshToken')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user stats
    const [postCount, followerCount, followingCount, recentPosts] = await Promise.all([
      Post.countDocuments({ userId: user._id, visibility: 'public' }),
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
      Post.find({ userId: user._id, visibility: 'public' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('likes', 'username')
        .populate('comments.userId', 'username')
        .lean()
    ]);

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId) {
      const follow = await Follow.findOne({
        follower: currentUserId,
        following: user._id
      });
      isFollowing = !!follow;
    }

    // Get mutual follows
    let mutualCount = 0;
    if (currentUserId && currentUserId.toString() !== user._id.toString()) {
      const mutual = await getMutualFollows(currentUserId, user._id);
      mutualCount = mutual.length;
    }

    res.json({
      success: true,
      data: {
        user,
        stats: {
          posts: postCount,
          followers: followerCount,
          following: followingCount,
          mutualFollowers: mutualCount
        },
        recentPosts,
        relationship: {
          isFollowing,
          isSelf: currentUserId && currentUserId.toString() === user._id.toString(),
          canMessage: isFollowing || user._id.toString() === currentUserId?.toString()
        }
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user profile', error: error.message });
  }
};

// Follow user
export const followUser = async (req, res) => {
  try {
    const followerId = req.user.userId || req.user._id;
    const { userId: followingId } = req.params;

    // Check if trying to follow self
    if (followerId.toString() === followingId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    // Check if user exists
    const userToFollow = await User.findById(followingId);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User to follow not found'
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    // Create follow relationship
    const follow = new Follow({
      follower: followerId,
      following: followingId,
      createdAt: new Date()
    });

    await follow.save();

    // Send notification to user being followed
    await createNotification({
      userId: followingId,
      type: 'new_follower',
      data: {
        followerId,
        followerUsername: req.user.username
      },
      read: false
    });

    // Update cache
    if (redisClient) {
      await redisClient.del(`followers:${followingId}`);
      await redisClient.del(`following:${followerId}`);
      await redisClient.del(`feed:${followerId}:*`);
    }

    res.json({
      success: true,
      message: `Now following @${userToFollow.username}`,
      data: {
        follower: followerId,
        following: followingId,
        followId: follow._id,
        timestamp: follow.createdAt
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ success: false, message: 'Failed to follow user', error: error.message });
  }
};

// Unfollow user
export const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.userId || req.user._id;
    const { userId: followingId } = req.params;

    // Check if trying to unfollow self
    if (followerId.toString() === followingId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot unfollow yourself'
      });
    }

    // Remove follow relationship
    const result = await Follow.findOneAndDelete({
      follower: followerId,
      following: followingId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Not following this user'
      });
    }

    // Update cache
    if (redisClient) {
      await redisClient.del(`followers:${followingId}`);
      await redisClient.del(`following:${followerId}`);
      await redisClient.del(`feed:${followerId}:*`);
    }

    res.json({
      success: true,
      message: 'Unfollowed user successfully',
      data: {
        follower: followerId,
        following: followingId,
        unfollowedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ success: false, message: 'Failed to unfollow user', error: error.message });
  }
};

// Get followers
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId || req.user?._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    // Get followers
    const followers = await Follow.find({ following: userId })
      .populate('follower', 'username name avatar bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Follow.countDocuments({ following: userId });

    // Check if current user follows each follower
    const enrichedFollowers = await Promise.all(
      followers.map(async (follow) => {
        let isFollowingBack = false;
        if (currentUserId) {
          const followBack = await Follow.findOne({
            follower: currentUserId,
            following: follow.follower._id
          });
          isFollowingBack = !!followBack;
        }

        return {
          ...follow,
          isFollowingBack,
          followDate: follow.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        userId,
        followers: enrichedFollowers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        summary: {
          totalFollowers: total,
          mutualCount: await getMutualFollowersCount(userId, currentUserId)
        }
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ success: false, message: 'Failed to get followers', error: error.message });
  }
};

// Get following
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId || req.user?._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    // Get users being followed
    const following = await Follow.find({ follower: userId })
      .populate('following', 'username name avatar bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Follow.countDocuments({ follower: userId });

    // Check if current user follows each user
    const enrichedFollowing = await Promise.all(
      following.map(async (follow) => {
        let isFollowedBack = false;
        if (currentUserId) {
          const followBack = await Follow.findOne({
            follower: follow.following._id,
            following: currentUserId
          });
          isFollowedBack = !!followBack;
        }

        return {
          ...follow,
          isFollowedBack,
          followDate: follow.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        userId,
        following: enrichedFollowing,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        summary: {
          totalFollowing: total,
          mutualCount: await getMutualFollowingCount(userId, currentUserId)
        }
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ success: false, message: 'Failed to get following', error: error.message });
  }
};

// Get notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const {
      type = 'all',
      read = 'all',
      page = 1,
      limit = 20
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { userId };

    if (type !== 'all') query.type = type;
    if (read !== 'all') query.read = read === 'true';

    const notifications = await Notification.find(query)
      .populate('data.followerId', 'username name')
      .populate('data.likedBy', 'username name')
      .populate('data.commentedBy', 'username name')
      .populate('data.sharedBy', 'username name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(query);

    // Mark as read if specified
    if (req.query.markAsRead === 'true') {
      await Notification.updateMany(
        { userId, read: false },
        { read: true, readAt: new Date() }
      );
    }

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        unreadCount: await Notification.countDocuments({ userId, read: false }),
        summary: {
          totalNotifications: total,
          lastNotification: notifications[0]?.createdAt || null
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to get notifications', error: error.message });
  }
};

// Mark notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read', error: error.message });
  }
};

// Helper functions
const canUserViewPost = (post, userId) => {
  if (post.visibility === 'public') return true;
  if (post.visibility === 'private' && post.userId.toString() === userId.toString()) return true;
  if (post.visibility === 'followers') {
    // Check if user is following the post owner
    return Follow.exists({
      follower: userId,
      following: post.userId
    });
  }
  return false;
};

const calculatePostEngagement = async (postId) => {
  const post = await Post.findById(postId)
    .populate('likes', '_id')
    .populate('comments', '_id')
    .lean();

  if (!post) return { likes: 0, comments: 0, shares: 0, score: 0 };

  // Count total comments including replies
  let totalComments = post.comments.length;
  post.comments.forEach(comment => {
    totalComments += comment.replies ? comment.replies.length : 0;
  });

  const engagementScore = calculateEngagementScore(
    post.likes.length,
    totalComments,
    post.shares || 0
  );

  return {
    likes: post.likes.length,
    comments: totalComments,
    shares: post.shares || 0,
    score: engagementScore
  };
};

const calculateEngagementScore = (likes, comments, shares) => {
  // Simple engagement formula: likes + (comments * 2) + (shares * 3)
  return likes + (comments * 2) + (shares * 3);
};

const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();

    // Clear notification cache
    if (redisClient) {
      await redisClient.del(`notifications:${notificationData.userId}:unread`);
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

const getMutualFollows = async (userId1, userId2) => {
  // Get users that both userId1 and userId2 follow
  const user1Following = await Follow.find({ follower: userId1 })
    .select('following')
    .lean();
  const user2Following = await Follow.find({ follower: userId2 })
    .select('following')
    .lean();

  const user1FollowingIds = user1Following.map(f => f.following.toString());
  const user2FollowingIds = user2Following.map(f => f.following.toString());

  const mutualIds = user1FollowingIds.filter(id => 
    user2FollowingIds.includes(id)
  );

  // Get user details for mutual follows
  const mutualUsers = await User.find({ _id: { $in: mutualIds } })
    .select('username name avatar')
    .lean();

  return mutualUsers;
};

const getMutualFollowersCount = async (userId, currentUserId) => {
  if (!currentUserId) return 0;

  const userFollowers = await Follow.find({ following: userId })
    .select('follower')
    .lean();
  const currentUserFollowers = await Follow.find({ following: currentUserId })
    .select('follower')
    .lean();

  const userFollowerIds = userFollowers.map(f => f.follower.toString());
  const currentUserFollowerIds = currentUserFollowers.map(f => f.follower.toString());

  const mutualIds = userFollowerIds.filter(id => 
    currentUserFollowerIds.includes(id)
  );

  return mutualIds.length;
};

const getMutualFollowingCount = async (userId, currentUserId) => {
  if (!currentUserId) return 0;

  const userFollowing = await Follow.find({ follower: userId })
    .select('following')
    .lean();
  const currentUserFollowing = await Follow.find({ follower: currentUserId })
    .select('following')
    .lean();

  const userFollowingIds = userFollowing.map(f => f.following.toString());
  const currentUserFollowingIds = currentUserFollowing.map(f => f.following.toString());

  const mutualIds = userFollowingIds.filter(id => 
    currentUserFollowingIds.includes(id)
  );

  return mutualIds.length;
};

// Default export
export default {
  getSocialFeed,
  postToFeed,
  likePost,
  commentOnPost,
  sharePost,
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getNotifications,
  markNotificationRead
};
