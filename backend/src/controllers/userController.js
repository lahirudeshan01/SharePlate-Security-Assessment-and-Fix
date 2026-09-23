const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSearchFilter = (search) => {
  if (!search || typeof search !== 'string') {
    return {};
  }

  const normalized = search.trim();
  if (!normalized) {
    return {};
  }

  const safeSearch = escapeRegex(normalized);
  return {
    $or: [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } }
    ]
  };
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = buildSearchFilter(req.query.search);

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password')
    ]);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        count: total,
        users
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const hasPreciseLocation = req.body.preciseLocation && typeof req.body.preciseLocation === 'object';

    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      organizationName: req.body.organizationName
    };

    if (hasPreciseLocation) {
      fieldsToUpdate.preciseLocation = {
        latitude: req.body.preciseLocation.latitude,
        longitude: req.body.preciseLocation.longitude,
        updatedAt: new Date()
      };
    }

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update user by ID (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const hasPreciseLocation = req.body.preciseLocation && typeof req.body.preciseLocation === 'object';

    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      isActive: req.body.isActive,
      isVerified: req.body.isVerified,
      phone: req.body.phone,
      address: req.body.address,
      organizationName: req.body.organizationName
    };

    if (hasPreciseLocation) {
      fieldsToUpdate.preciseLocation = {
        latitude: req.body.preciseLocation.latitude,
        longitude: req.body.preciseLocation.longitude,
        updatedAt: new Date()
      };
    }

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete own account
// @route   DELETE /api/users/profile
// @access  Private
exports.deleteOwnProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    await user.deleteOne();

    successResponse(res, {}, 'Account deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    await user.deleteOne();

    successResponse(res, {}, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private/Admin
exports.getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.params;
    const { page, limit, skip } = parsePagination(req.query);

    if (!['donor', 'shelter', 'admin', 'manager'].includes(role)) {
      return errorResponse(res, 'Invalid role', 400);
    }

    const searchFilter = buildSearchFilter(req.query.search);
    const filter = { role, ...searchFilter };

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password')
    ]);

    res.status(200).json({
      success: true,
      message: `${role} users retrieved successfully`,
      data: {
        count: total,
        users
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
