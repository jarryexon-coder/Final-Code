// src/utils/apiTester.js
// Test utility for API connection, caching, and debugging

import apiService from '../services/Api';
import { NBAService } from '../services/nbaService';
import { NFLService } from '../services/nflService';
import { NHLService } from '../services/nhlService';
import { NewsService } from '../services/newsService';

export const ApiTester = {
  // Test basic connection to your backend
  async testBackendConnection() {
    console.log('🔧 Testing backend connection...');
    
    try {
      const result = await apiService.testConnection();
      console.log('✅ Connection test result:', result);
      
      if (result.success) {
        console.log(`🌐 Connected to: ${result.baseUrl}`);
        console.log(`⚡ Latency: ${result.latency}`);
        console.log(`🔄 Status: ${result.status}`);
      } else {
        console.error('❌ Connection failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Test all sports services
  async testAllSportsServices() {
    console.log('🏀 Testing all sports services...');
    
    const results = {};
    
    // Test NBA Service
    try {
      console.log('🏀 Testing NBA Service...');
      const nbaGames = await NBAService.getTodaysGames();
      results.nba = {
        success: true,
        gameCount: nbaGames.games?.length || 0,
        source: nbaGames.source,
        message: `Found ${nbaGames.games?.length || 0} NBA games`
      };
      console.log('✅ NBA Service:', results.nba.message);
    } catch (error) {
      results.nba = { success: false, error: error.message };
      console.error('❌ NBA Service failed:', error.message);
    }

    // Test NFL Service
    try {
      console.log('🏈 Testing NFL Service...');
      const nflGames = await NFLService.getGames();
      results.nfl = {
        success: true,
        gameCount: nflGames.games?.length || 0,
        source: nflGames.source,
        message: `Found ${nflGames.games?.length || 0} NFL games`
      };
      console.log('✅ NFL Service:', results.nfl.message);
    } catch (error) {
      results.nfl = { success: false, error: error.message };
      console.error('❌ NFL Service failed:', error.message);
    }

    // Test NHL Service
    try {
      console.log('🏒 Testing NHL Service...');
      const nhlLatest = await NHLService.getLatest();
      results.nhl = {
        success: true,
        gameCount: nhlLatest.games?.length || 0,
        source: nhlLatest.source,
        message: `Found ${nhlLatest.games?.length || 0} NHL games`
      };
      console.log('✅ NHL Service:', results.nhl.message);
    } catch (error) {
      results.nhl = { success: false, error: error.message };
      console.error('❌ NHL Service failed:', error.message);
    }

    // Test News Service
    try {
      console.log('📰 Testing News Service...');
      const latestNews = await NewsService.getLatestNews(3);
      results.news = {
        success: true,
        articleCount: latestNews.articles?.length || 0,
        source: latestNews.source,
        message: `Found ${latestNews.articles?.length || 0} news articles`
      };
      console.log('✅ News Service:', results.news.message);
    } catch (error) {
      results.news = { success: false, error: error.message };
      console.error('❌ News Service failed:', error.message);
    }

    // Summary
    const successCount = Object.values(results).filter(r => r.success).length;
    console.log(`📊 Test Summary: ${successCount}/${Object.keys(results).length} services working`);
    
    return results;
  },

  // Test caching functionality
  async testCacheOperations() {
    console.log('💾 Testing cache operations...');
    
    try {
      // 1. Make a request that should be cached
      console.log('1️⃣ Making initial cached request...');
      const startTime1 = Date.now();
      const firstCall = await NBAService.getTodaysGames();
      const latency1 = Date.now() - startTime1;
      
      // 2. Make the same request again (should be cached)
      console.log('2️⃣ Making same request (should be cached)...');
      const startTime2 = Date.now();
      const secondCall = await NBAService.getTodaysGames();
      const latency2 = Date.now() - startTime2;
      
      // 3. Check cache stats
      const cacheStats = apiService.getCacheStats();
      
      // 4. Clear NBA cache
      console.log('3️⃣ Clearing NBA cache...');
      NBAService.refreshGames();
      
      // 5. Make request after cache clear
      console.log('4️⃣ Making request after cache clear...');
      const startTime3 = Date.now();
      const thirdCall = await NBAService.getTodaysGames();
      const latency3 = Date.now() - startTime3;
      
      const results = {
        initialRequest: {
          latency: `${latency1}ms`,
          gameCount: firstCall.games?.length || 0,
          cached: false
        },
        cachedRequest: {
          latency: `${latency2}ms`,
          speedImprovement: `${Math.round((latency1 - latency2) / latency1 * 100)}% faster`,
          cached: true
        },
        afterClear: {
          latency: `${latency3}ms`,
          gameCount: thirdCall.games?.length || 0,
          cached: false
        },
        cacheStats
      };
      
      console.log('✅ Cache test results:', results);
      return results;
    } catch (error) {
      console.error('❌ Cache test failed:', error);
      return { error: error.message };
    }
  },

  // Clear specific caches
  clearCacheBySport(sport) {
    console.log(`🗑️ Clearing cache for ${sport}...`);
    
    switch(sport.toLowerCase()) {
      case 'nba':
        NBAService.refreshAll();
        break;
      case 'nfl':
        NFLService.refreshAll();
        break;
      case 'nhl':
        NHLService.refreshAll();
        break;
      case 'news':
        NewsService.refreshNews();
        break;
      case 'all':
        apiService.clearCache();
        console.log('🗑️ All cache cleared');
        break;
      default:
        console.warn(`⚠️ Unknown sport: ${sport}`);
    }
    
    return { success: true, message: `Cleared ${sport} cache` };
  },

  // Get current cache status
  getCacheStatus() {
    const stats = apiService.getCacheStats();
    
    console.log('📊 Current cache status:');
    console.log(`   Total entries: ${stats.totalEntries}`);
    console.log(`   Cache size: ${Math.round(stats.totalSize / 1024)}KB`);
    console.log(`   Cached keys:`, stats.keys);
    
    return stats;
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Running all API tests...');
    console.log('='.repeat(50));
    
    const results = {
      timestamp: new Date().toISOString(),
      backend: await this.testBackendConnection(),
      sportsServices: await this.testAllSportsServices(),
      cache: await this.testCacheOperations(),
      finalCacheStatus: this.getCacheStatus()
    };
    
    // Generate summary
    const workingServices = Object.values(results.sportsServices).filter(s => s.success).length;
    const totalServices = Object.keys(results.sportsServices).length;
    
    console.log('='.repeat(50));
    console.log('📋 TEST SUMMARY:');
    console.log(`   Backend: ${results.backend.success ? '✅ Connected' : '❌ Failed'}`);
    console.log(`   Services: ${workingServices}/${totalServices} working`);
    console.log(`   Cache: ${results.cache.error ? '❌ Failed' : '✅ Working'}`);
    console.log('='.repeat(50));
    
    return results;
  }
};

export default ApiTester;
