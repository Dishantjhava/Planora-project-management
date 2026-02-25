const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'On Hold', 'Completed'],
      default: 'Planning',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'low', 'medium', 'high'],
      default: 'Medium',
    },
    dueDate: {
      type: Date,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);