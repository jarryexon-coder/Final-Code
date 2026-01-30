// socialRoutes.js - Social Media & News Integration
import express from 'express';
import axios from 'axios';
const router = express.Router();
import cacheMiddleware from '../middleware/cacheMiddleware.js';

/**
 * @swagger
 * /api/social/news/nba:
 *   get:
 *     summary: Get NBA news for social sharing
 *     description: Fetch latest NBA news from News API optimized for social media sharing
 *     tags: [Social, News]
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of news articles to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevancy, popularity, publishedAt]
 *           default: publishedAt
 *         description: Sort order for news articles
 *       - in: query
 *         name: includeSocialData
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include social media optimization data
 *     responses:
 *       200:
 *         description: NBA news fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 news:
 *                   type: array
 *                   items:
 *                     type: object
 *                 socialOptimization:
 *                   type: object
 *                 totalResults:
 *                   type: integer
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Failed to fetch news from API
 */
router.get('/news/nba', cacheMiddleware(1800), async (req, res) => {
  try {
    const { pageSize = 10, page = 1, sortBy = 'publishedAt', includeSocialData = true } = req.query;
    
    if (!process.env.NEWS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'News API key not configured'
      });
    }
    
    console.log(`📰 Fetching NBA news - Page: ${page}, Size: ${pageSize}`);
    
    // Fetch NBA news from News API
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        apiKey: process.env.NEWS_API_KEY,
        q: 'NBA OR "National Basketball Association" OR basketball',
        language: 'en',
        sortBy: sortBy,
        pageSize: pageSize,
        page: page,
        domains: 'espn.com,nba.com,sports.yahoo.com,bleacherreport.com,theathletic.com',
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    });
    
    // Process and format news for social media
    const formattedNews = response.data.articles.map(article => {
      const socialOptimized = includeSocialData ? 
        optimizeForSocialMedia(article) : {};
      
      return {
        id: article.url ? Buffer.from(article.url).toString('base64').slice(0, 10) : Date.now().toString(),
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.urlToImage,
        source: article.source.name,
        publishedAt: article.publishedAt,
        contentPreview: article.content ? article.content.substring(0, 150) + '...' : '',
        engagementScore: calculateEngagementScore(article),
        shareabilityScore: calculateShareabilityScore(article),
        suggestedHashtags: generateHashtags(article.title, article.description),
        socialMediaCopy: generateSocialCopy(article.title, article.description),
        ...socialOptimized
      };
    });
    
    const responseData = {
      success: true,
      news: formattedNews,
      totalResults: response.data.totalResults,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      sortBy: sortBy,
      source: 'News API',
      lastUpdated: new Date().toISOString()
    };
    
    if (includeSocialData) {
      responseData.socialOptimization = {
        bestTimeToPost: calculateBestPostingTimes(),
        topPerformingHashtags: getTopHashtags(formattedNews),
        engagementTips: getEngagementTips()
      };
    }
    
    res.json(responseData);
    
  } catch (error) {
    console.error('NBA News API error:', error);
    
    // Fallback to sample NBA news
    const sampleNews = generateSampleNBANews();
    const fallbackData = {
      success: true,
      news: sampleNews,
      totalResults: sampleNews.length,
      page: 1,
      pageSize: parseInt(req.query.pageSize) || 10,
      source: 'Sample Data',
      lastUpdated: new Date().toISOString(),
      message: 'Using sample data due to API error: ' + error.message
    };
    
    if (req.query.includeSocialData !== 'false') {
      fallbackData.socialOptimization = {
        bestTimeToPost: ['7-9 PM EST', '12-2 PM EST'],
        topPerformingHashtags: ['#NBA', '#Basketball', '#Hoops'],
        engagementTips: ['Add emojis to increase engagement', 'Ask questions in your posts']
      };
    }
    
    res.json(fallbackData);
  }
});

/**
 * @swagger
 * /api/social/news/trending:
 *   get:
 *     summary: Get trending sports news for social media
 *     description: Fetch trending sports news optimized for social media engagement
 *     tags: [Social, News]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [sports, entertainment, technology, business]
 *           default: sports
 *         description: News category
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           default: us
 *         description: Country code for trending news
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of trending articles to return
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [twitter, instagram, facebook, tiktok, all]
 *           default: all
 *         description: Social media platform optimization
 *     responses:
 *       200:
 *         description: Trending news fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 trendingNews:
 *                   type: array
 *                   items:
 *                     type: object
 *                 platformOptimization:
 *                   type: object
 *       500:
 *         description: Failed to fetch trending news
 */
