const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      default: null,
    },
    role: {
      type: String,
      enum: ['Admin', 'Project Manager', 'Developer', 'Designer', 'Frontend Developer', 'Backend Developer'],
      default: 'Developer',
    },
    avatar: {
      type: String,
      default: '',
    },
    // Extended profile fields
    jobTitle: { type: String, default: '' },
    department: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: [200, 'Bio cannot exceed 200 characters'] },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    lastLogin: { type: Date, default: null },

    // Notification preferences
    notificationPrefs: {
      emailProjects:  { type: Boolean, default: true },
      emailTasks:     { type: Boolean, default: true },
      emailTeam:      { type: Boolean, default: true },
      emailDeadlines: { type: Boolean, default: true },
      emailWeekly:    { type: Boolean, default: false },
      inAppSound:     { type: Boolean, default: false },
      inAppDesktop:   { type: Boolean, default: true },
      inAppRealtime:  { type: Boolean, default: true },
      showOnline:     { type: Boolean, default: true },
      showLastActive: { type: Boolean, default: true },
      quietHoursEnabled: { type: Boolean, default: false },
      quietHoursFrom: { type: String, default: '22:00' },
      quietHoursTo:   { type: String, default: '08:00' },
      frequency:      { type: String, enum: ['realtime', 'daily', 'weekly'], default: 'realtime' },
    },

    // Privacy settings
    profileVisibility: { type: String, enum: ['public', 'private'], default: 'public' },

    refreshToken: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
  },
  { timestamps: true }
);

// Hash password before saving (skip for Google OAuth users)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);