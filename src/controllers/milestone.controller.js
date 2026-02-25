/**
 * Milestone Controller
 * Handles CRUD operations for milestones
 */

const { Milestone, Class, Submission } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all milestones
 * @route   GET /api/milestones
 * @access  Public
 */
const getAllMilestones = async (req, res) => {
    try {
        const { classId, status, search } = req.query;
        
        let whereClause = {};
        
        if (classId) whereClause.classId = classId;
        if (status) whereClause.status = status;
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }
        
        const milestones = await Milestone.findAll({
            where: whereClause,
            include: [
                {
                    model: Class,
                    as: 'class',
                    attributes: ['classId', 'className', 'status']
                },
                {
                    model: Submission,
                    as: 'submissions',
                    attributes: ['submissionId', 'groupId', 'grade', 'status']
                }
            ],
            order: [['deadline', 'ASC']]
        });
        
        res.status(200).json({
            success: true,
            count: milestones.length,
            data: milestones
        });
    } catch (error) {
        console.error('Error fetching milestones:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching milestones',
            error: error.message
        });
    }
};

/**
 * @desc    Get milestone by ID
 * @route   GET /api/milestones/:id
 * @access  Public
 */
const getMilestoneById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const milestone = await Milestone.findByPk(id, {
            include: [
                {
                    model: Class,
                    as: 'class'
                },
                {
                    model: Submission,
                    as: 'submissions',
                    attributes: ['submissionId', 'groupId', 'linkRepo', 'grade', 'status', 'submissionAt']
                }
            ]
        });
        
        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: milestone
        });
    } catch (error) {
        console.error('Error fetching milestone:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching milestone',
            error: error.message
        });
    }
};

/**
 * @desc    Create new milestone
 * @route   POST /api/milestones
 * @access  Lecturer/Admin
 */
const createMilestone = async (req, res) => {
    try {
        const { classId, name, description, deadline, weight } = req.body;
        
        if (!classId || !name || !deadline) {
            return res.status(400).json({
                success: false,
                message: 'Please provide classId, name, and deadline'
            });
        }
        
        // Verify class exists
        const classData = await Class.findByPk(classId);
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        
        const milestone = await Milestone.create({
            classId,
            name,
            description,
            deadline,
            weight: weight || 10.0,
            status: 'Upcoming'
        });
        
        res.status(201).json({
            success: true,
            message: 'Milestone created successfully',
            data: milestone
        });
    } catch (error) {
        console.error('Error creating milestone:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating milestone',
            error: error.message
        });
    }
};

/**
 * @desc    Update milestone
 * @route   PUT /api/milestones/:id
 * @access  Lecturer/Admin
 */
const updateMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const milestone = await Milestone.findByPk(id);
        
        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found'
            });
        }
        
        await milestone.update(updates);
        
        res.status(200).json({
            success: true,
            message: 'Milestone updated successfully',
            data: milestone
        });
    } catch (error) {
        console.error('Error updating milestone:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating milestone',
            error: error.message
        });
    }
};

/**
 * @desc    Delete milestone
 * @route   DELETE /api/milestones/:id
 * @access  Lecturer/Admin
 */
const deleteMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        
        const milestone = await Milestone.findByPk(id);
        
        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found'
            });
        }
        
        await milestone.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Milestone deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting milestone:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting milestone',
            error: error.message
        });
    }
};

module.exports = {
    getAllMilestones,
    getMilestoneById,
    createMilestone,
    updateMilestone,
    deleteMilestone
};
