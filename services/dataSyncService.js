// /services/dataSyncService.js
class DataSyncService {
  constructor(db) {
    this.db = db;
    this.syncInterval = 15 * 60 * 1000; // 15 minutes
    this.apiServices = this.initializeAPIServices();
  }

  initializeAPIServices() {
    return {
      realData: new RealDataService(),
      kalshi: new KalshiAPIService(),
      fanduel: new FanDuelAPIService(),
      draftkings: new DraftKingsAPIService(),
      prizepicks: new PrizePicksAPIService()
    };
  }

  async startSync() {
    console.log('🔄 Starting comprehensive data sync service');
    
    // Initial sync
    await this.syncAllData();
    
    // Periodic sync
    setInterval(() => this.syncAllData(), this.syncInterval);
  }

  async syncAllData() {
    try {
      // Sports data
      await this.syncNBA();
      await this.syncNFL();
      await this.syncNHL();
      await this.syncMLB();
      await this.syncMLS();
      await this.syncEPL();
      await this.syncUFC();
      await this.syncTennis();
      await this.syncGolf();
      await this.syncCollegeSports();
      
      // Betting platforms
      await this.syncKalshiPredictions();
      await this.syncFanDuelSnakeDrafts();
      await this.syncDraftKingsTournamentDrafts();
      await this.syncPrizePicksEntries();
      
      // Projections and standings
      await this.syncFantasyProjections();
      await this.syncStandings();
      
      console.log('✅ Comprehensive data sync completed');
    } catch (error) {
      console.error('Data sync error:', error);
    }
  }

  // ============ SPORTS SYNC METHODS ============

  async syncNBA() {
    const games = await this.apiServices.realData.getRealNBAGames();
    if (games?.success) {
      await this.db.collection('games').bulkWrite(
        games.games.map(game => ({
          updateOne: {
            filter: { id: game.id, sport: 'NBA' },
            update: { 
              $set: { 
                ...game, 
                sport: 'NBA', 
                league: 'NBA',
                gameType: 'regular',
                lastSynced: new Date() 
              } 
            },
            upsert: true
          }
        }))
      );
    }
  }

  async syncNFL() {
    const games = await this.apiServices.realData.getRealNFLGames();
    if (games?.success) {
      await this.db.collection('games').bulkWrite(
        games.games.map(game => ({
          updateOne: {
            filter: { id: game.id, sport: 'NFL' },
            update: { 
              $set: { 
                ...game, 
                sport: 'NFL',
                league: 'NFL',
                gameType: game.week ? 'regular' : 'preseason',
                lastSynced: new Date() 
              } 
            },
            upsert: true
          }
        }))
      );
    }
  }

  async syncNHL() {
    const games = await this.apiServices.realData.getRealNHLGames();
    if (games?.success) {
      await this.db.collection('games').bulkWrite(
        games.games.map(game => ({
          updateOne: {
            filter: { id: game.id, sport: 'NHL' },
            update: { 
              $set: { 
                ...game, 
                sport: 'NHL',
                league: 'NHL',
                gameType: 'regular',
                lastSynced: new Date() 
              } 
            },
            upsert: true
          }
        }))
      );
    }
  }

  async syncMLB() {
    const games = await this.apiServices.realData.getRealMLBGames();
    if (games?.success) {
      await this.db.collection('games').bulkWrite(
        games.games.map(game => ({
          updateOne: {
            filter: { id: game.id, sport: 'MLB' },
            update: { 
              $set: { 
                ...game, 
                sport: 'MLB',
                league: 'MLB',
                gameType: 'regular',
                lastSynced: new Date() 
              } 
            },
            upsert: true
          }
        }))
      );
    }
  }

  async syncMLS() {
    const games = await this.apiServices.realData.getRealMLSGames();
    if (games?.success) {
      await this.db.collection('games').bulkWrite(
        games.games.map(game => ({
          updateOne: {
            filter: { id: game.id, sport: 'MLS' },
            update: { 
              $set: { 
                ...game, 
                sport: 'MLS',
                league: 'MLS',
                gameType: 'regular',
                lastSynced: new Date() 
              } 
            },
            upsert: true
          }
        }))
      );
    }
  }

