/**
 * Semester Controller
 * Handles CRUD operations for semesters
 */

const { Semester, Class } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all semesters
 * @route   GET /api/semesters
 * @access  Public
 */
const getAllSemesters = async (req, res) => {
    try {
        const { status, search } = req.query;
        
        let whereClause = {};
        
        // Filter by status if provided
        if (status) {
            whereClause.status = status;
        }
        
        // Search by name if provided
        if (search) {
            whereClause.name = { [Op.like]: `%${search}%` };
        }
        
        const semesters = await Semester.findAll({
            where: whereClause,
            order: [['startDate', 'DESC']],
            include: [{
                model: Class,
                as: 'classes',
                attributes: ['classId', 'className', 'status']
            }]
        });
        
        res.status(200).json({
            success: true,
            count: semesters.length,
            data: semesters
        });
    } catch (error) {
        console.error('Error fetching semesters:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching semesters',
            error: error.message
        });
    }
};

/**
 * @desc    Get semester by ID
 * @route   GET /api/semesters/:id
 * @access  Public
 */
const getSemesterById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const semester = await Semester.findByPk(id, {
            include: [{
                model: Class,
                as: 'classes',
                attributes: ['classId', 'className', 'status', 'description']
            }]
        });
        
        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: semester
        });
    } catch (error) {
        console.error('Error fetching semester:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching semester',
            error: error.message
        });
    }
};

/**
 * @desc    Create new semester
 * @route   POST /api/semesters
 * @access  Admin only
 */
const createSemester = async (req, res) => {
    try {
        const { name, startDate, endDate, status } = req.body;
        
        // Validate required fields
        if (!name || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, startDate, and endDate'
            });
        }
        
        // Validate dates
        if (new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }
        
        // Check if semester with same name already exists
        const existingSemester = await Semester.findOne({ where: { name } });
        if (existingSemester) {
            return res.status(409).json({
                success: false,
                message: 'Semester with this name already exists'
            });
        }
        
        const semester = await Semester.create({
            name,
            startDate,
            endDate,
            status: status || 'Upcoming'
        });
        
        res.status(201).json({
            success: true,
            message: 'Semester created successfully',
            data: semester
        });
    } catch (error) {
        console.error('Error creating semester:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating semester',
            error: error.message
        });
    }
};

/**
 * @desc    Update semester
 * @route   PUT /api/semesters/:id
 * @access  Admin only
 */
const updateSemester = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, startDate, endDate, status } = req.body;
        
        const semester = await Semester.findByPk(id);
        
        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }
        
        // Validate dates if both are provided
        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }
        
        // Check if new name conflicts with existing semester
        if (name && name !== semester.name) {
            const existingSemester = await Semester.findOne({ where: { name } });
            if (existingSemester) {
                return res.status(409).json({
                    success: false,
                    message: 'Semester with this name already exists'
                });
            }
        }
        
        // Update fields
        if (name) semester.name = name;
        if (startDate) semester.startDate = startDate;
        if (endDate) semester.endDate = endDate;
        if (status) semester.status = status;
        
        await semester.save();
        
        res.status(200).json({
            success: true,
            message: 'Semester updated successfully',
            data: semester
        });
    } catch (error) {
        console.error('Error updating semester:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating semester',
            error: error.message
        });
    }
};

/**
 * @desc    Delete semester
 * @route   DELETE /api/semesters/:id
 * @access  Admin only
 */
const deleteSemester = async (req, res) => {
    try {
        const { id } = req.params;
        
        const semester = await Semester.findByPk(id);
        
        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }
        
        await semester.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Semester deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting semester:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting semester',
            error: error.message
        });
    }
};

/**
 * @desc    Get active semester
 * @route   GET /api/semesters/active
 * @access  Public
 */
const getActiveSemester = async (req, res) => {
    try {
        const semester = await Semester.findOne({
            where: { status: 'Active' },
            include: [{
                model: Class,
                as: 'classes',
                attributes: ['classId', 'className', 'status']
            }]
        });
        
        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'No active semester found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: semester
        });
    } catch (error) {
        console.error('Error fetching active semester:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active semester',
            error: error.message
        });
    }
};

module.exports = {
    getAllSemesters,
    getSemesterById,
    createSemester,
    updateSemester,
    deleteSemester,
    getActiveSemester
};
