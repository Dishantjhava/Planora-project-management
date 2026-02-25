const express = require('express');
const router = express.Router();
const {
  getTeamMembers,
  getTeamMember,
  updateTeamMember,
  removeTeamMember,
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All team routes require auth

router.route('/').get(getTeamMembers);
router.route('/:id').get(getTeamMember).put(updateTeamMember).delete(removeTeamMember);

module.exports = router;