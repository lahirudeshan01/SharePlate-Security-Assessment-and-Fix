const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser,
  deleteOwnProfile,
  getUsersByRole
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateUpdateProfile } = require('../validators/userValidator');

const router = express.Router();

// All routes below require authentication
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// JSDoc below documents each route for OpenAPI / Swagger UI.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update the authenticated user's own profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           example:
 *             name: Jane Doe
 *             phone: "0779876543"
 *             organizationName: Updated Org Name
 *             address:
 *               street: 456 Second Ave
 *               city: Los Angeles
 *               state: CA
 *               zipCode: "90001"
 *               country: USA
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/profile', validateUpdateProfile, updateProfile);
router.delete('/profile', deleteOwnProfile);

router.get('/', authorizeRoles('admin'), getAllUsers);
router.get('/role/:role', authorizeRoles('admin'), getUsersByRole);
router.get('/:id', authorizeRoles('admin'), getUserById);
router.put('/:id', authorizeRoles('admin'), updateUser);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

module.exports = router;
