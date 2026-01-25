// config/utils/aiGeneration.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client
let openaiClient = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 3
    });
    console.log('✅ OpenAI client initialized');
  } else {
    console.warn('⚠️  OpenAI API key not found. AI features will be simulated.');
  }
} catch (error) {
  console.error('❌ OpenAI initialization error:', error.message);
}

// Generate AI response
export const generateAIResponse = async (prompt, options = {}) => {
  const {
    model = 'gpt-3.5-turbo',
    temperature = 0.7,
    maxTokens = 1000,
    systemPrompt = 'You are a helpful sports analytics assistant.',
    simulate = !openaiClient
  } = options;

  // If no OpenAI client or simulation requested, use mock response
  if (simulate || !openaiClient) {
    return simulateAIResponse(prompt, options);
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens
    });

    return {
      content: response.choices[0]?.message?.content || '',
      model: response.model,
      usage: response.usage,
      finishReason: response.choices[0]?.finish_reason
    };
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    
    // Fall back to simulation
    return simulateAIResponse(prompt, options);
  }
};

// Simulate AI response for development
const simulateAIResponse = (prompt, options) => {
  const { model = 'gpt-3.5-turbo-simulated' } = options;
  
  // Simple keyword-based responses for common sports queries
  const responses = {
    'analysis': `Based on the provided data, here's a comprehensive analysis:
- Recent performance shows positive trends
- Matchup favors the selection
- Historical data supports this prediction
- Risk level: Moderate
Recommendation: Consider this as a value play.`,
    
    'prediction': `Prediction based on current data:
- Expected outcome: Positive
- Confidence level: 75%
- Key factors: Recent form, matchup advantage, historical performance
- Risk factors: Injury concerns, travel schedule`,
    
    'selection': `Recommended selection criteria:
1. Value rating: High
2. Consistency: Above average
3. Upside potential: Strong
4. Risk level: Moderate
This selection represents good value based on current odds.`,
    
    'default': `Analysis generated based on the provided prompt. The data suggests a favorable outcome with moderate risk. Consider current form, matchup details, and historical trends when making your final decision.`
  };

  // Determine response type based on prompt keywords
  let responseType = 'default';
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('analyze') || promptLower.includes('analysis')) {
    responseType = 'analysis';
  } else if (promptLower.includes('predict') || promptLower.includes('prediction')) {
    responseType = 'prediction';
  } else if (promptLower.includes('select') || promptLower.includes('pick')) {
    responseType = 'selection';
  }

  return {
    content: responses[responseType],
    model,
    usage: { prompt_tokens: prompt.length, completion_tokens: 100, total_tokens: prompt.length + 100 },
    finishReason: 'stop',
    simulated: true
  };
};

// Validate generated content
export const validateContent = async (content, validationRules = {}) => {
  const {
    minLength = 50,
    maxLength = 5000,
    checkForSensitiveInfo = true,
    checkForProfanity = true,
    checkForPlagiarism = false
  } = validationRules;

  const issues = [];
  const warnings = [];

  // Check length
  if (content.length < minLength) {
    issues.push(`Content too short (${content.length} chars, minimum ${minLength})`);
  }
  if (content.length > maxLength) {
    warnings.push(`Content very long (${content.length} chars, maximum ${maxLength})`);
  }

  // Check for sensitive information (simple patterns)
  const sensitivePatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{16}\b/, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{10}\b/ // Phone
  ];

  if (checkForSensitiveInfo) {
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        issues.push('Potential sensitive information detected');
      }
    });
  }

  // Check for profanity (simple word list)
  if (checkForProfanity) {
    const profanityWords = ['badword1', 'badword2']; // Add actual profanity list
    const words = content.toLowerCase().split(/\W+/);
    const foundProfanity = words.filter(word => profanityWords.includes(word));
    if (foundProfanity.length > 0) {
      issues.push(`Profanity detected: ${foundProfanity.join(', ')}`);
    }
  }

  // Calculate content quality score
  const qualityScore = calculateContentQuality(content);

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    qualityScore,
    validationDate: new Date().toISOString()
  };
};

