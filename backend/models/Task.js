const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
  status: {
  type: String,
  enum: ['Todo', 'In Progress', 'In Review', 'Completed', 'todo', 'in-progress', 'review', 'done'],
  default: 'Todo',
},
priority: {
  type: String,
  enum: ['Low', 'Medium', 'High', 'low', 'medium', 'high'],
  default: 'Medium',
},
    dueDate: {
      type: Date,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);