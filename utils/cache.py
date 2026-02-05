# utils/cache.py - Add player stats caching
@cache.memoize(timeout=3600)  # Cache for 1 hour
def get_cached_player_stats(player_name):
    """Cached version of player stats"""
    return get_player_stats(player_name)

# Use in FantasyHub endpoint
stats = get_cached_player_stats(player_name)


