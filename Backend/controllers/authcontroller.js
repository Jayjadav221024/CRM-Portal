const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success, error } = require('../utils/response');

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return error(res, 'Email already registered', 409);

    const user = await User.create({ name, email, password, role });
    const token = signToken(user._id, user.role);

    return success(res, { user, token }, {}, 201);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return error(res, messages.join(', '), 400);
    }
    return error(res, 'Registration failed', 500, err.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password required', 400);

    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return error(res, 'Invalid credentials', 401);
    }

    const token = signToken(user._id, user.role);
    const userObj = user.toJSON();

    return success(res, { user: userObj, token });
  } catch (err) {
    return error(res, 'Login failed', 500, err.message);
  }
};

exports.getMe = async (req, res) => {
  return success(res, req.user);
};