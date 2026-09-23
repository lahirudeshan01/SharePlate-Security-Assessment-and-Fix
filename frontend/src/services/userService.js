import api from './api'

const userService = {
  /**
   * Update the authenticated user's own profile
  * @param {Object} data - { name, phone, organizationName, address, preciseLocation }
   */
  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data)
    return response.data
  },

  /**
   * Get all users (Admin only)
   */
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params })
    return response.data
  },

  /**
   * Get a single user by ID (Admin only)
   * @param {string} id
   */
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  /**
   * Update any user (Admin only)
   * @param {string} id
   * @param {Object} data
   */
  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },

  /**
   * Delete a user (Admin only)
   * @param {string} id
   */
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  /**
   * Get users filtered by role (Admin only)
   * @param {string} role - 'restaurant' | 'shelter' | 'admin'
   */
  getUsersByRole: async (role, params = {}) => {
    const response = await api.get(`/users/role/${role}`, { params })
    return response.data
  },

  deleteAccount: async () => {
    const response = await api.delete('/users/profile')
    return response.data
  },
}

export default userService
