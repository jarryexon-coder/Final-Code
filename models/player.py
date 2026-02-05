# models/player.py
class UnifiedPlayer:
    def __init__(self, player_data):
        self.id = player_data.get('id')
        self.name = player_data.get('name')
        self.current_projections = player_data.get('projections', {})  # From PrizePicks/Odds API
        self.historical_stats = player_data.get('stats', {})  # From NBA API
        self.fantasy_value = player_data.get('fantasy_value', 0)
        
    def calculate_insight_score(self):
        """Calculate AI-powered insight score"""
        # Compare current projections vs historical performance
        current_line = self.current_projections.get('points_line', 0)
        season_avg = self.historical_stats.get('season_avg_ppg', 0)
        
        if season_avg > 0:
            return round((current_line / season_avg) * 100, 1)
        return 0
