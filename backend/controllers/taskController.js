const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const socket = require('../socket');
const { createNotification } = require('./notificationController');

// @desc    Get all tasks (optionally filter by project)
// @route   GET /api/tasks?project=projectId
// @access  Private
const getTasks = async (req, res) => {
  try {
    const filter = { createdBy: req.user._id };
    if (req.query.project) filter.project = req.query.project;
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignee) filter.assignedTo = req.query.assignee;

    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Task.countDocuments(filter);

    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({
      success: true,
      count: tasks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      tasks,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, project, assignedTo } = req.body;

    if (!project) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
    });

    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email role');
    await task.populate('createdBy', 'name email');

    // Emit event
    // Create notification if assigned
    if (assignedTo) {
      try {
        await createNotification({
          userId: assignedTo,
          type: 'task_created',
          title: 'New Task Assigned',
          message: `You have been assigned to the task: "${task.title}"`,
          actionUrl: '/dashboard',
          triggeredBy: req.user._id
        });
      } catch (e) {
        console.error('Failed to dispatch task assignment notification:', e.message);
      }
    }

    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('project', 'name')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    // Dispatch task completion or task update notifications
    try {
      const isCompleted = req.body.status?.toLowerCase() === 'completed' || req.body.status?.toLowerCase() === 'done';
      const wasCompleted = task.status?.toLowerCase() === 'completed' || task.status?.toLowerCase() === 'done';

      if (isCompleted && !wasCompleted) {
        // Notify task creator if not the one who completed it
        if (task.createdBy.toString() !== req.user._id.toString()) {
          await createNotification({
            userId: task.createdBy,
            type: 'task_completed',
            title: 'Task Completed',
            message: `Task "${task.title}" was completed by ${req.user.name}`,
            actionUrl: '/dashboard',
            triggeredBy: req.user._id
          });
        }
        // Notify assignee if not the one who completed it and not the creator
        if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString() && task.assignedTo.toString() !== task.createdBy.toString()) {
          await createNotification({
            userId: task.assignedTo,
            type: 'task_completed',
            title: 'Task Completed',
            message: `Task "${task.title}" was completed by ${req.user.name}`,
            actionUrl: '/dashboard',
            triggeredBy: req.user._id
          });
        }
      } else {
        // Notify assignee of task update
        if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
          await createNotification({
            userId: task.assignedTo,
            type: 'task_updated',
            title: 'Task Updated',
            message: `Task "${task.title}" was updated by ${req.user.name}`,
            actionUrl: '/dashboard',
            triggeredBy: req.user._id
          });
        }
      }
    } catch (e) {
      console.error('Failed to dispatch task update/completion notifications:', e.message);
    }

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();

    // Notify assignee of task deletion
    try {
      if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
        await createNotification({
          userId: task.assignedTo,
          type: 'task_deleted',
          title: 'Task Deleted',
          message: `Task "${task.title}" was deleted by ${req.user.name}`,
          actionUrl: '/dashboard',
          triggeredBy: req.user._id
        });
      }
    } catch (e) {
      console.error('Failed to dispatch task deletion notifications:', e.message);
    }

    // Emit event
    try {
      socket.getIO().emit('task_deleted', req.params.id);
    } catch (e) {
      console.error('Socket emission failed', e);
    }

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };