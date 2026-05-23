const { body, validationResult } = require('express-validator');

// Generic validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isString(),
  validate
];

const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('status').optional().isString(),
  body('dueDate').optional().isISO8601().withMessage('Must be a valid date'),
  validate
];

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').notEmpty().withMessage('Project ID is required').isMongoId().withMessage('Invalid Project ID'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isString(),
  body('dueDate').optional().isISO8601(),
  validate
];

const teamValidation = [
  body('role').notEmpty().withMessage('Role is required'),
  validate
];

module.exports = {
  registerValidation,
  loginValidation,
  projectValidation,
  taskValidation,
  teamValidation,
};