router.get('/news/trending', cacheMiddleware(900), async (req, res) => {
  try {
    const { category = 'sports', country = 'us', limit = 20, platform = 'all' } = req.query;
    
    if (!process.env.NEWS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'News API key not configured'
      });
    }
    
    console.log(`📈 Fetching trending ${category} news for ${platform}`);
    
    // Fetch trending news from News API
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        apiKey: process.env.NEWS_API_KEY,
        category: category,
        country: country,
        pageSize: limit,
        q: category === 'sports' ? 'basketball OR NBA OR sports OR football OR soccer' : undefined
      }
    });
    
    // Format trending news with platform-specific optimization
    const trendingNews = response.data.articles.map(article => {
      const platformOptimized = optimizeForPlatform(article, platform);
      
      return {
        id: article.url ? Buffer.from(article.url).toString('base64').slice(0, 10) : Date.now().toString(),
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.urlToImage,
        source: article.source.name,
        publishedAt: article.publishedAt,
        trendingRank: calculateTrendingRank(article.publishedAt, article.source.name),
        viralityScore: calculateViralityScore(article.title, article.description),
        platformSpecificCopy: generatePlatformCopy(article.title, platform),
        suggestedFormat: getSuggestedFormat(article, platform),
        engagementPredictions: predictEngagement(article, platform),
        ...platformOptimized
      };
    });
    
    // Sort by trending rank
    trendingNews.sort((a, b) => b.trendingRank - a.trendingRank);
    
    const responseData = {
      success: true,
      trendingNews: trendingNews,
      category: category,
      country: country,
      platform: platform,
      limit: parseInt(limit),
      totalResults: response.data.totalResults,
      trendingAnalysis: {
        hottestTopic: trendingNews[0]?.title || 'No trending topics',
        averageVirality: trendingNews.reduce((sum, item) => sum + item.viralityScore, 0) / trendingNews.length || 0,
        peakTime: calculatePeakEngagementTime()
      },
      lastUpdated: new Date().toISOString(),
      source: 'News API - Top Headlines'
    };
    
    responseData.platformOptimization = getPlatformOptimizationTips(platform);
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Trending News API error:', error);
    
    // Fallback to sample trending news
    const sampleTrendingNews = generateSampleTrendingNews();
    const platform = req.query.platform || 'all';
    
    res.json({
      success: true,
      trendingNews: sampleTrendingNews,
      category: req.query.category || 'sports',
      country: req.query.country || 'us',
      platform: platform,
      limit: parseInt(req.query.limit) || 20,
      totalResults: sampleTrendingNews.length,
      trendingAnalysis: {
        hottestTopic: sampleTrendingNews[0]?.title || 'Sample Trending Topic',
        averageVirality: 65,
        peakTime: '7-9 PM EST'
      },
      platformOptimization: getPlatformOptimizationTips(platform),
      lastUpdated: new Date().toISOString(),
      message: 'Using sample data due to API error: ' + error.message
    });
  }
});

/**
 * @swagger
 * /api/social/test:
 *   get:
 *     summary: Test social routes endpoint
 *     description: Verify that social routes are working correctly
 *     tags: [Social]
 *     responses:
 *       200:
 *         description: Social routes are working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 apiStatus:
 *                   type: object
 */
router.get('/test', (req, res) => {
  const apiStatus = {
    newsApi: !!process.env.NEWS_API_KEY,
    cacheMiddleware: typeof cacheMiddleware === 'function'
  };
  
  res.json({ 
    success: true, 
    message: 'socialRoutes.js is working',
    timestamp: new Date().toISOString(),
    apiStatus: apiStatus,
    endpoints: [
      '/api/social/news/nba',
      '/api/social/news/trending',
      '/api/social/test'
    ]
  });
});

