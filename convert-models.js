import { readFileSync, writeFileSync } from 'fs';

const models = [
  'models/FantasyTeam.js',
  'models/Prediction.js',
  'models/promo/InfluencerCommission.js',
  'models/promo/PromoCode.js',
  'models/promo/PromoUsage.js',
  'models/promo/UserSubscription.js'
];

for (const model of models) {
  try {
    let content = readFileSync(model, 'utf8');
    
    // Convert mongoose require
    content = content.replace(
      /const mongoose = require\('mongoose'\);/,
      "import mongoose from 'mongoose';"
    );
    
    // Convert sequelize requires
    content = content.replace(
      /const \{ Model, DataTypes \} = require\('sequelize'\);/,
      "import { Model, DataTypes } from 'sequelize';"
    );
    
    writeFileSync(model + '.backup', readFileSync(model, 'utf8'));
    writeFileSync(model, content);
    console.log(`✅ Converted ${model}`);
  } catch (error) {
    console.log(`⚠️  Skipped ${model}: ${error.message}`);
  }
}
