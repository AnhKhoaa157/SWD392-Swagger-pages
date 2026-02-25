/**
 * Submission Controller
 * Handles CRUD operations for submissions
 */

const { Submission, Group, Milestone, User } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all submissions
 * @route   GET /api/submissions
 * @access  Public
 */
const getAllSubmissions = async (req, res) => {
    try {
        const { groupId, milestoneId, status, search } = req.query;
        
        let whereClause = {};
        
        if (groupId) whereClause.groupId = groupId;
        if (milestoneId) whereClause.milestoneId = milestoneId;
        if (status) whereClause.status = status;
        if (search) {
            whereClause[Op.or] = [
                { linkRepo: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }
        
        const submissions = await Submission.findAll({
            where: whereClause,
            include: [
                {
                    model: Group,
                    as: 'group',
                    attributes: ['groupId', 'groupName', 'classId']
                },
                {
                    model: Milestone,
                    as: 'milestone',
                    attributes: ['milestoneId', 'name', 'deadline', 'weight']
                },
                {
                    model: User,
                    as: 'grader',
                    attributes: ['userId', 'fullName', 'email']
                }
            ],
            order: [['submissionAt', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            count: submissions.length,
            data: submissions
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions',
            error: error.message
        });
    }
};

/**
 * @desc    Get submission by ID
 * @route   GET /api/submissions/:id
 * @access  Public
 */
const getSubmissionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const submission = await Submission.findByPk(id, {
            include: [
                {
                    model: Group,
                    as: 'group'
                },
                {
                    model: Milestone,
                    as: 'milestone'
                },
                {
                    model: User,
                    as: 'grader',
                    attributes: ['userId', 'fullName', 'email', 'role']
                }
            ]
        });
        
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submission',
            error: error.message
        });
    }
};

/**
 * @desc    Create new submission
 * @route   POST /api/submissions
 * @access  Student (Group Member)
 */
const createSubmission = async (req, res) => {
    try {
        const { groupId, milestoneId, linkRepo, description } = req.body;
        
        if (!groupId || !milestoneId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide groupId and milestoneId'
            });
        }
        
        // Verify group exists
        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        
        // Verify milestone exists
        const milestone = await Milestone.findByPk(milestoneId);
        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found'
            });
        }
        
        // Check if submission already exists
        const existingSubmission = await Submission.findOne({
            where: { groupId, milestoneId }
        });
        
        if (existingSubmission) {
            return res.status(409).json({
                success: false,
                message: 'Submission already exists for this milestone'
            });
        }
        
        // Check if past deadline
        const isLate = new Date() > new Date(milestone.deadline);
        
        const submission = await Submission.create({
            groupId,
            milestoneId,
            linkRepo,
            description,
            status: isLate ? 'Late' : 'Submitted',
            submissionAt: new Date()
        });
        
        res.status(201).json({
            success: true,
            message: 'Submission created successfully',
            data: submission
        });
    } catch (error) {
        console.error('Error creating submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating submission',
            error: error.message
        });
    }
};

/**
 * @desc    Update submission
 * @route   PUT /api/submissions/:id
 * @access  Student (Group Member)
 */
const updateSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const submission = await Submission.findByPk(id);
        
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }
        
        // Don't allow updates if already graded
        if (submission.status === 'Graded') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update graded submission'
            });
        }
        
        await submission.update(updates);
        
        res.status(200).json({
            success: true,
            message: 'Submission updated successfully',
            data: submission
        });
    } catch (error) {
        console.error('Error updating submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating submission',
            error: error.message
        });
    }
};

/**
 * @desc    Delete submission
 * @route   DELETE /api/submissions/:id
 * @access  Lecturer/Admin
 */
const deleteSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        
        const submission = await Submission.findByPk(id);
        
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }
        
        await submission.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Submission deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting submission',
            error: error.message
        });
    }
};

/**
 * @desc    Grade submission
 * @route   PUT /api/submissions/:id/grade
 * @access  Lecturer
 */
const gradeSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { grade, feedback, gradedBy } = req.body;
        
        if (grade === undefined || !gradedBy) {
            return res.status(400).json({
                success: false,
                message: 'Please provide grade and gradedBy'
            });
        }
        
        const submission = await Submission.findByPk(id);
        
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }
        
        submission.grade = grade;
        submission.feedback = feedback;
        submission.gradedBy = gradedBy;
        submission.gradedAt = new Date();
        submission.status = 'Graded';
        
        await submission.save();
        
        res.status(200).json({
            success: true,
            message: 'Submission graded successfully',
            data: submission
        });
    } catch (error) {
        console.error('Error grading submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error grading submission',
            error: error.message
        });
    }
};

module.exports = {
    getAllSubmissions,
    getSubmissionById,
    createSubmission,
    updateSubmission,
    deleteSubmission,
    gradeSubmission
};