  async syncEPL() {
    const games = await this.apiServices.realData.getRealEPLGames();
    if (games?.success) {
      await this.db.collection('games').bulkWrite(
        games.games.map(game => ({
          updateOne: {
            filter: { id: game.id, sport: 'SOCCER' },
            update: { 
              $set: { 
                ...game, 
                sport: 'SOCCER',
                league: 'EPL',
                gameType: 'premier_league',
                lastSynced: new Date() 
              } 
            },
            upsert: true
          }
        }))
      );
    }
  }

  async syncUFC() {
    const events = await this.apiServices.realData.getUFC Events();
    if (events?.success) {
      await this.db.collection('events').bulkWrite(
        events.events.map(event => ({
          updateOne: {
            filter: { id: event.id, sport: 'UFC' },
            update: { 
              $set: { 
                ...event, 
                sport: 'UFC',
                league: 'UFC',
                eventType: 'fight_night',
                lastSynced: new Date() 
              } 
            },
            upsert: true
          }
        }))
      );
    }
  }

  async syncTennis() {
    const tournaments = await this.apiServices.realData.getTennisTournaments();
    if (tournaments?.success) {
      await this.db.collection('tournaments').bulkWrite(
        tournaments.matches.map(match => ({
          updateOne: {
            filter: { id: match.id, sport: 'TENNIS' },
            update: { 
              $set: { 
                ...match, 
                sport: 'TENNIS',
                tournament: match.tournament,
                surface: match.surface,
                lastSynced: new Date() 
              } 
            },
            upsert: true
          }
        }))
      );
    }
  }

  async syncGolf() {
    const tournaments = await this.apiServices.realData.getGolfTournaments();
    if (tournaments?.success) {
      await this.db.collection('tournaments').bulkWrite(
        tournaments.events.map(event => ({
          updateOne: {
            filter: { id: event.id, sport: 'GOLF' },
            update: { 
              $set: { 
                ...event, 
                sport: 'GOLF',
                tour: event.tour,
                course: event.course,
                lastSynced: new Date() 
              } 
            },
            upsert: true
          }
        }))
      );
    }
  }

  async syncCollegeSports() {
    const sports = ['NCAA_BASKETBALL', 'NCAA_FOOTBALL'];
    
    for (const sport of sports) {
      const games = await this.apiServices.realData.getCollegeGames(sport);
      if (games?.success) {
        await this.db.collection('games').bulkWrite(
          games.games.map(game => ({
            updateOne: {
              filter: { id: game.id, sport: sport },
              update: { 
                $set: { 
                  ...game, 
                  sport: sport,
                  league: 'NCAA',
                  conference: game.conference,
                  lastSynced: new Date() 
                } 
              },
              upsert: true
            }
          }))
        );
      }
    }
  }

  // ============ BETTING PLATFORMS SYNC METHODS ============

  async syncKalshiPredictions() {
    try {
      const predictions = await this.apiServices.kalshi.getMarketPredictions();
      
      if (predictions?.markets) {
        await this.db.collection('kalshi_predictions').bulkWrite(
          predictions.markets.map(market => ({
            updateOne: {
              filter: { market_id: market.id },
              update: {
                $set: {
                  ...market,
                  platform: 'Kalshi',
                  market_type: market.type,
                  yes_price: market.yes_price,
                  no_price: market.no_price,
                  volume: market.volume,
                  resolution_date: market.close_date,
                  lastSynced: new Date()
                },
                $push: {
                  price_history: {
                    timestamp: new Date(),
                    yes_price: market.yes_price,
                    no_price: market.no_price,
                    volume: market.volume
                  }
                }
              },
              upsert: true
            }
          }))
        );
      }
    } catch (error) {
      console.error('Kalshi sync error:', error);
    }
  }

  async syncFanDuelSnakeDrafts() {
    try {
      const drafts = await this.apiServices.fanduel.getSnakeDrafts();
      
      if (drafts?.drafts) {
        await this.db.collection('fanduel_snake_drafts').bulkWrite(
          drafts.drafts.map(draft => ({
            updateOne: {
              filter: { draft_id: draft.id },
              update: {
                $set: {
                  ...draft,
                  platform: 'FanDuel',
                  draft_type: 'snake',
                  sport: draft.sport,
                  entry_fee: draft.entry_fee,
                  prize_pool: draft.prize_pool,
                  max_players: draft.max_entries,
                  current_players: draft.current_entries,
                  draft_time: draft.start_time,
                  lastSynced: new Date()
                }
              },
              upsert: true
            }
          }))
        );
      }
    } catch (error) {
      console.error('FanDuel Snake Draft sync error:', error);
    }
  }

