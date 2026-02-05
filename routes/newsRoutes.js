import express from 'express';
const router = express.Router();

// GET /api/news - Returns sports news articles
router.get('/', async (req, res) => {
  try {
    const newsArticles = [
      {
        id: '1',
        title: 'NBA Trade Deadline: Lakers Make Big Move',
        summary: 'The Los Angeles Lakers have acquired a key player before the trade deadline...',
        content: 'Full article content here...',
        author: 'ESPN NBA Staff',
        source: 'ESPN',
        sport: 'NBA',
        category: 'Trades',
        imageUrl: 'https://placehold.co/600x400/1e40af/white?text=NBA+News',
        url: 'https://espn.com/nba/trade-deadline',
        publishedAt: new Date().toISOString(),
        readTime: '3 min',
        trending: true
      },
      {
        id: '2',
        title: 'NFL Free Agency: Quarterback Market Heats Up',
        summary: 'Multiple teams are competing for top QB talent in free agency...',
        content: 'Full article content here...',
        author: 'NFL Network',
        source: 'NFL Network',
        sport: 'NFL',
        category: 'Free Agency',
        imageUrl: 'https://placehold.co/600x400/991b1b/white?text=NFL+News',
        url: 'https://nfl.com/news/free-agency',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        readTime: '4 min',
        trending: true
      },
      {
        id: '3',
        title: 'MLB Opening Day Predictions',
        summary: 'Analysts predict division winners for upcoming season...',
        content: 'Full article content here...',
        author: 'MLB.com Staff',
        source: 'MLB.com',
        sport: 'MLB',
        category: 'Predictions',
        imageUrl: 'https://placehold.co/600x400/166534/white?text=MLB+News',
        url: 'https://mlb.com/news/predictions',
        publishedAt: new Date(Date.now() - 172800000).toISOString(),
        readTime: '5 min',
        trending: false
      },
      {
        id: '4',
        title: 'NHL Playoff Race Tightens',
        summary: 'The battle for the final playoff spots intensifies...',
        content: 'Full article content here...',
        author: 'NHL.com',
        source: 'NHL.com',
        sport: 'NHL',
        category: 'Playoffs',
        imageUrl: 'https://placehold.co/600x400/1e3a8a/white?text=NHL+News',
        url: 'https://nhl.com/news/playoffs',
        publishedAt: new Date(Date.now() - 259200000).toISOString(),
        readTime: '3 min',
        trending: true
      }
    ];

    res.json({
      success: true,
      message: 'Sports news articles',
      timestamp: new Date().toISOString(),
      news: newsArticles,
      count: newsArticles.length,
      sources: ['ESPN', 'NFL Network', 'MLB.com', 'NHL.com']
    });

  } catch (error) {
    console.error('Error in /api/news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
});

export default router;
