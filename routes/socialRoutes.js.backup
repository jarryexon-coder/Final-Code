import express from 'express';
import * as socialController from '../controllers/social.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Selection Sharing
router.post('/share/selection', auth, socialController.shareSelection);
router.get('/share/:shareId', socialController.getSharedSelection);
router.delete('/share/:shareId', auth, socialController.deleteSharedSelection);

// Likes & Engagement
router.post('/like/selection', auth, socialController.likeSelection);
router.post('/unlike/selection', auth, socialController.unlikeSelection);
router.get('/likes/selection/:selectionId', socialController.getSelectionLikes);
router.get('/likes/my', auth, socialController.getMyLikes);

// Trending Content
router.get('/trending/prizepicks', socialController.getTrendingSelections);
router.get('/trending/users', socialController.getTrendingUsers);
router.get('/trending/sports', socialController.getTrendingSports);

// Comments & Feedback
router.post('/comment/selection', auth, socialController.commentOnSelection);
router.get('/comments/selection/:selectionId', socialController.getSelectionComments);
router.delete('/comment/:commentId', auth, socialController.deleteComment);

// User Profiles
router.get('/profile/:username', socialController.getPublicProfile);
router.get('/profile/:username/selections', socialController.getUserSelections);

// Follow System
router.post('/follow/:userId', auth, socialController.followUser);
router.post('/unfollow/:userId', auth, socialController.unfollowUser);
router.get('/followers', auth, socialController.getFollowers);
router.get('/following', auth, socialController.getFollowing);

export default router;
