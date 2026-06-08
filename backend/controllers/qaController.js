const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User');

// ==========================================
// QUESTIONS HANDLERS
// ==========================================

// @desc    Get all questions for college
// @route   GET /api/qa/questions
// @access  Private
exports.getQuestions = async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    const questions = await Question.find({ college: collegeId })
      .populate('user', 'name email branch year role status')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single question details with answers
// @route   GET /api/qa/questions/:id
// @access  Private
exports.getQuestionDetails = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('user', 'name email branch year role status')
      .populate('comments.user', 'name email branch year role');

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question thread not found' });
    }

    if (question.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this college board' });
    }

    const answers = await Answer.find({ question: question._id })
      .populate('user', 'name email branch year role status')
      .sort({ upvotes: -1, createdAt: 1 });

    res.status(200).json({ success: true, data: { question, answers } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Ask a new question
// @route   POST /api/qa/questions
// @access  Private
exports.askQuestion = async (req, res) => {
  const { title, content } = req.body;

  try {
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please provide a title and content' });
    }

    const collegeId = req.user.college._id;

    const question = await Question.create({
      title,
      content,
      user: req.user._id,
      college: collegeId
    });

    // Award badge "Inquisitive" to student on their first question asked
    const author = await User.findById(req.user._id);
    const questionCount = await Question.countDocuments({ user: req.user._id });
    if (questionCount === 1 && author && !author.badges.includes('Inquisitive')) {
      author.badges.push('Inquisitive');
      await author.save();
    }

    const populated = await Question.findById(question._id).populate('user', 'name email branch year');

    res.status(201).json({ success: true, message: 'Question posted successfully', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote / Un-upvote a question
// @route   POST /api/qa/questions/:id/upvote
// @access  Private
exports.upvoteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const hasUpvoted = question.upvotes.includes(req.user._id);

    if (hasUpvoted) {
      question.upvotes = question.upvotes.filter(uid => uid.toString() !== req.user._id.toString());
    } else {
      question.upvotes.push(req.user._id);
    }

    await question.save();

    res.status(200).json({
      success: true,
      upvoted: !hasUpvoted,
      upvotesCount: question.upvotes.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to question
// @route   POST /api/qa/questions/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  const { content } = req.body;

  try {
    if (!content) {
      return res.status(400).json({ success: false, message: 'Please enter your comment content' });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const newComment = {
      user: req.user._id,
      userName: req.user.name,
      content,
      createdAt: new Date()
    };

    question.comments.push(newComment);
    await question.save();

    // Re-fetch question populated
    const updatedQuestion = await Question.findById(question._id)
      .populate('user', 'name email branch year role')
      .populate('comments.user', 'name email branch year role');

    res.status(200).json({ success: true, message: 'Comment added successfully', data: updatedQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a question
// @route   DELETE /api/qa/questions/:id
// @access  Private
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Authorization: User must be author OR College Admin / Super Admin
    const isAuthor = question.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin' && question.college.toString() === req.user.college._id.toString();
    const isSuperAdmin = req.user.role === 'SuperAdmin';

    if (!isAuthor && !isAdmin && !isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this question' });
    }

    await Question.findByIdAndDelete(req.params.id);
    // Delete answers associated with this question
    await Answer.deleteMany({ question: req.params.id });

    res.status(200).json({ success: true, message: 'Question thread deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ANSWERS HANDLERS
// ==========================================

// @desc    Answer a question
// @route   POST /api/qa/questions/:id/answers
// @access  Private
exports.answerQuestion = async (req, res) => {
  const { content } = req.body;

  try {
    if (!content) {
      return res.status(400).json({ success: false, message: 'Answer content cannot be empty' });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question thread not found' });
    }

    const answer = await Answer.create({
      question: question._id,
      content,
      user: req.user._id
    });

    // Update answer count on question
    question.answersCount += 1;
    await question.save();

    // Award badge "Helper" to student on their first answer posted
    const author = await User.findById(req.user._id);
    const answerCount = await Answer.countDocuments({ user: req.user._id });
    if (answerCount === 1 && author && !author.badges.includes('Helper')) {
      author.badges.push('Helper');
      await author.save();
    }

    const populatedAnswer = await Answer.findById(answer._id).populate('user', 'name email branch year role status');

    res.status(201).json({ success: true, message: 'Answer posted successfully', data: populatedAnswer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote / Un-upvote an answer
// @route   POST /api/qa/answers/:id/upvote
// @access  Private
exports.upvoteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ success: false, message: 'Answer not found' });
    }

    const hasUpvoted = answer.upvotes.includes(req.user._id);

    if (hasUpvoted) {
      answer.upvotes = answer.upvotes.filter(uid => uid.toString() !== req.user._id.toString());
    } else {
      answer.upvotes.push(req.user._id);
    }

    await answer.save();

    res.status(200).json({
      success: true,
      upvoted: !hasUpvoted,
      upvotesCount: answer.upvotes.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an answer
// @route   DELETE /api/qa/answers/:id
// @access  Private
exports.deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate('question');
    if (!answer) {
      return res.status(404).json({ success: false, message: 'Answer not found' });
    }

    const isAuthor = answer.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin' && answer.question.college.toString() === req.user.college._id.toString();
    const isSuperAdmin = req.user.role === 'SuperAdmin';

    if (!isAuthor && !isAdmin && !isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Answer.findByIdAndDelete(req.params.id);

    // Decrement answer count
    if (answer.question) {
      await Question.findByIdAndUpdate(answer.question._id, { $inc: { answersCount: -1 } });
    }

    res.status(200).json({ success: true, message: 'Answer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// MODERATION TOOLS
// ==========================================

// @desc    Ban User account (Admin only)
// @route   PUT /api/qa/users/:id/ban
// @access  Private (Admin)
exports.banUser = async (req, res) => {
  const { action } = req.body; // "ban" or "unban"

  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify Admin belongs to the same college as target student, unless they are SuperAdmin
    if (req.user.role !== 'SuperAdmin') {
      if (targetUser.college.toString() !== req.user.college._id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only moderate students in your own college' });
      }
      if (targetUser.role === 'Admin' || targetUser.role === 'SuperAdmin') {
        return res.status(403).json({ success: false, message: 'You cannot ban other administrators' });
      }
    }

    targetUser.status = action === 'ban' ? 'Banned' : 'Active';
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User account has been successfully ${action === 'ban' ? 'banned' : 'unbanned'}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students in admin's college (For moderation list)
// @route   GET /api/qa/users
// @access  Private (Admin)
exports.getCollegeStudents = async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    const students = await User.find({ college: collegeId, role: 'Student' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