  async syncDraftKingsTournamentDrafts() {
    try {
      const tournaments = await this.apiServices.draftkings.getTournamentDrafts();
      
      if (tournaments?.contests) {
        await this.db.collection('draftkings_tournaments').bulkWrite(
          tournaments.contests.map(contest => ({
            updateOne: {
              filter: { contest_id: contest.id },
              update: {
                $set: {
                  ...contest,
                  platform: 'DraftKings',
                  contest_type: 'tournament',
                  sport: contest.sport,
                  entry_fee: contest.entry_fee,
                  prize_pool: contest.prize_pool,
                  max_entries: contest.max_entries,
                  current_entries: contest.current_entries,
                  start_time: contest.start_time,
                  payout_structure: contest.payouts,
                  lastSynced: new Date()
                },
                $push: {
                  entry_history: {
                    timestamp: new Date(),
                    current_entries: contest.current_entries,
                    remaining_spots: contest.max_entries - contest.current_entries
                  }
                }
              },
              upsert: true
            }
          }))
        );
      }
    } catch (error) {
      console.error('DraftKings Tournament sync error:', error);
    }
  }

  async syncPrizePicksEntries() {
    try {
      const entries = await this.apiServices.prizepicks.getActiveEntries();
      
      if (entries?.picks) {
        await this.db.collection('prizepicks_entries').bulkWrite(
          entries.picks.map(pick => ({
            updateOne: {
              filter: { entry_id: pick.id },
              update: {
                $set: {
                  ...pick,
                  platform: 'PrizePicks',
                  entry_type: pick.type,
                  sport: pick.sport,
                  projection_type: pick.stat_type,
                  projection_value: pick.line,
                  player_name: pick.player,
                  game_time: pick.game_start,
                  entry_amount: pick.entry,
                  potential_payout: pick.payout,
                  status: 'active',
                  lastSynced: new Date()
                }
              },
              upsert: true
            }
          }))
        );
      }
    } catch (error) {
      console.error('PrizePicks sync error:', error);
    }
  }

  // ============ FANTASY & STANDINGS SYNC ============

  async syncFantasyProjections() {
    const projections = await this.apiServices.realData.getFantasyProjections();
    
    if (projections?.players) {
      await this.db.collection('fantasy_projections').bulkWrite(
        projections.players.map(player => ({
          updateOne: {
            filter: { player_id: player.id, date: player.date },
            update: {
              $set: {
                ...player,
                lastSynced: new Date()
              }
            },
            upsert: true
          }
        }))
      );
    }
  }

  async syncStandings() {
    const standings = await this.apiServices.realData.getAllStandings();
    
    if (standings) {
      for (const [league, data] of Object.entries(standings)) {
        if (data?.teams) {
          await this.db.collection('standings').bulkWrite(
            data.teams.map(team => ({
              updateOne: {
                filter: { team_id: team.id, league: league },
                update: {
                  $set: {
                    ...team,
                    league: league,
                    lastSynced: new Date()
                  }
                },
                upsert: true
              }
            }))
          );
        }
      }
    }
  }

  // ============ UTILITY METHODS ============

  async getActiveMarkets(sport = null, platform = null) {
    const query = { status: 'active' };
    if (sport) query.sport = sport;
    if (platform) query.platform = platform;

    const markets = await this.db.collection('kalshi_predictions').find(query).toArray();
    return markets;
  }

  async getUpcomingDrafts(draftType = null, sport = null) {
    const query = { draft_time: { $gt: new Date() } };
    if (draftType) query.draft_type = draftType;
    if (sport) query.sport = sport;

    const drafts = await this.db.collection('fanduel_snake_drafts').find(query).toArray();
    return drafts;
  }

  async getPlayerProjections(playerName, sport) {
    return await this.db.collection('fantasy_projections').findOne({
      player_name: playerName,
      sport: sport,
      date: new Date().toISOString().split('T')[0]
    });
  }

  async getPrizePicksTrendingPlayers(sport, limit = 10) {
    const pipeline = [
      { 
        $match: { 
          platform: 'PrizePicks',
          sport: sport,
          lastSynced: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: "$player_name",
          count: { $sum: 1 },
          average_payout: { $avg: "$potential_payout" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ];

    return await this.db.collection('prizepicks_entries').aggregate(pipeline).toArray();
  }
}

module.exports = DataSyncService;
