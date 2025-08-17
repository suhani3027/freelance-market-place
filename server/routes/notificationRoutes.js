import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  getUnreadNotificationCount,
  cleanupOldNotifications,
  markAllNotificationsAsRead
} from '../services/notificationService.js';

const router = express.Router();

// Get user's notifications with pagination
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { limit = 20, offset = 0, category, type, unreadOnly = false } = req.query;
    
    let notifications = await getUserNotifications(userEmail, parseInt(limit), parseInt(offset));
    
    // Filter by category if specified
    if (category) {
      notifications = notifications.filter(n => n.category === category);
    }
    
    // Filter by type if specified
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    
    // Filter unread only if specified
    if (unreadOnly === 'true') {
      notifications = notifications.filter(n => !n.read);
    }
    
    res.json({
      notifications,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/unread-count', authenticateJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const count = await getUnreadNotificationCount(userEmail);
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticateJWT, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userEmail = req.user.email;
    
    const notification = await markNotificationAsRead(notificationId, userEmail);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const result = await markAllNotificationsAsRead(userEmail);
    
    res.json({ 
      message: 'All notifications marked as read', 
      updatedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete a notification
router.delete('/:notificationId', authenticateJWT, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userEmail = req.user.email;
    
    const { Notification } = await import('../models/notification.js');
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userEmail
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get notification statistics
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { Notification } = await import('../models/notification.js');
    
    const stats = await Notification.aggregate([
      { $match: { recipient: userEmail } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: ['$read', 0, 1] }
          }
        }
      }
    ]);
    
    const totalCount = await Notification.countDocuments({ recipient: userEmail });
    const unreadCount = await Notification.countDocuments({ 
      recipient: userEmail, 
      read: false 
    });
    
    res.json({
      total: totalCount,
      unread: unreadCount,
      byType: stats,
      categories: {
        proposal: stats.filter(s => s._id.includes('proposal')).reduce((sum, s) => sum + s.count, 0),
        payment: stats.filter(s => s._id.includes('payment')).reduce((sum, s) => sum + s.count, 0),
        message: stats.filter(s => s._id.includes('message')).reduce((sum, s) => sum + s.count, 0),
        gig: stats.filter(s => s._id.includes('gig')).reduce((sum, s) => sum + s.count, 0),
        order: stats.filter(s => s._id.includes('order')).reduce((sum, s) => sum + s.count, 0),
        system: stats.filter(s => !s._id.includes('proposal') && !s._id.includes('payment') && !s._id.includes('message') && !s._id.includes('gig') && !s._id.includes('order')).reduce((sum, s) => sum + s.count, 0)
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

// Cleanup old notifications (admin only)
router.delete('/cleanup/old', authenticateJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { daysOld = 30 } = req.query;
    
    // Only allow users to cleanup their own notifications
    const { Notification } = await import('../models/notification.js');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));
    
    const result = await Notification.deleteMany({
      recipient: userEmail,
      createdAt: { $lt: cutoffDate },
      read: true
    });
    
    res.json({ 
      message: `Cleaned up ${result.deletedCount} old notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Cleanup notifications error:', error);
    res.status(500).json({ error: 'Failed to cleanup old notifications' });
  }
});

export default router; 