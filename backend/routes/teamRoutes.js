const express = require('express');
const router = express.Router();
const {
  getTeamMembers,
  getTeamMember,
  updateTeamMember,
  removeTeamMember,
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { teamValidation } = require('../middleware/validationMiddleware');

router.use(protect); // All team routes require auth

router.route('/').get(getTeamMembers);
router.route('/:id').get(getTeamMember).put(authorize('Admin', 'Project Manager'), teamValidation, updateTeamMember).delete(authorize('Admin', 'Project Manager'), removeTeamMember);

module.exports = router;