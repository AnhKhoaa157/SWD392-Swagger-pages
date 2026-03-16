/**
 * Class Controller
 * Handles CRUD operations for classes
 */

const { Class, User, StudentGroup } = require('../models');
const { Op } = require('sequelize');
const MSG = require('../constants/messages');

/**
 * @desc    Get all classes
 * @route   GET /api/classes
 * @access  Public
 */
const getAllClasses = async (req, res) => {
    try {
        const { lecturerId, search } = req.query;

        let whereClause = {};

        if (lecturerId) whereClause.lecturerId = lecturerId;
        if (search) {
            whereClause.className = { [Op.like]: `%${search}%` };
        }

        const classes = await Class.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'lecturer',
                    attributes: ['id', 'fullName', 'email', 'role']
                },
                {
                    model: StudentGroup,
                    as: 'groups',
                    attributes: ['id', 'groupName']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            count: classes.length,
            data: classes
        });
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * @desc    Get class by ID
 * @route   GET /api/classes/:id
 * @access  Public
 */
const getClassById = async (req, res) => {
    try {
        const { id } = req.params;

        const classData = await Class.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'lecturer',
                    attributes: ['id', 'fullName', 'email', 'role']
                },
                {
                    model: StudentGroup,
                    as: 'groups',
                    attributes: ['id', 'groupName', 'topicId']
                }
            ]
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Class not found'
            });
        }

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: classData
        });
    } catch (error) {
        console.error('Error fetching class:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * @desc    Create new class
 * @route   POST /api/classes
 * @access  Lecturer/Admin
 */
const createClass = async (req, res) => {
    try {
        const { lecturerId, className } = req.body;

        if (!lecturerId || !className) {
            return res.status(400).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'Missing lecturerId or className'
            });
        }

        // Verify lecturer exists and is a lecturer
        const lecturer = await User.findByPk(lecturerId);
        if (!lecturer || lecturer.role !== 'lecturer') {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Lecturer not found or invalid role'
            });
        }

        const newClass = await Class.create({
            lecturerId,
            className
        });

        res.status(201).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: newClass
        });
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * @desc    Update class
 * @route   PUT /api/classes/:id
 * @access  Lecturer/Admin
 */
const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { className, lecturerId } = req.body;

        const classData = await Class.findByPk(id);

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Class not found'
            });
        }

        if (className) classData.className = className;
        if (lecturerId) classData.lecturerId = lecturerId;

        await classData.save();

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: classData
        });
    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * @desc    Delete class
 * @route   DELETE /api/classes/:id
 * @access  Admin
 */
const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;

        const classData = await Class.findByPk(id);

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Class not found'
            });
        }

        await classData.destroy();

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS
        });
    } catch (error) {
        console.error('Error deleting class:', error);
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
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
};
