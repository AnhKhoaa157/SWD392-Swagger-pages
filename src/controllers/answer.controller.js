/**
 * Answer Controller
 * Handles answers to Q&A questions
 */

const { Answer, Question, User, GroupMember, StudentGroup, Class } = require('../models');
const MSG = require('../constants/messages');

const getRequesterId = (req) => req.user?.userId || req.user?.id;
const getRequesterRole = (req) => String(req.user?.role || '').toLowerCase();

/**
 * @desc    Get all answers for a question
 * @route   GET /api/questions/:questionId/answers
 * @access  Public
 */
exports.getAnswersByQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const userId = getRequesterId(req);
        const userRole = getRequesterRole(req);

        // Lấy thông tin câu hỏi để biết groupId và askedBy
        const question = await Question.findByPk(questionId);
        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        // Lấy tất cả answers của câu hỏi
        const answers = await Answer.findAll({
            where: { questionId },
            include: [
                { model: User, as: 'answerer', attributes: ['id', 'fullName', 'role'] }
            ],
            order: [['createdAt', 'ASC']]
        });

        // Lọc answers theo quyền truy cập
        const membership = question.groupId && userRole === 'student'
            ? await GroupMember.findOne({ where: { groupId: question.groupId, studentId: userId } })
            : null;

        const filteredAnswers = answers.filter(ans => {
            if (ans.isPublic) return true; // Public: ai cũng thấy
            // Private: chỉ thành viên nhóm, người hỏi, người trả lời, lecturer/manager
            if (!userId) return false;
            if (userId === question.askedBy) return true;
            if (userId === ans.answeredBy) return true;
            if (userRole === 'lecturer' || userRole === 'manager') return true;
            return Boolean(membership);
        });

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            count: filteredAnswers.length,
            data: filteredAnswers
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
 * @desc    Create answer to a question
 * @route   POST /api/questions/:questionId/answers
 * @access  Private (Lecturer/Manager)
 */
exports.createAnswer = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { content, isPublic = false } = req.body;
        const answeredBy = getRequesterId(req);
        const requesterRole = getRequesterRole(req);

        // Check if question exists
        const question = await Question.findByPk(questionId, {
            include: [{
                model: StudentGroup,
                as: 'group',
                include: [{ model: Class, as: 'class', attributes: ['lecturerId'] }]
            }]
        });
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        if (requesterRole === 'lecturer' && Number(question.group?.class?.lecturerId) !== Number(answeredBy)) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN,
                detail: 'You can only answer questions from your classes'
            });
        }

        const answer = await Answer.create({
            questionId,
            answeredBy,
            content,
            isPublic
        });

        // Optionally mark question as resolved
        if (req.body.markAsResolved) {
            question.status = 'RESOLVED';
            await question.save();
        }

        res.status(201).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: answer
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
 * @desc    Update answer
 * @route   PUT /api/answers/:id
 * @access  Private (Owner)
 */
exports.updateAnswer = async (req, res) => {
    try {
        const { content, isPublic } = req.body;
        const requesterId = getRequesterId(req);
        const requesterRole = getRequesterRole(req);

        const answer = await Answer.findByPk(req.params.id);

        if (!answer) {
            return res.status(404).json({
                success: false,
                message: 'Answer not found'
            });
        }

        if (requesterRole !== 'manager' && Number(answer.answeredBy) !== Number(requesterId)) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN
            });
        }

        if (content !== undefined) answer.content = content;
        if (isPublic !== undefined) answer.isPublic = isPublic;

        await answer.save();

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: answer
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
 * @desc    Toggle answer visibility (public/private)
 * @route   PUT /api/answers/:id/toggle-visibility
 * @access  Private (Owner/Admin)
 */
exports.toggleAnswerVisibility = async (req, res) => {
    try {
        const answer = await Answer.findByPk(req.params.id);
        const requesterId = getRequesterId(req);
        const requesterRole = getRequesterRole(req);

        if (!answer) {
            return res.status(404).json({
                success: false,
                message: 'Answer not found'
            });
        }

        if (requesterRole !== 'manager' && Number(answer.answeredBy) !== Number(requesterId)) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN
            });
        }

        answer.isPublic = !answer.isPublic;
        await answer.save();

        res.status(200).json({
            success: true,
            message: `Answer is now ${answer.isPublic ? 'public' : 'private'}`,
            data: answer
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
 * @desc    Delete answer
 * @route   DELETE /api/answers/:id
 * @access  Private (Owner/Admin)
 */
exports.deleteAnswer = async (req, res) => {
    try {
        const answer = await Answer.findByPk(req.params.id);
        const requesterId = getRequesterId(req);
        const requesterRole = getRequesterRole(req);

        if (!answer) {
            return res.status(404).json({
                success: false,
                message: 'Answer not found'
            });
        }

        if (requesterRole !== 'manager' && Number(answer.answeredBy) !== Number(requesterId)) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN
            });
        }

        await answer.destroy();

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS
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
 * @desc    Get all public answers
 * @route   GET /api/answers/public
 * @access  Public
 */
exports.getPublicAnswers = async (req, res) => {
    try {
        const answers = await Answer.findAll({
            where: { isPublic: true },
            include: [
                {
                    model: Question,
                    as: 'question',
                    attributes: ['id', 'title', 'content']
                },
                {
                    model: User,
                    as: 'answerer',
                    attributes: ['id', 'fullName', 'role']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: answers.length,
            data: answers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching public answers',
            error: error.message
        });
    }
};
