const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { projectValidation } = require('../middleware/validationMiddleware');

router.use(protect); // All project routes require auth

router.route('/').get(getProjects).post(authorize('Admin', 'Project Manager', 'Developer', 'Designer', 'QA'), projectValidation, createProject);
router.route('/:id').get(getProject).put(authorize('Admin', 'Project Manager', 'Developer', 'Designer', 'QA'), projectValidation, updateProject).delete(authorize('Admin', 'Project Manager', 'Developer', 'Designer', 'QA'), deleteProject);

module.exports = router;