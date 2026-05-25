const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// @desc    Get all team members
// @route   GET /api/team
// @access  Private
const getTeamMembers = async (req, res) => {
  try {
    const members = await TeamMember.find()
      .populate('user', 'name email role avatar createdAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: members.length, members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single team member
// @route   GET /api/team/:id
// @access  Private
const getTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id).populate(
      'user',
      'name email role avatar'
    );

    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    res.json({ success: true, member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update team member details (role, department, skills, etc.)
// @route   PUT /api/team/:id
// @access  Private
const updateTeamMember = async (req, res) => {
  try {
    const { role, department, phone, skills, availability } = req.body;

    const member = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { role, department, phone, skills, availability },
      { new: true, runValidators: true }
    ).populate('user', 'name email role avatar');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    res.json({ success: true, member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Remove team member (delete user + team record)
// @route   DELETE /api/team/:id
// @access  Private
const removeTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id).populate('user');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    const userName = member.user?.name || 'A team member';

    await User.findByIdAndDelete(member.user);
    await member.deleteOne();

    // Dispatch notifications to all other active users
    try {
      const activeUsers = await User.find({});
      for (const activeUser of activeUsers) {
        if (activeUser._id.toString() !== member.user?.toString()) {
          await createNotification({
            userId: activeUser._id,
            type: 'member_removed',
            title: 'Team Member Removed',
            message: `${userName} was removed from the team`,
            actionUrl: '/team',
            triggeredBy: req.user._id
          });
        }
      }
    } catch (e) {
      console.error('Failed to dispatch member removal notifications:', e.message);
    }

    res.json({ success: true, message: 'Team member removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTeamMembers, getTeamMember, updateTeamMember, removeTeamMember };