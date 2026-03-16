/**
 * Task Controller
 * Handles CRUD operations for task board items
 */

const { Task, StudentGroup, User, GroupMember, Class } = require('../models');
const { Op } = require('sequelize');
const MSG = require('../constants/messages');

const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.filter(Boolean).map((tag) => String(tag).trim()).filter(Boolean);
    if (typeof tags === 'string') {
        try {
            const parsed = JSON.parse(tags);
            if (Array.isArray(parsed)) {
                return parsed.filter(Boolean).map((tag) => String(tag).trim()).filter(Boolean);
            }
        } catch (_) {
            return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
        }
    }
    return [];
};

const normalizePriority = (priority = 'MEDIUM') => {
    const value = String(priority || '').toUpperCase();
    return ['LOW', 'MEDIUM', 'HIGH'].includes(value) ? value : 'MEDIUM';
};

const normalizeStatus = (status = 'TODO') => {
    const value = String(status || '').toUpperCase();
    return ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].includes(value) ? value : 'TODO';
};

const formatTask = (task) => {
    const plain = task.toJSON ? task.toJSON() : task;
    return {
        ...plain,
        tags: parseTags(plain.tags)
    };
};

const includeConfig = [
    {
        model: StudentGroup,
        as: 'group',
        attributes: ['id', 'groupName']
    },
    {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'email', 'avatarURL']
    },
    {
        model: User,
        as: 'assignee',
        attributes: ['id', 'fullName', 'email', 'avatarURL']
    }
];

const getRequesterId = (req) => req.user?.userId || req.user?.id;
const getRequesterRole = (req) => String(req.user?.role || '').toLowerCase();

const getStudentGroupIds = async (studentId) => {
    const memberships = await GroupMember.findAll({
        where: { studentId },
        attributes: ['groupId']
    });
    return memberships.map((item) => item.groupId);
};

const getAllTasks = async (req, res) => {
    try {
        const { groupId, status, priority, assigneeId, search } = req.query;
        const requesterId = getRequesterId(req);
        const requesterRole = getRequesterRole(req);
        const whereClause = {};

        if (groupId) whereClause.groupId = groupId;
        if (status) whereClause.status = normalizeStatus(status);
        if (priority) whereClause.priority = normalizePriority(priority);
        if (assigneeId) whereClause.assigneeId = assigneeId;
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const include = includeConfig.map((item) => ({ ...item }));

        if (requesterRole === 'student') {
            const groupIds = await getStudentGroupIds(requesterId);
            if (groupId) {
                if (!groupIds.includes(Number(groupId))) {
                    return res.status(403).json({
                        success: false,
                        message: MSG.AUTHORIZATION.FORBIDDEN,
                        detail: 'You can only view tasks of groups you belong to'
                    });
                }
            } else {
                whereClause.groupId = groupIds.length > 0 ? { [Op.in]: groupIds } : -1;
            }
        }

        if (requesterRole === 'lecturer') {
            include[0] = {
                ...include[0],
                required: true,
                include: [{
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'className', 'lecturerId'],
                    where: { lecturerId: requesterId },
                    required: true
                }]
            };
        }

        const tasks = await Task.findAll({
            where: whereClause,
            include,
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            count: tasks.length,
            data: tasks.map(formatTask)
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findByPk(id, { include: includeConfig });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Task not found'
            });
        }

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: formatTask(task)
        });
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const createTask = async (req, res) => {
    try {
        const { groupId, assigneeId, title, description, priority, status, tags, dueDate } = req.body;
        const createdBy = getRequesterId(req);

        if (!groupId || !title) {
            return res.status(400).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'Missing groupId or title'
            });
        }

        const group = await StudentGroup.findByPk(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Group not found'
            });
        }

        const isMember = await GroupMember.findOne({ where: { groupId: group.id, studentId: createdBy } });
        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN,
                detail: 'Only group members can create tasks for this group'
            });
        }

        const task = await Task.create({
            groupId,
            createdBy,
            assigneeId: assigneeId || null,
            title: String(title).trim(),
            description: description || null,
            priority: normalizePriority(priority),
            status: normalizeStatus(status),
            tags: JSON.stringify(parseTags(tags)),
            dueDate: dueDate || null
        });

        const created = await Task.findByPk(task.id, { include: includeConfig });

        res.status(201).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: formatTask(created)
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { assigneeId, title, description, priority, status, tags, dueDate } = req.body;
        const requesterId = getRequesterId(req);

        const task = await Task.findByPk(id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Task not found'
            });
        }

        const isMember = await GroupMember.findOne({ where: { groupId: task.groupId, studentId: requesterId } });
        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN,
                detail: 'Only group members can update tasks'
            });
        }

        if (assigneeId !== undefined) task.assigneeId = assigneeId || null;
        if (title !== undefined) task.title = String(title).trim();
        if (description !== undefined) task.description = description || null;
        if (priority !== undefined) task.priority = normalizePriority(priority);
        if (status !== undefined) task.status = normalizeStatus(status);
        if (tags !== undefined) task.tags = JSON.stringify(parseTags(tags));
        if (dueDate !== undefined) task.dueDate = dueDate || null;

        await task.save();

        const updated = await Task.findByPk(id, { include: includeConfig });

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: formatTask(updated)
        });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = getRequesterId(req);

        const task = await Task.findByPk(id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Task not found'
            });
        }

        const isMember = await GroupMember.findOne({ where: { groupId: task.groupId, studentId: requesterId } });
        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN,
                detail: 'Only group members can delete tasks'
            });
        }

        await task.destroy();

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};
