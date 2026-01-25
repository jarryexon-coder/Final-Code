// controllers/selections.controller.js
import Selection from '../models/selection.js';
import Analytics from '../models/analytics.js';

// Create a new selection
export const createSelection = async (req, res) => {
  try {
    const { userId } = req.user;
    const selectionData = req.body;

    const selection = new Selection({
      userId,
      ...selectionData,
      status: 'pending',
      trackedAt: new Date()
    });

    await selection.save();

    // Log analytics
    await Analytics.create({
      userId,
      eventType: 'selection_created',
      eventData: {
        selectionId: selection._id,
        type: selection.selectionType,
        sport: selection.sport,
        winnersCount: selection.winnersCount
      },
      metadata: { timestamp: new Date() }
    });

    res.status(201).json({
      success: true,
      message: 'Selection created successfully',
      data: selection
    });
  } catch (error) {
    console.error('Create selection error:', error);
    res.status(500).json({ success: false, message: 'Failed to create selection', error: error.message });
  }
};

// Get all selections
export const getAllSelections = async (req, res) => {
  try {
    const { userId } = req.user;
    const { 
      page = 1, 
      limit = 20,
      sport,
      type,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { userId };
    
    if (sport && sport !== 'all') query.sport = sport;
    if (type && type !== 'all') query.selectionType = type;
    if (status && status !== 'all') query.status = status;

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const selections = await Selection.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username avatar');

    const total = await Selection.countDocuments(query);

    // Get statistics
    const stats = await Selection.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        selections,
        stats: stats[0] || {
          total: 0,
          pending: 0,
          active: 0,
          completed: 0,
          won: 0,
          lost: 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get selections error:', error);
    res.status(500).json({ success: false, message: 'Failed to get selections', error: error.message });
  }
};

// Get selection by ID
export const getSelectionById = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const selection = await Selection.findOne({ _id: id, userId })
      .populate('userId', 'username avatar');

    if (!selection) {
      return res.status(404).json({ success: false, message: 'Selection not found' });
    }

    // Increment views
    selection.views = (selection.views || 0) + 1;
    await selection.save();

    res.json({
      success: true,
      data: selection
    });
  } catch (error) {
    console.error('Get selection error:', error);
    res.status(500).json({ success: false, message: 'Failed to get selection', error: error.message });
  }
};

// Update selection
export const updateSelection = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    const selection = await Selection.findOneAndUpdate(
      { _id: id, userId },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!selection) {
      return res.status(404).json({ success: false, message: 'Selection not found' });
    }

    // Log update
    await Analytics.create({
      userId,
      eventType: 'selection_updated',
      eventData: {
        selectionId: selection._id,
        updates: Object.keys(updateData)
      },
      metadata: { timestamp: new Date() }
    });

    res.json({
      success: true,
      message: 'Selection updated successfully',
      data: selection
    });
  } catch (error) {
    console.error('Update selection error:', error);
    res.status(500).json({ success: false, message: 'Failed to update selection', error: error.message });
  }
};

// Delete selection
export const deleteSelection = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const selection = await Selection.findOneAndDelete({ _id: id, userId });

    if (!selection) {
      return res.status(404).json({ success: false, message: 'Selection not found' });
    }

    // Log deletion
    await Analytics.create({
      userId,
      eventType: 'selection_deleted',
      eventData: {
        selectionId: id,
        type: selection.selectionType,
        sport: selection.sport
      },
      metadata: { timestamp: new Date() }
    });

    res.json({
      success: true,
      message: 'Selection deleted successfully'
    });
  } catch (error) {
    console.error('Delete selection error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete selection', error: error.message });
  }
};

// Update selection status
export const updateSelectionStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { status, result, notes } = req.body;

    const selection = await Selection.findOneAndUpdate(
      { _id: id, userId },
      { 
        status,
        result,
        notes,
        ...(status === 'completed' && { completedAt: new Date() }),
        ...(result && { resultUpdatedAt: new Date() }),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!selection) {
      return res.status(404).json({ success: false, message: 'Selection not found' });
    }

    // Log status update
    await Analytics.create({
      userId,
      eventType: 'selection_status_updated',
      eventData: {
        selectionId: selection._id,
        oldStatus: selection.status,
        newStatus: status,
        result
      },
      metadata: { timestamp: new Date() }
    });

    res.json({
      success: true,
      message: 'Selection status updated successfully',
      data: selection
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// Get selection statistics
export const getSelectionStats = async (req, res) => {
  try {
    const { userId } = req.user;
    const { timeframe = 'all' } = req.query;

    let dateFilter = {};
    if (timeframe === '7d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      dateFilter = { createdAt: { $gte: cutoff } };
    } else if (timeframe === '30d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      dateFilter = { createdAt: { $gte: cutoff } };
    }

    const stats = await Selection.aggregate([
      { $match: { userId, ...dateFilter } },
      {
        $facet: {
          overallStats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                totalWinners: { $sum: '$winnersCount' },
                averageConfidence: { $avg: '$confidence' },
                averageEdgeScore: { $avg: '$edgeScore' },
                successRate: {
                  $avg: {
                    $cond: [
                      { $eq: ['$result', 'win'] },
                      1,
                      { $cond: [{ $eq: ['$result', 'loss'] }, 0, null] }
                    ]
                  }
                }
              }
            }
          ],
          bySport: [
            {
              $group: {
                _id: '$sport',
                count: { $sum: 1 },
                wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
                losses: { $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] } },
                averageConfidence: { $avg: '$confidence' }
              }
            }
          ],
          byType: [
            {
              $group: {
                _id: '$selectionType',
                count: { $sum: 1 },
                wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
                averageEdgeScore: { $avg: '$edgeScore' }
              }
            }
          ],
          byBumpRisk: [
            {
              $group: {
                _id: '$bumpRisk',
                count: { $sum: 1 },
                wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } }
              }
            }
          ],
          recentActivity: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 1,
                title: 1,
                sport: 1,
                selectionType: 1,
                status: 1,
                result: 1,
                createdAt: 1
              }
            }
          ]
        }
      }
    ]);

    const overall = stats[0].overallStats[0] || {};
    const successRate = overall.successRate ? (overall.successRate * 100).toFixed(2) : '0.00';

    res.json({
      success: true,
      data: {
        timeframe,
        overall: {
          ...overall,
          successRate
        },
        bySport: stats[0].bySport,
        byType: stats[0].byType,
        byBumpRisk: stats[0].byBumpRisk,
        recentActivity: stats[0].recentActivity
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get statistics', error: error.message });
  }
};

// Bulk update selections
export const bulkUpdateSelections = async (req, res) => {
  try {
    const { userId } = req.user;
    const { selectionIds, updates } = req.body;

    if (!selectionIds || !Array.isArray(selectionIds) || selectionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No selections provided' });
    }

    const result = await Selection.updateMany(
      { _id: { $in: selectionIds }, userId },
      { ...updates, updatedAt: new Date() }
    );

    // Log bulk update
    await Analytics.create({
      userId,
      eventType: 'bulk_selection_update',
      eventData: {
        count: selectionIds.length,
        updates: Object.keys(updates)
      },
      metadata: { timestamp: new Date() }
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} selections updated successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk update selections', error: error.message });
  }
};

// Export selections
export const exportSelections = async (req, res) => {
  try {
    const { userId } = req.user;
    const { format = 'json', startDate, endDate } = req.query;

    const query = { userId };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const selections = await Selection.find(query)
      .sort({ createdAt: -1 })
      .lean();

    let exportData;
    switch (format) {
      case 'csv':
        // Convert to CSV
        const headers = ['ID', 'Title', 'Sport', 'Type', 'Confidence', 'Edge Score', 'Status', 'Result', 'Created At'];
        const rows = selections.map(sel => [
          sel._id,
          sel.title,
          sel.sport,
          sel.selectionType,
          sel.confidence,
          sel.edgeScore,
          sel.status,
          sel.result || '',
          sel.createdAt
        ]);
        
        exportData = [headers, ...rows].map(row => row.join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=selections-export.csv');
        return res.send(exportData);

      case 'json':
      default:
        exportData = {
          exportDate: new Date().toISOString(),
          count: selections.length,
          data: selections
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=selections-export.json');
        return res.json(exportData);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export selections', error: error.message });
  }
};

// Get selection timeline
export const getSelectionTimeline = async (req, res) => {
  try {
    const { userId } = req.user;
    const { days = 30 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const timeline = await Selection.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: cutoffDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          selections: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
          averageConfidence: { $avg: '$confidence' },
          averageEdgeScore: { $avg: '$edgeScore' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        days,
        timeline,
        totalSelections: timeline.reduce((sum, day) => sum + day.selections, 0),
        totalWins: timeline.reduce((sum, day) => sum + day.wins, 0)
      }
    });
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ success: false, message: 'Failed to get timeline', error: error.message });
  }
};

// Default export
export default {
  createSelection,
  getSelections,
  getSelectionById,
  updateSelection,
  deleteSelection,
  updateSelectionStatus,
  getSelectionStats,
  bulkUpdateSelections,
  exportSelections,
  getSelectionTimeline
};

// Get all selections (this might already exist as getSelections, we need to rename)
export const getTodaySelections = async (req, res) => {
  try {
    const { userId } = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const selections = await Selection.find({
      userId,
      createdAt: { $gte: today, $lt: tomorrow }
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: selections,
      count: selections.length
    });
  } catch (error) {
    console.error('Get today selections error:', error);
    res.status(500).json({ success: false, message: 'Failed to get today\'s selections', error: error.message });
  }
};

// Get winners for selection
export const getWinnersForSelection = async (req, res) => {
  try {
    const { id } = req.params;
    const selection = await Selection.findById(id);
    
    if (!selection) {
      return res.status(404).json({
        success: false,
        message: 'Selection not found'
      });
    }
    
    // Assuming winners are stored in the selection document
    res.json({
      success: true,
      data: selection.winners || [],
      count: selection.winners ? selection.winners.length : 0
    });
  } catch (error) {
    console.error('Get winners error:', error);
    res.status(500).json({ success: false, message: 'Failed to get winners', error: error.message });
  }
};

// Add winner to selection
export const addWinnerToSelection = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const winnerData = req.body;
    
    const selection = await Selection.findOne({ _id: id, userId });
    
    if (!selection) {
      return res.status(404).json({
        success: false,
        message: 'Selection not found'
      });
    }
    
    // Initialize winners array if it doesn't exist
    if (!selection.winners) {
      selection.winners = [];
    }
    
    selection.winners.push({
      ...winnerData,
      addedAt: new Date()
    });
    
    await selection.save();
    
    res.json({
      success: true,
      message: 'Winner added successfully',
      data: selection.winners
    });
  } catch (error) {
    console.error('Add winner error:', error);
    res.status(500).json({ success: false, message: 'Failed to add winner', error: error.message });
  }
};

// Update winner
export const updateWinner = async (req, res) => {
  try {
    const { winnerId } = req.params;
    const updateData = req.body;
    
    // Find selection containing this winner
    const selection = await Selection.findOne({ 'winners._id': winnerId });
    
    if (!selection) {
      return res.status(404).json({
        success: false,
        message: 'Winner not found'
      });
    }
    
    // Update the winner
    const winnerIndex = selection.winners.findIndex(w => w._id.toString() === winnerId);
    if (winnerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Winner not found'
      });
    }
    
    selection.winners[winnerIndex] = {
      ...selection.winners[winnerIndex].toObject(),
      ...updateData,
      updatedAt: new Date()
    };
    
    await selection.save();
    
    res.json({
      success: true,
      message: 'Winner updated successfully',
      data: selection.winners[winnerIndex]
    });
  } catch (error) {
    console.error('Update winner error:', error);
    res.status(500).json({ success: false, message: 'Failed to update winner', error: error.message });
  }
};

// Remove winner
export const removeWinner = async (req, res) => {
  try {
    const { winnerId } = req.params;
    
    const selection = await Selection.findOne({ 'winners._id': winnerId });
    
    if (!selection) {
      return res.status(404).json({
        success: false,
        message: 'Winner not found'
      });
    }
    
    selection.winners = selection.winners.filter(w => w._id.toString() !== winnerId);
    await selection.save();
    
    res.json({
      success: true,
      message: 'Winner removed successfully'
    });
  } catch (error) {
    console.error('Remove winner error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove winner', error: error.message });
  }
};

// Create batch selections
export const createBatchSelections = async (req, res) => {
  try {
    const { userId } = req.user;
    const { selections } = req.body;
    
    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No selections provided'
      });
    }
    
    const createdSelections = await Selection.insertMany(
      selections.map(selection => ({
        userId,
        ...selection,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );
    
    res.status(201).json({
      success: true,
      message: `Created ${createdSelections.length} selections`,
      data: createdSelections
    });
  } catch (error) {
    console.error('Create batch selections error:', error);
    res.status(500).json({ success: false, message: 'Failed to create batch selections', error: error.message });
  }
};

// Duplicate selection
export const duplicateSelection = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    const original = await Selection.findOne({ _id: id, userId });
    
    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Selection not found'
      });
    }
    
    const duplicate = new Selection({
      ...original.toObject(),
      _id: undefined,
      isDuplicate: true,
      originalSelectionId: original._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await duplicate.save();
    
    res.status(201).json({
      success: true,
      message: 'Selection duplicated successfully',
      data: duplicate
    });
  } catch (error) {
    console.error('Duplicate selection error:', error);
    res.status(500).json({ success: false, message: 'Failed to duplicate selection', error: error.message });
  }
};

// Track selection
export const trackSelection = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    const selection = await Selection.findOneAndUpdate(
      { _id: id, userId },
      { isTracked: true, trackedAt: new Date() },
      { new: true }
    );
    
    if (!selection) {
      return res.status(404).json({
        success: false,
        message: 'Selection not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Selection tracked successfully',
      data: selection
    });
  } catch (error) {
    console.error('Track selection error:', error);
    res.status(500).json({ success: false, message: 'Failed to track selection', error: error.message });
  }
};

// Untrack selection
export const untrackSelection = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    const selection = await Selection.findOneAndUpdate(
      { _id: id, userId },
      { isTracked: false },
      { new: true }
    );
    
    if (!selection) {
      return res.status(404).json({
        success: false,
        message: 'Selection not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Selection untracked successfully',
      data: selection
    });
  } catch (error) {
    console.error('Untrack selection error:', error);
    res.status(500).json({ success: false, message: 'Failed to untrack selection', error: error.message });
  }
};

// Get tracked selections
export const getTrackedSelections = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const trackedSelections = await Selection.find({
      userId,
      isTracked: true
    }).sort({ trackedAt: -1 });
    
    res.json({
      success: true,
      data: trackedSelections,
      count: trackedSelections.length
    });
  } catch (error) {
    console.error('Get tracked selections error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tracked selections', error: error.message });
  }
};
