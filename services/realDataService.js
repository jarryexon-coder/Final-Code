// services/realDataService.js
import axios from 'axios';
import { DATA_SOURCES, buildURL, getHeaders } from '../config/dataSources.js';

class RealDataService {
  
  async fetchOdds(sport, params = {}) {
    try {
      const url = buildURL('odds', sport, '', params);
      const response = await axios.get(url);
      return this.processOddsData(response.data, sport);
    } catch (error) {
      console.error(`Error fetching ${sport} odds:`, error.message);
      return this.getFallbackOdds(sport);
    }
  }
  
  async fetchPlayerStats(sport, date) {
    try {
      const url = buildURL('stats', sport, 'playerGameStats', { date });
      const headers = getHeaders(DATA_SOURCES[sport].stats.provider);
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${sport} stats:`, error.message);
      return [];
    }
  }
  
  async fetchWeatherForGame(city, country = 'US') {
    try {
      const weatherConfig = DATA_SOURCES.weather;
      const url = `${weatherConfig.url}?key=${weatherConfig.params.key}&q=${city}&aqi=no`;
      const response = await axios.get(url);
      return {
        condition: response.data.current.condition.text,
        temp_f: response.data.current.temp_f,
        temp_c: response.data.current.temp_c,
        humidity: response.data.current.humidity,
        wind_mph: response.data.current.wind_mph,
        precipitation: response.data.current.precip_in
      };
    } catch (error) {
      console.error('Error fetching weather:', error.message);
      return null;
    }
  }
  
  async fetchKalshiMarkets() {
    try {
      const kalshiConfig = DATA_SOURCES.kalshi;
      const url = `${kalshiConfig.url}${kalshiConfig.endpoints.markets}`;
      const headers = getHeaders('kalshi');
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching Kalshi markets:', error.message);
      return { markets: [] };
    }
  }
  
  processOddsData(data, sport) {
    // Convert API response to your format
    return data.map(event => ({
      id: event.id,
      sport: sport,
      commence_time: event.commence_time,
      home_team: event.home_team,
      away_team: event.away_team,
      bookmakers: event.bookmakers.map(book => ({
        key: book.key,
        title: book.title,
        markets: book.markets
      }))
    }));
  }
  
  getFallbackOdds(sport) {
    // Return mock data if real API fails
    return [
      {
        id: 'fallback_1',
        sport: sport,
        commence_time: new Date(Date.now() + 86400000).toISOString(),
        home_team: `${sport} Team A`,
        away_team: `${sport} Team B`,
        bookmakers: [
          {
            key: 'draftkings',
            title: 'DraftKings',
            markets: [
              {
                key: 'h2h',
                outcomes: [
                  { name: `${sport} Team A`, price: 1.85 },
                  { name: `${sport} Team B`, price: 2.05 }
                ]
              }
            ]
          }
        ]
      }
    ];
  }
}

export default new RealDataService();
