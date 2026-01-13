// src/components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { ApiTester } from '../utils/apiTester';

const AdminPanel = () => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);

  const runAllTests = async () => {
    setLoading(true);
    try {
      const results = await ApiTester.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = (sport) => {
    ApiTester.clearCacheBySport(sport);
    alert(`Cleared ${sport} cache`);
  };

  const getCacheStatus = () => {
    const stats = ApiTester.getCacheStatus();
    setCacheStats(stats);
  };

  useEffect(() => {
    getCacheStatus();
  }, []);

  return (
    <div className="admin-panel">
      <h2>🛠️ API Admin Panel</h2>
      
      <div className="control-buttons">
        <button onClick={runAllTests} disabled={loading}>
          {loading ? 'Running Tests...' : '🚀 Run All Tests'}
        </button>
        
        <div className="cache-controls">
          <h3>Cache Management:</h3>
          <button onClick={() => clearCache('nba')}>🗑️ Clear NBA Cache</button>
          <button onClick={() => clearCache('nfl')}>🗑️ Clear NFL Cache</button>
          <button onClick={() => clearCache('nhl')}>🗑️ Clear NHL Cache</button>
          <button onClick={() => clearCache('news')}>🗑️ Clear News Cache</button>
          <button onClick={() => clearCache('all')}>🔥 Clear All Cache</button>
        </div>
      </div>

      {cacheStats && (
        <div className="cache-stats">
          <h3>📊 Cache Statistics</h3>
          <p>Total entries: {cacheStats.totalEntries}</p>
          <p>Cache size: {Math.round(cacheStats.totalSize / 1024)}KB</p>
        </div>
      )}

      {testResults && (
        <div className="test-results">
          <h3>📋 Test Results</h3>
          
          <div className="result-section">
            <h4>🌐 Backend Connection</h4>
            <p style={{ color: testResults.backend.success ? 'green' : 'red' }}>
              {testResults.backend.success ? '✅ Connected' : '❌ Failed'}
            </p>
            {testResults.backend.success && (
              <p>Latency: {testResults.backend.latency}</p>
            )}
          </div>

          <div className="result-section">
            <h4>🏀 Sports Services</h4>
            {Object.entries(testResults.sportsServices).map(([service, result]) => (
              <div key={service} className="service-result">
                <span style={{ color: result.success ? 'green' : 'red' }}>
                  {result.success ? '✅' : '❌'} {service.toUpperCase()}
                </span>
                <span>{result.message || result.error}</span>
              </div>
            ))}
          </div>

          <div className="result-section">
            <h4>💾 Cache Performance</h4>
            {!testResults.cache.error && (
              <>
                <p>Initial request: {testResults.cache.initialRequest.latency}</p>
                <p>Cached request: {testResults.cache.cachedRequest.latency}</p>
                <p>Speed improvement: {testResults.cache.cachedRequest.speedImprovement}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
