import express from 'express';
import * as searchController from '../controllers/search.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Search operations
router.post('/query', auth, searchController.searchPrizePicks);
router.get('/history', auth, searchController.getSearchHistory);
router.delete('/history/:id', auth, searchController.deleteSearchHistory);
router.delete('/history', auth, searchController.clearSearchHistory);

// Advanced search filters
router.post('/advanced', auth, searchController.advancedSearch);
router.get('/filters', auth, searchController.getAvailableFilters);
router.post('/filters/save', auth, searchController.saveSearchFilter);

// Search suggestions & autocomplete
router.get('/suggestions', searchController.getSearchSuggestions);
router.get('/autocomplete', searchController.getAutocomplete);
router.get('/trending', searchController.getTrendingSearches);

// Player-specific searches
router.get('/players/:name', auth, searchController.searchByPlayer);
router.get('/sports/:sport', auth, searchController.searchBySport);
router.get('/type/:type', auth, searchController.searchByType);

// Custom search queries
router.post('/custom', auth, searchController.customSearch);
router.get('/custom/saved', auth, searchController.getSavedSearches);
router.post('/custom/save', auth, searchController.saveCustomSearch);

// Search analytics
router.get('/analytics/popular', auth, searchController.getPopularSearches);
router.get('/analytics/performance', auth, searchController.getSearchPerformance);

export default router;