// Calculate content quality score
const calculateContentQuality = (content) => {
  let score = 0;
  const maxScore = 100;

  // Length score (20%)
  const lengthScore = Math.min(content.length / 100, 1) * 20;
  score += lengthScore;

  // Readability score (30%)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  
  if (sentences.length > 0 && words.length > 0) {
    const avgSentenceLength = words.length / sentences.length;
    const readabilityScore = avgSentenceLength >= 10 && avgSentenceLength <= 20 ? 30 : 
                           avgSentenceLength >= 5 && avgSentenceLength <= 30 ? 20 : 10;
    score += readabilityScore;
  }

  // Structure score (25%)
  const hasParagraphs = content.split(/\n\s*\n/).length > 1;
  const hasBulletPoints = /[-*•]\s/.test(content);
  const hasHeadings = /#{1,6}\s/.test(content);
  
  if (hasParagraphs) score += 10;
  if (hasBulletPoints) score += 10;
  if (hasHeadings) score += 5;

  // Keyword diversity score (25%)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const diversityRatio = uniqueWords.size / words.length;
  const diversityScore = Math.min(diversityRatio * 25, 25);
  score += diversityScore;

  return Math.round(Math.min(score, maxScore));
};

// Generate batch AI responses
export const generateBatchResponses = async (prompts, options = {}) => {
  const {
    batchSize = 5,
    delayBetweenBatches = 1000,
    concurrency = 1
  } = options;

  const results = [];
  
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    const batchPromises = batch.map(prompt => 
      generateAIResponse(prompt, options)
    );

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push({
          prompt: batch[index],
          response: result.value,
          status: 'success'
        });
      } else {
        results.push({
          prompt: batch[index],
          error: result.reason?.message || 'Unknown error',
          status: 'failed'
        });
      }
    });

    // Delay between batches to avoid rate limiting
    if (i + batchSize < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
};

// Extract structured data from AI response
export const extractStructuredData = (content, schema = {}) => {
  const defaultSchema = {
    selections: 'array',
    analysis: 'string',
    recommendations: 'array',
    confidence: 'number',
    riskLevel: 'string'
  };

  const targetSchema = { ...defaultSchema, ...schema };
  const result = {};

  try {
    // Try to parse as JSON first
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      const parsed = JSON.parse(content);
      return parsed;
    }

    // Extract key-value pairs
    const lines = content.split('\n');
    let currentKey = null;
    let currentValue = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check for key patterns
      const keyMatch = trimmedLine.match(/^([A-Za-z\s]+):/);
      if (keyMatch) {
        // Save previous key-value pair
        if (currentKey) {
          const keyName = currentKey.toLowerCase().replace(/\s+/g, '');
          if (targetSchema[keyName]) {
            result[keyName] = formatValue(currentValue.join(' ').trim(), targetSchema[keyName]);
          }
        }
        
        // Start new key
        currentKey = keyMatch[1];
        currentValue = [trimmedLine.replace(keyMatch[0], '').trim()];
      } else if (currentKey && trimmedLine) {
        // Continue current value
        currentValue.push(trimmedLine);
      }
    });

    // Save last key-value pair
    if (currentKey) {
      const keyName = currentKey.toLowerCase().replace(/\s+/g, '');
      if (targetSchema[keyName]) {
        result[keyName] = formatValue(currentValue.join(' ').trim(), targetSchema[keyName]);
      }
    }

    return result;
  } catch (error) {
    console.error('Error extracting structured data:', error.message);
    return { rawContent: content };
  }
};

// Format value based on schema type
const formatValue = (value, type) => {
  switch (type) {
    case 'number':
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    
    case 'array':
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          return JSON.parse(value);
        } catch {
          // Fall back to splitting
        }
      }
      return value.split(/[,\n]/).map(item => item.trim()).filter(item => item);
    
    case 'boolean':
      const lowerValue = value.toLowerCase();
      return lowerValue.includes('true') || lowerValue.includes('yes') || lowerValue.includes('1');
    
    default:
      return value;
  }
};

// Check if AI service is available
export const isAIServiceAvailable = () => {
  return !!openaiClient;
};

// Get AI service status
export const getAIServiceStatus = async () => {
  if (!openaiClient) {
    return {
      available: false,
      mode: 'simulation',
      models: ['gpt-3.5-turbo-simulated', 'gpt-4-simulated']
    };
  }

  try {
    // Try to list models to check API connectivity
    const models = await openaiClient.models.list();
    
    return {
      available: true,
      mode: 'production',
      models: models.data.map(m => m.id).slice(0, 10), // First 10 models
      modelCount: models.data.length
    };
  } catch (error) {
    return {
      available: false,
      mode: 'simulation',
      error: error.message
    };
  }
};

export default {
  generateAIResponse,
  validateContent,
  generateBatchResponses,
  extractStructuredData,
  isAIServiceAvailable,
  getAIServiceStatus,
  calculateContentQuality
};
