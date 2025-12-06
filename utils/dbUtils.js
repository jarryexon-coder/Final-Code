const Player = require('../models/Player');

exports.getAllPlayers = async () => {
  return await Player.find().sort({ points: -1 }).limit(50);
};

exports.searchPlayers = async (searchTerm) => {
  return await Player.find({
    name: new RegExp(searchTerm, 'i')
  }).limit(10);
};

exports.updatePlayerStats = async (playerName, stats) => {
  return await Player.findOneAndUpdate(
    { name: new RegExp(playerName, 'i') },
    { ...stats, lastUpdated: new Date() },
    { upsert: true, new: true }
  );
};
