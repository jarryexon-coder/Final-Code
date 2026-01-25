// utils/modelHelper.js
import mongoose from 'mongoose';

export function getOrCreateModel(modelName, schema) {
  if (mongoose.models[modelName]) {
    return mongoose.model(modelName);
  }
  return mongoose.model(modelName, schema);
}