/**
 * @swagger
 * /api/social/share/analysis:
 *   post:
 *     summary: Analyze content for social sharing
 *     description: Analyze content and provide social media sharing recommendations
 *     tags: [Social]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [twitter, instagram, facebook, linkedin, tiktok]
 *               contentType:
 *                 type: string
 *                 enum: [news, highlight, analysis, meme, poll]
 *     responses:
 *       200:
 *         description: Content analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analysis:
 *                   type: object
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Missing content parameter
 */
router.post('/share/analysis', async (req, res) => {
  try {
    const { content, platform = 'all', contentType = 'news' } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content parameter is required'
      });
    }
    
    const analysis = analyzeContentForSharing(content, platform, contentType);
    
    res.json({
      success: true,
      analysis: analysis,
      recommendations: generateSharingRecommendations(analysis, platform, contentType),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Content analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content for sharing'
    });
  }
});

/**
 * @swagger
 * /api/social/engagement/metrics:
 *   get:
 *     summary: Get social engagement metrics
 *     description: Retrieve social media engagement metrics and insights
 *     tags: [Social]
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: week
 *         description: Timeframe for metrics
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [all, twitter, instagram, facebook]
 *           default: all
 *         description: Social media platform
 *     responses:
 *       200:
 *         description: Engagement metrics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 metrics:
 *                   type: object
 *                 insights:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Failed to retrieve metrics
 */
