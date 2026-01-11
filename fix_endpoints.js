const fs = require('fs');

const serverFile = 'server.js';
let content = fs.readFileSync(serverFile, 'utf8');

// Function to replace an endpoint
function replaceEndpoint(content, startMarker, endMarker, newCode) {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return content;
  
  const endIndex = content.indexOf(endMarker, startIndex);
  if (endIndex === -1) return content;
  
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex + endMarker.length);
  
  return before + newCode + after;
}

// 1. Fix arbitrage endpoint
const arbitrageOld = `app.get('/api/sports-analytics/arbitrage', async (req, res) => {
  try {
    const { sport } = req.query;
    const opportunities = await SportsBettingAnalyticsService.getArbitrageOpportunities(sport || 'NBA');
    res.json({ success: true, data: opportunities });
  } catch (error) {
    console.error('❌ Arbitrage endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});`;

const arbitrageNew = `app.get('/api/sports-analytics/arbitrage', async (req, res) => {
  try {
    const { sport } = req.query;
    // Mock response for now
    const opportunities = {
      opportunities: [
        {
          game: \`\${sport || 'NBA'} Mock Game\`,
          market: 'Moneyline',
          book1: { name: 'Book A', odds: 1.85 },
          book2: { name: 'Book B', odds: 2.10 },
          arbitragePercentage: 5.2
        }
      ],
      note: 'Mock data - service being fixed'
    };
    res.json({ success: true, data: opportunities });
  } catch (error) {
    console.error('❌ Arbitrage endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});`;

// 2. Fix spot-plays endpoint
const spotPlaysOld = `app.get('/api/situational/spot-plays', async (req, res) => {
  try {
    const { sport, date } = req.query;
    const spotPlays = await SituationalAnalysisService.findSpotPlays(
      sport || 'NBA',
      date || '2024-01-15'
    );
    res.json({ success: true, data: spotPlays });
  } catch (error) {
    console.error('❌ Spot plays endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});`;

const spotPlaysNew = `app.get('/api/situational/spot-plays', async (req, res) => {
  try {
    const { sport, date } = req.query;
    // Mock response for now
    const spotPlays = {
      spotPlays: [
        {
          game: \`\${sport || 'NBA'} Mock Game: Team X vs Team Y\`,
          situation: 'Back-to-back with travel',
          edge: 'Fade the traveling team',
          confidence: 'High'
        }
      ],
      note: 'Mock data - service being fixed'
    };
    res.json({ success: true, data: spotPlays });
  } catch (error) {
    console.error('❌ Spot plays endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});`;

// 3. Fix GPP leverage endpoint
const gppLeverageOld = `app.get('/api/contest/gpp/leverage', async (req, res) => {
  try {
    const { sport, contestSize } = req.query;
    const leveragePlays = await ContestOptimizer.findLeveragePlays({
      sport: sport || 'NFL',
      contestSize: contestSize || 'large'
    });
    res.json({ success: true, data: leveragePlays });
  } catch (error) {
    console.error('❌ GPP leverage endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});`;

const gppLeverageNew = `app.get('/api/contest/gpp/leverage', async (req, res) => {
  try {
    const { sport, contestSize } = req.query;
    // Mock response for now
    const leveragePlays = {
      leveragePlays: [
        {
          player: \`\${sport || 'NFL'} Mock Player\`,
          position: 'QB',
          leverage: 'Low ownership, high ceiling',
          contestSize: contestSize || 'large'
        }
      ],
      note: 'Mock data - service being fixed'
    };
    res.json({ success: true, data: leveragePlays });
  } catch (error) {
    console.error('❌ GPP leverage endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});`;

// Apply replacements
content = content.replace(arbitrageOld, arbitrageNew);
content = content.replace(spotPlaysOld, spotPlaysNew);
content = content.replace(gppLeverageOld, gppLeverageNew);

fs.writeFileSync(serverFile, content);
console.log('✅ Fixed all three endpoints with mock responses');
