-- NBA Teams
CREATE TABLE IF NOT EXISTS nba_teams (
    id SERIAL PRIMARY KEY,
    team_code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    conference VARCHAR(4) CHECK (conference IN ('East', 'West')),
    division VARCHAR(20),
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NBA Players
CREATE TABLE IF NOT EXISTS nba_players (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    team_id INTEGER REFERENCES nba_teams(id),
    position VARCHAR(10),
    jersey_number INTEGER,
    height VARCHAR(10),
    weight INTEGER,
    salary DECIMAL(10, 2) DEFAULT 10000.00,
    points_per_game DECIMAL(4, 1),
    rebounds_per_game DECIMAL(4, 1),
    assists_per_game DECIMAL(4, 1),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NBA Games
CREATE TABLE IF NOT EXISTS nba_games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(50) UNIQUE NOT NULL,
    home_team_id INTEGER REFERENCES nba_teams(id),
    away_team_id INTEGER REFERENCES nba_teams(id),
    game_date DATE NOT NULL,
    game_time TIME,
    status VARCHAR(20) DEFAULT 'scheduled',
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    venue VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Fantasy Teams
CREATE TABLE IF NOT EXISTS fantasy_teams (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_salary DECIMAL(10, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT true
);

-- Fantasy Team Players (junction table)
CREATE TABLE IF NOT EXISTS fantasy_team_players (
    id SERIAL PRIMARY KEY,
    fantasy_team_id INTEGER REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES nba_players(id),
    position VARCHAR(10),
    is_captain BOOLEAN DEFAULT false,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample NBA teams
INSERT INTO nba_teams (team_code, name, city, conference, division, wins, losses) VALUES
('LAL', 'Lakers', 'Los Angeles', 'West', 'Pacific', 25, 15),
('GSW', 'Warriors', 'Golden State', 'West', 'Pacific', 22, 18),
('BOS', 'Celtics', 'Boston', 'East', 'Atlantic', 30, 10),
('MIA', 'Heat', 'Miami', 'East', 'Southeast', 24, 16),
('DEN', 'Nuggets', 'Denver', 'West', 'Northwest', 28, 12)
ON CONFLICT (team_code) DO NOTHING;

-- Insert sample players
WITH team_ids AS (
    SELECT id, team_code FROM nba_teams
)
INSERT INTO nba_players (player_id, name, team_id, position, salary, points_per_game) VALUES
('lebron_james', 'LeBron James', (SELECT id FROM team_ids WHERE team_code = 'LAL'), 'SF', 45000000, 25.5),
('stephen_curry', 'Stephen Curry', (SELECT id FROM team_ids WHERE team_code = 'GSW'), 'PG', 48000000, 28.3),
('jayson_tatum', 'Jayson Tatum', (SELECT id FROM team_ids WHERE team_code = 'BOS'), 'SF', 32000000, 27.1),
('jimmy_butler', 'Jimmy Butler', (SELECT id FROM team_ids WHERE team_code = 'MIA'), 'SF', 38000000, 22.9),
('nikola_jokic', 'Nikola Jokic', (SELECT id FROM team_ids WHERE team_code = 'DEN'), 'C', 47000000, 26.2)
ON CONFLICT (player_id) DO NOTHING;

-- Insert sample games
WITH team_ids AS (
    SELECT id, team_code FROM nba_teams
)
INSERT INTO nba_games (game_id, home_team_id, away_team_id, game_date, game_time, status) VALUES
('20240215_LAL_GSW', (SELECT id FROM team_ids WHERE team_code = 'LAL'), (SELECT id FROM team_ids WHERE team_code = 'GSW'), '2024-02-15', '19:30:00', 'scheduled'),
('20240215_BOS_MIA', (SELECT id FROM team_ids WHERE team_code = 'BOS'), (SELECT id FROM team_ids WHERE team_code = 'MIA'), '2024-02-15', '20:00:00', 'scheduled')
ON CONFLICT (game_id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fantasy_teams_user_id ON fantasy_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_team_players_team_id ON fantasy_team_players(fantasy_team_id);
CREATE INDEX IF NOT EXISTS idx_nba_games_date ON nba_games(game_date);
CREATE INDEX IF NOT EXISTS idx_nba_players_team_id ON nba_players(team_id);