router.get('/engagement/metrics', cacheMiddleware(3600), async (req, res) => {
  try {
    const { timeframe = 'week', platform = 'all' } = req.query;
    
    const metrics = await generateEngagementMetrics(timeframe, platform);
    
    res.json({
      success: true,
      metrics: metrics,
      insights: generateEngagementInsights(metrics),
      timeframe: timeframe,
      platform: platform,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Engagement metrics error:', error);
    
    // Return sample metrics
    res.json({
      success: true,
      metrics: generateSampleMetrics(req.query.timeframe || 'week'),
      insights: ['Post during peak hours (7-9 PM EST)', 'Use trending hashtags for better reach'],
      timeframe: req.query.timeframe || 'week',
      platform: req.query.platform || 'all',
      timestamp: new Date().toISOString(),
      message: 'Using sample metrics data'
    });
  }
});

// Helper Functions

function optimizeForSocialMedia(article) {
  return {
    twitterThread: generateTwitterThread(article.title, article.description),
    instagramCaption: generateInstagramCaption(article.title, article.description),
    facebookPost: generateFacebookPost(article.title, article.description),
    characterCounts: {
      twitter: article.title.length + (article.description ? article.description.substring(0, 280 - article.title.length - 5).length : 0),
      instagram: article.title.length + (article.description ? article.description.substring(0, 2200 - article.title.length).length : 0),
      facebook: article.title.length + (article.description ? article.description.substring(0, 63206 - article.title.length).length : 0)
    }
  };
}

function calculateEngagementScore(article) {
  let score = 50;
  
  // Title factors
  if (article.title && article.title.length > 30 && article.title.length < 70) score += 10;
  if (article.title && (article.title.includes('!') || article.title.includes('?'))) score += 5;
  
  // Content factors
  if (article.description && article.description.length > 100) score += 10;
  if (article.urlToImage) score += 15;
  
  // Source credibility
  const credibleSources = ['ESPN', 'NBA.com', 'The Athletic', 'Bleacher Report'];
  if (article.source && credibleSources.includes(article.source.name)) score += 10;
  
  return Math.min(score, 100);
}

function calculateShareabilityScore(article) {
  let score = 40;
  
  // Emotional appeal
  const emotionalWords = ['amazing', 'incredible', 'shocking', 'breaking', 'historic'];
  emotionalWords.forEach(word => {
    if (article.title && article.title.toLowerCase().includes(word)) score += 8;
  });
  
  // Timeliness
  const publishedDate = new Date(article.publishedAt);
  const hoursOld = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
  if (hoursOld < 2) score += 20;
  else if (hoursOld < 24) score += 10;
  
  // Visual appeal
  if (article.urlToImage) score += 15;
  
  return Math.min(score, 100);
}

function generateHashtags(title, description) {
  const hashtags = ['#NBA', '#Basketball'];
  const text = (title + ' ' + (description || '')).toLowerCase();
  
  const teamHashtags = {
    'lakers': '#Lakers',
    'warriors': '#Warriors',
    'celtics': '#Celtics',
    'bucks': '#Bucks',
    'nuggets': '#Nuggets',
    'knicks': '#Knicks'
  };
  
  Object.keys(teamHashtags).forEach(team => {
    if (text.includes(team)) {
      hashtags.push(teamHashtags[team]);
    }
  });
  
  const playerHashtags = {
    'lebron': '#LeBron',
    'curry': '#StephCurry',
    'giannis': '#Giannis',
    'jokic': '#Jokic',
    'luka': '#Luka'
  };
  
  Object.keys(playerHashtags).forEach(player => {
    if (text.includes(player)) {
      hashtags.push(playerHashtags[player]);
    }
  });
  
  if (text.includes('trade')) hashtags.push('#NBATrades');
  if (text.includes('injury')) hashtags.push('#InjuryReport');
  if (text.includes('draft')) hashtags.push('#NBADraft');
  if (text.includes('playoff')) hashtags.push('#Playoffs');
  
  return [...new Set(hashtags)].slice(0, 8);
}

function generateSocialCopy(title, description) {
  const baseCopy = title;
  const descriptionText = description ? description.substring(0, 100) : '';
  
  const copies = {
    twitter: baseCopy + (descriptionText ? `\n\n${descriptionText}` : ''),
    instagram: `${baseCopy}\n\n${descriptionText || ''}\n\n📊 #NBA #Basketball`,
    facebook: `${baseCopy}\n\n${description || ''}`,
    linkedin: `NBA Update: ${baseCopy}\n\n${description || ''}\n\n#NBA #SportsBusiness`
  };
  
  return copies;
}

function optimizeForPlatform(article, platform) {
  const optimizations = {};
  
  switch (platform) {
    case 'twitter':
      optimizations.optimalLength = Math.min(280, article.title.length + (article.description ? article.description.length : 0));
      optimizations.recommendedHashtags = generateHashtags(article.title, article.description).slice(0, 3);
      optimizations.threadPotential = article.description && article.description.length > 200;
      break;
      
    case 'instagram':
      optimizations.imageAspectRatio = '1:1 or 4:5 recommended';
      optimizations.captionLength = '2200 characters max';
      optimizations.storyPotential = true;
      optimizations.reelsPotential = article.urlToImage ? true : false;
      break;
      
    case 'facebook':
      optimizations.postType = 'Link post recommended';
      optimizations.engagementBait = 'Ask a question in comments';
      optimizations.shareability = 'High';
      break;
      
    case 'tiktok':
      optimizations.videoIdea = `Create a 60-second breakdown of: ${article.title.substring(0, 50)}`;
      optimizations.trendingSounds = 'Use trending basketball sounds';
      optimizations.hashtags = generateHashtags(article.title, article.description).slice(0, 5);
      break;
  }
  
  return optimizations;
}

function calculateTrendingRank(publishedAt, source) {
  const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  let rank = 100 - (hoursAgo * 5);
  
  const sourceWeight = {
    'ESPN': 1.3,
    'NBA.com': 1.4,
    'The Athletic': 1.2,
    'Bleacher Report': 1.1
  };
  
  rank *= sourceWeight[source] || 1.0;
  return Math.max(0, Math.min(100, rank));
}

function calculateViralityScore(title, description) {
  let score = 30;
  const text = (title + ' ' + (description || '')).toLowerCase();
  
  // Controversial topics
  const viralTriggers = ['breaking', 'shocking', 'exclusive', 'leaked', 'controversy', 'feud'];
  viralTriggers.forEach(trigger => {
    if (text.includes(trigger)) score += 10;
  });
  
  // Player mentions
  const starPlayers = ['lebron', 'curry', 'giannis', 'jokic', 'durant'];
  starPlayers.forEach(player => {
    if (text.includes(player)) score += 5;
  });
  
  // Question format
  if (title.includes('?')) score += 8;
  
  return Math.min(score, 100);
}

function generatePlatformCopy(title, platform) {
  const baseCopy = title;
  
  switch (platform) {
    case 'twitter':
      return `${baseCopy}\n👀 Thoughts?`;
    case 'instagram':
      return `${baseCopy}\n\nDouble tap if you agree! 👍\n\nComment below with your take! ⬇️`;
    case 'facebook':
      return `${basePost}\n\nWhat do you think about this? Share your thoughts in the comments!`;
    case 'tiktok':
      return `${baseCopy.substring(0, 50)}... #NBA #Basketball`;
    default:
      return baseCopy;
  }
}

function getSuggestedFormat(article, platform) {
  const formats = [];
  
  if (article.urlToImage) {
    formats.push('Image post');
    if (platform === 'instagram') formats.push('Carousel post');
    if (platform === 'tiktok') formats.push('Video slideshow');
  }
  
  if (article.description && article.description.length > 200) {
    formats.push('Thread/Tweetstorm');
  }
  
  if (platform === 'facebook') {
    formats.push('Link preview');
  }
  
  return formats.length > 0 ? formats : ['Text post'];
}

function predictEngagement(article, platform) {
  const baseEngagement = calculateEngagementScore(article);
  let platformMultiplier = 1.0;
  
  switch (platform) {
    case 'twitter': platformMultiplier = 1.2; break;
    case 'instagram': platformMultiplier = 1.5; break;
    case 'facebook': platformMultiplier = 0.8; break;
    case 'tiktok': platformMultiplier = 1.8; break;
  }
  
  const predicted = Math.round(baseEngagement * platformMultiplier);
  return Math.min(100, predicted);
}

function calculateBestPostingTimes() {
  const now = new Date();
  const hour = now.getHours();
  
  const bestTimes = [];
  
  // Based on social media analytics
  if (hour >= 7 && hour <= 9) bestTimes.push('Morning (7-9 AM)');
  if (hour >= 12 && hour <= 14) bestTimes.push('Lunch (12-2 PM)');
  if (hour >= 19 && hour <= 21) bestTimes.push('Evening (7-9 PM)');
  
  return bestTimes.length > 0 ? bestTimes : ['Evening (7-9 PM)', 'Lunch (12-2 PM)'];
}

function getTopHashtags(news) {
  const hashtagCount = {};
  
  news.forEach(item => {
    if (item.suggestedHashtags) {
      item.suggestedHashtags.forEach(tag => {
        hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
      });
    }
  });
  
  return Object.entries(hashtagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
}

function getEngagementTips() {
  return [
    'Use 1-2 relevant emojis in your posts',
    'Ask open-ended questions to encourage comments',
    'Tag relevant teams or players when appropriate',
    'Post during peak engagement hours (7-9 PM EST)',
    'Use trending hashtags but don\'t overdo it'
  ];
}

function getPlatformOptimizationTips(platform) {
  const tips = {
    all: {
      general: ['Post consistently', 'Engage with comments', 'Use high-quality images'],
      timing: 'Evenings and weekends see highest engagement'
    },
    twitter: {
      characterCount: 'Keep tweets under 280 characters',
      hashtags: 'Use 1-3 relevant hashtags',
      media: 'Tweets with images get 150% more engagement'
    },
    instagram: {
      captions: 'Write engaging captions with questions',
      hashtags: 'Use 5-10 relevant hashtags',
      stories: 'Use polls and questions in stories'
    },
    facebook: {
      posts: 'Link posts perform better than text-only',
      length: 'Longer posts (80+ words) perform better',
      videos: 'Native videos get more reach than links'
    },
    tiktok: {
      length: 'Keep videos 15-60 seconds',
      hashtags: 'Use 3-5 trending hashtags',
      sounds: 'Use trending sounds for better reach'
    }
  };
  
  return platform === 'all' ? tips.all : tips[platform] || tips.all;
}

function calculatePeakEngagementTime() {
  const times = [
    '7:00 PM - 9:00 PM EST',
    '12:00 PM - 2:00 PM EST',
    '9:00 AM - 11:00 AM EST'
  ];
  
  return times[Math.floor(Math.random() * times.length)];
}

// Analysis helper functions
function analyzeContentForSharing(content, platform, contentType) {
  const wordCount = content.split(/\s+/).length;
  const charCount = content.length;
  const hasEmojis = /\p{Emoji}/u.test(content);
  const hasQuestions = /[?]/.test(content);
  const hasExclamations = /[!]/.test(content);
  
  return {
    wordCount,
    charCount,
    readabilityScore: calculateReadability(content),
    emotionalTone: analyzeTone(content),
    hasEmojis,
    hasQuestions,
    hasExclamations,
    platformSuitability: {
      twitter: charCount <= 280,
      instagram: charCount <= 2200,
      facebook: true, // No strict limit
      linkedin: wordCount >= 50 && wordCount <= 300
    },
    optimizationSuggestions: getOptimizationSuggestions(content, platform, contentType)
  };
}

function calculateReadability(content) {
  const words = content.split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).length;
  const syllables = content.toLowerCase().split('').filter(c => 'aeiou'.includes(c)).length;
  
  if (sentences === 0 || words === 0) return 50;
  
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, score));
}

