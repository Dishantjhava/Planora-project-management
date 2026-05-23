const Project = require('../models/Project');

// @desc    Get all projects (where user is owner or member)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const filter = {
      $and: [
        { $or: [{ owner: req.user._id }, { members: req.user._id }] }
      ]
    };

    if (req.query.search) {
      filter.$and.push({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    if (req.query.status && req.query.status !== 'all') {
      const statusStr = req.query.status.replace(/-/g, ' ');
      filter.$and.push({ status: { $regex: new RegExp('^' + statusStr + '$', 'i') } });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Project.countDocuments(filter);

    const projects = await Project.find(filter)
      .populate('owner', 'name email role')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({
      success: true,
      count: projects.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      projects,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description, status, priority, dueDate, members } = req.body;

    const project = await Project.create({
      name,
      description,
      status,
      priority,
      dueDate,
      members: members || [],
      owner: req.user._id,
    });

    await project.populate('owner', 'name email role');
    await project.populate('members', 'name email role');

    res.status(201).json({ success: true, project });
  } catch (err) {
    console.error('CREATE PROJECT ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Only owner can update
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('owner', 'name email role')
      .populate('members', 'name email role');

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    await project.deleteOne();
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };