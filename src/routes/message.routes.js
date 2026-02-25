/**
 * Message Routes
 */

const express = require('express');
const router = express.Router();
const {
    getAllMessages,
    getMessageById,
    createMessage,
    updateMessage,
    deleteMessage,
    addReaction,
    removeReaction
} = require('../controllers/message.controller');

router.route('/').get(getAllMessages).post(createMessage);
router.route('/:id').get(getMessageById).put(updateMessage).delete(deleteMessage);
router.post('/:id/reactions', addReaction);
router.delete('/:id/reactions/:reactionId', removeReaction);

module.exports = router;
