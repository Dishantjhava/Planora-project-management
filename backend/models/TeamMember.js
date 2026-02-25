const mongoose = require('mongoose');

// TeamMember acts as an extended profile / org-level record
// linked to a User account
const teamMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Project Manager', 'Developer', 'Designer', 'Frontend Developer', 'Backend Developer'],
      default: 'Developer',
    },
    department: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    skills: [{ type: String }],
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'On Leave'],
      default: 'Available',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TeamMember', teamMemberSchema);