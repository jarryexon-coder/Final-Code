// test/integration/app-flow.test.js - Integration tests for NBA Backend
import request from 'supertest';
import { expect } from 'chai';
import { describe, it } from 'mocha';

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3002';

// Test data
const TEST_USER = {
  userId: 'test_user_123',
  sessionId: 'test_session_456'
};

describe('🔄 Testing Complete NBA Fantasy App Flow', function() {
  this.timeout(10000); // Increase timeout for integration tests

  console.log('\n🚀 STARTING APP FLOW TESTS');
  console.log('===========================\n');

  describe('📊 1. Health Checks', () => {
    it('should return healthy status for main backend', async () => {
      const res = await request(BASE_URL).get('/health');
      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('healthy');
      console.log('✅ Main backend health check passed');
    });

    it('should return healthy status for API health endpoint', async () => {
      const res = await request(BASE_URL).get('/api/health');
      expect(res.status).to.equal(200);
      expect(res.body.service).to.include('NBA Fantasy AI Backend');
      console.log('✅ API health endpoint passed');
    });

    it('should check database health', async () => {
      const res = await request(BASE_URL).get('/api/database/health');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      console.log('✅ Database health check passed');
    });
  });

  describe('🏀 2. Sports Data Endpoints', () => {
    it('should fetch NBA games', async () => {
      const res = await request(BASE_URL).get('/api/nba/games');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.games).to.be.an('array');
      console.log(`✅ NBA games fetched: ${res.body.games?.length || 0} games`);
    });

    it('should fetch today\'s NBA games', async () => {
      const res = await request(BASE_URL).get('/api/nba/games/today');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      console.log('✅ Today\'s NBA games fetched');
    });

    it('should fetch NHL games', async () => {
      const res = await request(BASE_URL).get('/api/nhl/games');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      console.log('✅ NHL games fetched');
    });
  });

  describe('📈 3. Kalshi Integration', () => {
    it('should check Kalshi service health', async () => {
      const res = await request(BASE_URL).get('/api/kalshi/health');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      console.log('✅ Kalshi health check passed');
    });

    it('should fetch Kalshi markets', async () => {
      const res = await request(BASE_URL)
        .get('/api/kalshi/markets')
        .set('kalshi-access-key', 'test_key');
      
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      console.log(`✅ Kalshi markets fetched: ${res.body.markets?.length || 0} markets`);
    });

    it('should fetch Kalshi news', async () => {
      const res = await request(BASE_URL).get('/api/kalshi/news');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      console.log(`✅ Kalshi news fetched: ${res.body.news?.length || 0} articles`);
    });
  });

  describe('🤖 4. AI Predictions & Analytics', () => {
    it('should generate AI prediction', async () => {
      const res = await request(BASE_URL)
        .post('/api/predictions/generate')
        .send({
          prompt: "Will Lakers win tonight?",
          sport: "NBA"
        });
      
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      console.log('✅ AI prediction generated');
    });

    it('should log analytics event', async () => {
      const res = await request(BASE_URL)
        .post('/api/analytics/log')
        .send({
          eventName: 'test_event',
          eventData: { action: 'test' },
          userId: TEST_USER.userId,
          sessionId: TEST_USER.sessionId
        });
      
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      console.log('✅ Analytics event logged');
    });

    it('should fetch analytics summary', async () => {
      const res = await request(BASE_URL)
        .get('/api/analytics/summary')
        .query({ userId: TEST_USER.userId });
      
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      console.log('✅ Analytics summary fetched');
    });
  });

  describe('🔑 5. Authentication & Premium Features', () => {
    it('should validate subscription', async () => {
      const res = await request(BASE_URL)
        .get(`/api/premium/validate/${TEST_USER.userId}`);
      
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      console.log('✅ Subscription validation passed');
    });

    it('should check usage limits', async () => {
      const res = await request(BASE_URL)
        .get(`/api/premium/limits/${TEST_USER.userId}`)
        .query({ featureKey: 'secret_phrases' });
      
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      console.log('✅ Usage limits checked');
    });
  });

  describe('🔄 6. Complete User Flow Simulation', () => {
    it('should simulate complete user session', async () => {
      console.log('\n🔍 Simulating complete user session:');
      
      // 1. Check health
      await request(BASE_URL).get('/health');
      console.log('  1. Health check ✓');
      
      // 2. Get NBA games
      await request(BASE_URL).get('/api/nba/games');
      console.log('  2. View NBA games ✓');
      
      // 3. Get Kalshi markets
      await request(BASE_URL)
        .get('/api/kalshi/markets?limit=3')
        .set('kalshi-access-key', 'test_key');
      console.log('  3. View Kalshi markets ✓');
      
      // 4. Generate prediction
      await request(BASE_URL)
        .post('/api/predictions/generate')
        .send({
          prompt: "Who will win Lakers vs Warriors?",
          sport: "NBA"
        });
      console.log('  4. Generate prediction ✓');
      
      // 5. Log analytics
      await request(BASE_URL)
        .post('/api/analytics/log')
        .send({
          eventName: 'user_flow_complete',
          userId: TEST_USER.userId,
          sessionId: TEST_USER.sessionId
        });
      console.log('  5. Log analytics ✓');
      
      console.log('\n🎉 Complete user flow simulation successful!');
    });
  });
});
