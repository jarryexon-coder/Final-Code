import { Player, Team, Stat, Game } from '../models/index.js';
import mongoose from 'mongoose';

class AnalyticsService {
  // Player performance analytics
  static async getPlayerPerformanceAnalytics(sport, filters = {}) {
    const matchStage = { sport };
    
    // Apply filters
    if (filters.position) matchStage.position = filters.position;
    if (filters.team) matchStage.team = filters.team;
    if (filters.minFantasy) matchStage.fantasyPoints = { $gte: filters.minFantasy };
    if (filters.maxFantasy) {
      matchStage.fantasyPoints = { 
        ...matchStage.fantasyPoints,
        $lte: filters.maxFantasy
      };
    }
    
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPlayers: { $sum: 1 },
          avgFantasyPoints: { $avg: '$fantasyPoints' },
          maxFantasyPoints: { $max: '$fantasyPoints' },
          minFantasyPoints: { $min: '$fantasyPoints' },
          stdDevFantasyPoints: { $stdDevPop: '$fantasyPoints' },
          avgAge: { $avg: '$age' },
          topPerformers: {
            $push: {
              name: '$name',
              team: '$team',
              fantasyPoints: '$fantasyPoints',
              position: '$position'
            }
          }
        }
      },
      {
        $project: {
          totalPlayers: 1,
          avgFantasyPoints: { $round: ['$avgFantasyPoints', 2] },
          maxFantasyPoints: 1,
          minFantasyPoints: 1,
          stdDevFantasyPoints: { $round: ['$stdDevFantasyPoints', 2] },
          avgAge: { $round: ['$avgAge', 1] },
          topPerformers: {
            $slice: [
              {
                $sortArray: {
                  input: '$topPerformers',
                  sortBy: { fantasyPoints: -1 }
                }
              },
              10
            ]
          }
        }
      }
    ];
    
    const results = await Player.aggregate(pipeline);
    return results[0] || {};
  }
  
  // Team comparison analytics
  static async getTeamComparison(teamIds) {
    const pipeline = [
      {
        $match: {
          teamId: { $in: teamIds.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      {
        $lookup: {
          from: 'players',
          localField: '_id',
          foreignField: 'teamId',
          as: 'roster'
        }
      },
      {
        $project: {
          name: 1,
          sport: 1,
          record: 1,
          rosterSize: { $size: '$roster' },
          avgPlayerAge: { $avg: '$roster.age' },
          totalFantasyPoints: { $sum: '$roster.fantasyPoints' },
          avgFantasyPoints: { $avg: '$roster.fantasyPoints' },
          premiumPlayers: {
            $size: {
              $filter: {
                input: '$roster',
                as: 'player',
                cond: { $eq: ['$$player.isPremium', true] }
              }
            }
          },
          topPlayers: {
            $slice: [
              {
                $sortArray: {
                  input: '$roster',
                  sortBy: { fantasyPoints: -1 }
                }
              },
              5
            ]
          }
        }
      },
      {
        $sort: { totalFantasyPoints: -1 }
      }
    ];
    
    return await Team.aggregate(pipeline);
  }
  
  // Trend analysis
  static async getPlayerTrends(playerId, period = '30d') {
    const dateFilter = getDateFilter(period);
    
    const pipeline = [
      {
        $match: {
          playerId: new mongoose.Types.ObjectId(playerId),
          date: { $gte: dateFilter }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          avgValue: { $avg: '$value' },
          minValue: { $min: '$value' },
          maxValue: { $max: '$value' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          date: '$_id',
          avgValue: { $round: ['$avgValue', 2] },
          minValue: 1,
          maxValue: 1,
          count: 1,
          _id: 0
        }
      }
    ];
    
    return await Stat.aggregate(pipeline);
  }
  
  // Market value analytics
  static async getMarketAnalytics(sport) {
    const pipeline = [
      { $match: { sport } },
      {
        $bucket: {
          groupBy: '$fantasyPoints',
          boundaries: [0, 100, 200, 300, 400, 500, 1000],
          default: 'other',
          output: {
            count: { $sum: 1 },
            avgSalary: { $avg: { $toDouble: { $substr: ['$salary', 1, -1] } } },
            players: {
              $push: {
                name: '$name',
                team: '$team',
                fantasyPoints: '$fantasyPoints',
                salary: '$salary'
              }
            }
          }
        }
      },
      {
        $project: {
          fantasyRange: '$_id',
          count: 1,
          avgSalary: { $round: ['$avgSalary', 2] },
          topPlayer: { $arrayElemAt: ['$players', 0] },
          _id: 0
        }
      },
      { $sort: { fantasyRange: 1 } }
    ];
    
    return await Player.aggregate(pipeline);
  }
  
  // Correlation analysis
  static async getCorrelationAnalysis(sport, stat1, stat2) {
    const pipeline = [
      { $match: { sport } },
      {
        $group: {
          _id: null,
          n: { $sum: 1 },
          sumX: { $sum: `$stats.${stat1}` },
          sumY: { $sum: `$stats.${stat2}` },
          sumXY: { $sum: { $multiply: [`$stats.${stat1}`, `$stats.${stat2}`] } },
          sumX2: { $sum: { $multiply: [`$stats.${stat1}`, `$stats.${stat1}`] } },
          sumY2: { $sum: { $multiply: [`$stats.${stat2}`, `$stats.${stat2}`] } }
        }
      },
      {
        $project: {
          correlation: {
            $divide: [
              {
                $subtract: [
                  { $multiply: ['$n', '$sumXY'] },
                  { $multiply: ['$sumX', '$sumY'] }
                ]
              },
              {
                $sqrt: {
                  $multiply: [
                    {
                      $subtract: [
                        { $multiply: ['$n', '$sumX2'] },
                        { $multiply: ['$sumX', '$sumX'] }
                      ]
                    },
                    {
                      $subtract: [
                        { $multiply: ['$n', '$sumY2'] },
                        { $multiply: ['$sumY', '$sumY'] }
                      ]
                    }
                  ]
                }
              }
            ]
          },
          stats: {
            stat1: stat1,
            stat2: stat2,
            sampleSize: '$n',
            avgStat1: { $divide: ['$sumX', '$n'] },
            avgStat2: { $divide: ['$sumY', '$n'] }
          }
        }
      }
    ];
    
    const result = await Player.aggregate(pipeline);
    return result[0] || {};
  }
}

// Helper function for date filtering
function getDateFilter(period) {
  const now = new Date();
  switch (period) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
}

export default AnalyticsService;
