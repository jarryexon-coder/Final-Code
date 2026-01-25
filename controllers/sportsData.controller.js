
// Default export
export default {
  getPlayers,};

// getPlayers - Added for sportsDataRoutes.js
export const getPlayers = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "getPlayers - Sports data",
      data: {
        endpoint: "getPlayers",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("getPlayers error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Sports data error", 
      error: error.message 
    });
  }
};