function analyzeTone(content) {
  const positiveWords = ['amazing', 'great', 'excellent', 'awesome', 'incredible'];
  const negativeWords = ['bad', 'terrible', 'awful', 'poor', 'disappointing'];
  
  const words = content.toLowerCase().split(/\s+/);
  let positive = 0;
  let negative = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positive++;
    if (negativeWords.includes(word)) negative++;
  });
  
  if (positive > negative) return 'positive';
  if (negative > positive) return 'negative';
  return 'neutral';
}

function getOptimizationSuggestions(content, platform, contentType) {
  const suggestions = [];
  
  if (content.length < 50 && platform !== 'twitter') {
    suggestions.push('Consider adding more detail to your post');
  }
  
  if (!/\p{Emoji}/u.test(content) && platform !== 'linkedin') {
    suggestions.push('Add 1-2 relevant emojis to increase engagement');
  }
  
  if (!/[?]/.test(content)) {
    suggestions.push('Ask a question to encourage comments');
  }
  
  if (contentType === 'news' && !content.includes('#')) {
    suggestions.push('Include relevant hashtags for better reach');
  }
  
  return suggestions.slice(0, 3);
}

function generateSharingRecommendations(analysis, platform, contentType) {
  const recommendations = [];
  
  if (analysis.platformSuitability.twitter && platform !== 'twitter') {
    recommendations.push('This content would work well as a Twitter thread');
  }
  
  if (analysis.hasQuestions) {
    recommendations.push('Pin your question to encourage more responses');
  }
  
  if (analysis.emotionalTone === 'positive') {
    recommendations.push('Share during peak positive engagement hours (evenings)');
  }
  
  if (contentType === 'analysis') {
    recommendations.push('Consider creating a video breakdown for TikTok/Instagram');
  }
  
  return recommendations.slice(0, 4);
}

