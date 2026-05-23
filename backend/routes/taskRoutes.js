const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { taskValidation } = require('../middleware/validationMiddleware');

router.use(protect); // All task routes require auth

router.route('/').get(getTasks).post(authorize('Admin', 'Project Manager'), taskValidation, createTask);
router.route('/:id').get(getTask).put(taskValidation, updateTask).delete(authorize('Admin', 'Project Manager'), deleteTask);

module.exports = router;