const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: { 
    type: String, 
    enum: [
      'project_created',
      'project_updated', 
      'project_deleted',
      'task_created',
      'task_updated',
      'task_completed',
      'task_deleted',
      'member_added',
      'member_removed',
      'comment_added'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String
  }, 
  createdAt: {
    type: Date,
    default: Date.now
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
