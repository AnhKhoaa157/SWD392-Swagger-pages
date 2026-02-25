/**
 * Class Controller
 * Handles CRUD operations for classes
 */

const { Class, Semester, User, ClassMember, Group, Milestone, Channel } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all classes
 * @route   GET /api/classes
 * @access  Public
 */
const getAllClasses = async (req, res) => {
    try {
        const { semesterId, lecturerId, status, search } = req.query;
        
        let whereClause = {};
        
        if (semesterId) whereClause.semesterId = semesterId;
        if (lecturerId) whereClause.lecturerId = lecturerId;
        if (status) whereClause.status = status;
        if (search) {
            whereClause[Op.or] = [
                { className: { [Op.like]: `%${search}%` } },
                { slackSpaceName: { [Op.like]: `%${search}%` } }
            ];
        }
        
        const classes = await Class.findAll({
            where: whereClause,
            include: [
                {
                    model: Semester,
                    as: 'semester',
                    attributes: ['semesterId', 'name', 'status']
                },
                {
                    model: User,
                    as: 'lecturer',
                    attributes: ['userId', 'fullName', 'email', 'avatarURL']
                },
                {
                    model: ClassMember,
                    as: 'members',
                    attributes: ['id', 'studentId', 'status', 'enrolledAt'],
                    include: [{
                        model: User,
                        as: 'student',
                        attributes: ['userId', 'fullName', 'email', 'avatarURL']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            count: classes.length,
            data: classes
        });
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching classes',
            error: error.message
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
                    model: Semester,
                    as: 'semester'
                },
                {
                    model: User,
                    as: 'lecturer',
                    attributes: ['userId', 'fullName', 'email', 'avatarURL', 'role']
                },
                {
                    model: ClassMember,
                    as: 'members',
                    include: [{
                        model: User,
                        as: 'student',
                        attributes: ['userId', 'fullName', 'email', 'avatarURL']
                    }]
                },
                {
                    model: Group,
                    as: 'groups',
                    attributes: ['groupId', 'groupName', 'status', 'maxMembers']
                },
                {
                    model: Milestone,
                    as: 'milestones',
                    attributes: ['milestoneId', 'name', 'deadline', 'weight', 'status']
                }
            ]
        });
        
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: classData
        });
    } catch (error) {
        console.error('Error fetching class:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching class',
            error: error.message
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
        const { semesterId, lecturerId, className, slackSpaceName, description } = req.body;
        
        if (!semesterId || !lecturerId || !className) {
            return res.status(400).json({
                success: false,
                message: 'Please provide semesterId, lecturerId, and className'
            });
        }
        
        // Verify semester exists
        const semester = await Semester.findByPk(semesterId);
        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }
        
        // Verify lecturer exists and is a lecturer
        const lecturer = await User.findByPk(lecturerId);
        if (!lecturer || lecturer.role !== 'Lecturer') {
            return res.status(404).json({
                success: false,
                message: 'Lecturer not found or invalid role'
            });
        }
        
        const newClass = await Class.create({
            semesterId,
            lecturerId,
            className,
            slackSpaceName,
            description,
            status: 'Active'
        });
        
        // Create a default public channel for the class
        await Channel.create({
            classId: newClass.classId,
            name: 'general',
            type: 'PUBLIC'
        });
        
        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            data: newClass
        });
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating class',
            error: error.message
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
        const updates = req.body;
        
        const classData = await Class.findByPk(id);
        
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        
        await classData.update(updates);
        
        res.status(200).json({
            success: true,
            message: 'Class updated successfully',
            data: classData
        });
    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating class',
            error: error.message
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
                message: 'Class not found'
            });
        }
        
        await classData.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Class deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting class',
            error: error.message
        });
    }
};

/**
 * @desc    Add student to class
 * @route   POST /api/classes/:id/members
 * @access  Lecturer/Admin
 */
const addClassMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body;
        
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }
        
        // Check if class exists
        const classData = await Class.findByPk(id);
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        
        // Check if student exists and is a student
        const student = await User.findByPk(studentId);
        if (!student || student.role !== 'Student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found or invalid role'
            });
        }
        
        // Check if already a member
        const existingMember = await ClassMember.findOne({
            where: { classId: id, studentId }
        });
        
        if (existingMember) {
            return res.status(409).json({
                success: false,
                message: 'Student is already a member of this class'
            });
        }
        
        const member = await ClassMember.create({
            classId: id,
            studentId,
            status: 'Active'
        });
        
        res.status(201).json({
            success: true,
            message: 'Student added to class successfully',
            data: member
        });
    } catch (error) {
        console.error('Error adding class member:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding class member',
            error: error.message
        });
    }
};

/**
 * @desc    Remove student from class
 * @route   DELETE /api/classes/:id/members/:memberId
 * @access  Lecturer/Admin
 */
const removeClassMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        
        const member = await ClassMember.findOne({
            where: { id: memberId, classId: id }
        });
        
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Class member not found'
            });
        }
        
        await member.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Student removed from class successfully'
        });
    } catch (error) {
        console.error('Error removing class member:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing class member',
            error: error.message
        });
    }
};

/**
 * @desc    Get class members
 * @route   GET /api/classes/:id/members
 * @access  Public
 */
const getClassMembers = async (req, res) => {
    try {
        const { id } = req.params;
        
        const members = await ClassMember.findAll({
            where: { classId: id },
            include: [{
                model: User,
                as: 'student',
                attributes: ['userId', 'fullName', 'email', 'avatarURL', 'isOnline', 'status']
            }],
            order: [['enrolledAt', 'ASC']]
        });
        
        res.status(200).json({
            success: true,
            count: members.length,
            data: members
        });
    } catch (error) {
        console.error('Error fetching class members:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching class members',
            error: error.message
        });
    }
};

module.exports = {
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
    addClassMember,
    removeClassMember,
    getClassMembers
};