// Metrics helper functions
async function generateEngagementMetrics(timeframe, platform) {
  // In a real implementation, this would query a database
  // For now, return sample metrics
  return generateSampleMetrics(timeframe);
}

function generateEngagementInsights(metrics) {
  const insights = [];
  
  if (metrics.averageEngagement > 5) {
    insights.push('Your content is performing above average!');
  } else {
    insights.push('Try posting during peak hours for better engagement');
  }
  
  if (metrics.bestPerformingPlatform) {
    insights.push(`Focus more on ${metrics.bestPerformingPlatform} for maximum reach`);
  }
  
  insights.push('Experiment with different content formats (videos, polls, threads)');
  
  return insights;
}

// Sample data generators
function generateSampleNBANews() {
  return [
    {
      id: 'sample1',
      title: 'LeBron James Makes History with 40,000 Career Points',
      description: 'Los Angeles Lakers superstar reaches unprecedented scoring milestone.',
      url: 'https://example.com/lebron-40000',
      imageUrl: 'https://example.com/lebron-milestone.jpg',
      source: 'NBA.com',
      publishedAt: new Date().toISOString(),
      contentPreview: 'In a historic moment, LeBron James became the first player...',
      engagementScore: 92,
      shareabilityScore: 88,
      suggestedHashtags: ['#LeBron', '#NBA', '#Lakers', '#History', '#Basketball'],
      socialMediaCopy: {
        twitter: 'LeBron James makes history with 40,000 career points! 👑 #NBA',
        instagram: 'LeBron James makes history with 40,000 career points! 👑\n\nHistoric moment for the Lakers superstar! #NBA #Basketball',
        facebook: 'LeBron James reaches 40,000 career points - making NBA history!',
        linkedin: 'LeBron James achieves historic 40,000 career points milestone in the NBA.'
      }
    },
    {
      id: 'sample2',
      title: 'Warriors Trade Rumors: Major Shakeup Coming?',
      description: 'Golden State Warriors considering big moves before trade deadline.',
      url: 'https://example.com/warriors-trade',
      imageUrl: 'https://example.com/warriors-trade.jpg',
      source: 'ESPN',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      contentPreview: 'Sources indicate the Warriors are exploring trade options...',
      engagementScore: 85,
      shareabilityScore: 82,
      suggestedHashtags: ['#Warriors', '#NBATrades', '#StephCurry', '#NBA', '#Basketball'],
      socialMediaCopy: {
        twitter: 'Warriors trade rumors heating up! 🔥 What moves should they make? #NBA',
        instagram: 'Warriors trade rumors are heating up! 🔥\n\nWhat moves do you want to see? Comment below! 👇 #NBA #Warriors',
        facebook: 'Golden State Warriors trade rumors: What big moves could be coming?',
        linkedin: 'NBA Trade Analysis: Golden State Warriors considering roster changes.'
      }
    }
  ];
}

