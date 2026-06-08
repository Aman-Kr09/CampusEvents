const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getQuestionDetails,
  askQuestion,
  upvoteQuestion,
  addComment,
  deleteQuestion,
  answerQuestion,
  upvoteAnswer,
  deleteAnswer,
  banUser,
  getCollegeStudents
} = require('../controllers/qaController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Q&A student interactive routes
router.get('/questions', getQuestions);
router.get('/questions/:id', getQuestionDetails);
router.post('/questions', askQuestion);
router.post('/questions/:id/upvote', upvoteQuestion);
router.post('/questions/:id/comments', addComment);
router.delete('/questions/:id', deleteQuestion);

router.post('/questions/:id/answers', answerQuestion);
router.post('/answers/:id/upvote', upvoteAnswer);
router.delete('/answers/:id', deleteAnswer);

// College Admin Moderation routes
router.get('/users', authorize('Admin'), getCollegeStudents);
router.put('/users/:id/ban', authorize('Admin'), banUser);

module.exports = router;
