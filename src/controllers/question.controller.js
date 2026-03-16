/**
 * Question Controller
 * Handles Q&A questions with hierarchical escalation
 */

const { Op } = require('sequelize');
const { Question, User, StudentGroup, Answer, Class, GroupMember, Topic } = require('../models');
const MSG = require('../constants/messages');

const getRequesterId = (req) => req.user?.userId || req.user?.id;
const getRequesterRole = (req) => String(req.user?.role || '').toLowerCase();

/**
 * @desc    Get all questions (with filters)
 * @route   GET /api/questions
 * @access  Public
 */
exports.getAllQuestions = async (req, res) => {
    try {
        const { status, groupId, lecturerId } = req.query;
        const requesterId = getRequesterId(req);
        const requesterRole = getRequesterRole(req);

        const where = {};
        const classWhere = {};
        if (status) where.status = status;
        if (groupId) where.groupId = groupId;
        if (lecturerId) classWhere.lecturerId = lecturerId;
        if (requesterRole === 'lecturer' && !lecturerId) {
            classWhere.lecturerId = requesterId;
        }

        if (requesterRole === 'student' && !groupId) {
            const memberships = await GroupMember.findAll({
                where: { studentId: requesterId },
                attributes: ['groupId']
            });
            const groupIds = memberships.map((item) => item.groupId);
            where[Op.or] = [
                { askedBy: requesterId },
                { groupId: groupIds.length > 0 ? { [Op.in]: groupIds } : -1 }
            ];
        }

        const questions = await Question.findAll({
            where,
            include: [
                { model: User, as: 'asker', attributes: ['id', 'fullName', 'email', 'avatarURL'] },
                {
                    model: StudentGroup,
                    as: 'group',
                    attributes: ['id', 'groupName', 'classId'],
                    required: Object.keys(classWhere).length > 0,
                    include: [{
                        model: Class,
                        as: 'class',
                        attributes: ['id', 'className', 'lecturerId'],
                        where: Object.keys(classWhere).length > 0 ? classWhere : undefined,
                        required: Object.keys(classWhere).length > 0
                    }]
                },
                {
                    model: Answer, as: 'answers', include: [
                        { model: User, as: 'answerer', attributes: ['id', 'fullName', 'role', 'avatarURL'] }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            count: questions.length,
            data: questions
        });
    } catch (error) {
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
 * @desc    Get single question by ID
 * @route   GET /api/questions/:id
 * @access  Public
 */
exports.getQuestionById = async (req, res) => {
    try {
        const question = await Question.findByPk(req.params.id, {
            include: [
                { model: User, as: 'asker', attributes: ['id', 'fullName', 'email', 'avatarURL'] },
                { model: StudentGroup, as: 'group', attributes: ['id', 'groupName'] },
                {
                    model: Answer, as: 'answers', include: [
                        { model: User, as: 'answerer', attributes: ['id', 'fullName', 'role', 'avatarURL'] }
                    ]
                }
            ]
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Question not found'
            });
        }

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: question
        });
    } catch (error) {
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
 * @desc    Create new question
 * @route   POST /api/questions
 * @access  Private (Student)
 */
exports.createQuestion = async (req, res) => {
    try {
        const { title, content, groupId } = req.body;
        const askedBy = getRequesterId(req);

        const question = await Question.create({
            title,
            content,
            groupId,
            askedBy,
            status: 'WAITING_LECTURER'
        });

        res.status(201).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: question
        });
    } catch (error) {
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
 * @desc    Escalate question to Manager
 * @route   PUT /api/questions/:id/escalate
 * @access  Private (Lecturer)
 */
exports.escalateQuestion = async (req, res) => {
    try {
        const lecturerId = getRequesterId(req);
        const question = await Question.findByPk(req.params.id, {
            include: [{
                model: StudentGroup,
                as: 'group',
                include: [{
                    model: Class,
                    as: 'class',
                    attributes: ['lecturerId']
                }]
            }]
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Question not found'
            });
        }

        if (question.status === 'RESOLVED') {
            return res.status(400).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'Cannot escalate a resolved question'
            });
        }

        if (Number(question.group?.class?.lecturerId) !== Number(lecturerId)) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN,
                detail: 'You can only escalate questions from your classes'
            });
        }

        question.status = 'ESCALATED_TO_MANAGER';
        await question.save();

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: question
        });
    } catch (error) {
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
 * @desc    Ask AI for draft answer
 * @route   POST /api/questions/:id/ask-ai
 * @access  Private (Lecturer/Manager)
 */
exports.askAIForQuestion = async (req, res) => {
    try {
        const requesterRole = getRequesterRole(req);
        const requesterId = getRequesterId(req);
        const question = await Question.findByPk(req.params.id, {
            include: [{
                model: StudentGroup,
                as: 'group',
                include: [
                    { model: Class, as: 'class', attributes: ['lecturerId', 'className'] },
                    { model: Topic, as: 'topic', attributes: ['title', 'description', 'descriptionFile'] }
                ]
            }]
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Question not found'
            });
        }

        if (requesterRole === 'lecturer' && Number(question.group?.class?.lecturerId) !== Number(requesterId)) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN,
                detail: 'You can only ask AI for questions from your classes'
            });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'AI key is not configured on backend'
            });
        }

        const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

        const context = [
            `Class: ${question.group?.class?.className || 'N/A'}`,
            `Topic: ${question.group?.topic?.title || 'N/A'}`,
            `Topic Description: ${question.group?.topic?.description || 'N/A'}`,
            `Syllabus File URL: ${question.group?.topic?.descriptionFile || 'N/A'}`,
            `Question Title: ${question.title || 'N/A'}`,
            `Question Content: ${question.content || 'N/A'}`
        ].join('\n');

        const payload = {
            contents: [{
                role: 'user',
                parts: [{ text: `Bạn là trợ lý cho giảng viên đại học. Hãy tạo bản nháp câu trả lời ngắn gọn, đúng ngữ cảnh môn học, tiếng Việt lịch sự.\n\n${context}` }]
            }]
        };

        const response = await fetch(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                detail: `AI request failed: ${errorText}`
            });
        }

        const data = await response.json();
        const draft = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!draft) {
            return res.status(500).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                detail: 'AI returned empty draft'
            });
        }

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: { draft }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Mark question as resolved
 * @route   PUT /api/questions/:id/resolve
 * @access  Private (Lecturer/Manager)
 */
exports.resolveQuestion = async (req, res) => {
    try {
        const requesterRole = getRequesterRole(req);
        const requesterId = getRequesterId(req);
        const question = await Question.findByPk(req.params.id, {
            include: [{
                model: StudentGroup,
                as: 'group',
                include: [{
                    model: Class,
                    as: 'class',
                    attributes: ['lecturerId']
                }]
            }]
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Question not found'
            });
        }

        if (requesterRole === 'lecturer' && Number(question.group?.class?.lecturerId) !== Number(requesterId)) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN,
                detail: 'You can only resolve questions from your classes'
            });
        }

        question.status = 'RESOLVED';
        await question.save();

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: question
        });
    } catch (error) {
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
 * @desc    Delete question
 * @route   DELETE /api/questions/:id
 * @access  Private (Admin/Owner)
 */
exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByPk(req.params.id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Question not found'
            });
        }

        await question.destroy();

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
