import Player from '../models/Player.js';

export const getAllPlayers = async () => {
  return await Player.find().sort({ points: -1 }).limit(50);
};

export const searchPlayers = async (searchTerm) => {
  return await Player.find({
    name: new RegExp(searchTerm, 'i')
  }).limit(10);
};

export const updatePlayerStats = async (playerName, stats) => {
  return await Player.findOneAndUpdate(
    { name: new RegExp(playerName, 'i') },
    { ...stats, lastUpdated: new Date() },
    { upsert: true, new: true }
  );
};