function generateSampleTrendingNews() {
  return [
    {
      id: 'trend1',
      title: 'NBA All-Star Weekend Breaks Viewership Records',
      description: 'This year\'s All-Star game attracts largest audience in a decade.',
      url: 'https://example.com/all-star-ratings',
      imageUrl: 'https://example.com/all-star-crowd.jpg',
      source: 'ESPN',
      publishedAt: new Date().toISOString(),
      trendingRank: 95,
      viralityScore: 88,
      platformSpecificCopy: 'NBA All-Star Weekend shatters viewership records! 📺 #NBA',
      suggestedFormat: ['Image post', 'Video recap', 'Infographic'],
      engagementPredictions: {
        twitter: 78,
        instagram: 85,
        facebook: 72,
        tiktok: 92
      }
    }
  ];
}

function generateSampleMetrics(timeframe) {
  const baseMetrics = {
    totalPosts: 24,
    totalEngagement: 1560,
    averageEngagement: 65,
    bestPerformingPlatform: 'instagram',
    topHashtags: ['#NBA', '#Basketball', '#Sports'],
    peakEngagementHours: ['7 PM', '12 PM', '9 AM'],
    engagementByPlatform: {
      twitter: 580,
      instagram: 720,
      facebook: 260
    }
  };
  
  // Adjust based on timeframe
  const timeframeMultipliers = {
    day: 0.14,
    week: 1,
    month: 4.3,
    year: 52
  };
  
  const multiplier = timeframeMultipliers[timeframe] || 1;
  
  return {
    totalPosts: Math.round(baseMetrics.totalPosts * multiplier),
    totalEngagement: Math.round(baseMetrics.totalEngagement * multiplier),
    averageEngagement: baseMetrics.averageEngagement,
    bestPerformingPlatform: baseMetrics.bestPerformingPlatform,
    topHashtags: baseMetrics.topHashtags,
    peakEngagementHours: baseMetrics.peakEngagementHours,
    engagementByPlatform: {
      twitter: Math.round(baseMetrics.engagementByPlatform.twitter * multiplier),
      instagram: Math.round(baseMetrics.engagementByPlatform.instagram * multiplier),
      facebook: Math.round(baseMetrics.engagementByPlatform.facebook * multiplier)
    }
  };
}

// Additional helper functions for social media
function generateTwitterThread(title, description) {
  if (!description || description.length < 100) {
    return [title];
  }
  
  const chunks = [];
  let currentChunk = title + '\n\n';
  const words = description.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    if (currentChunk.length + words[i].length + 1 <= 280) {
      currentChunk += words[i] + ' ';
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = words[i] + ' ';
    }
  }
  
  if (currentChunk.trim() !== title) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.slice(0, 5); // Max 5 tweets in thread
}

function generateInstagramCaption(title, description) {
  const caption = `${title}\n\n`;
  const descriptionText = description ? description.substring(0, 2100) : '';
  
  return caption + descriptionText + '\n\n' + generateHashtags(title, description).join(' ');
}

function generateFacebookPost(title, description) {
  return `${title}\n\n${description || ''}\n\nRead more via link in comments.`;
}

export default router;
