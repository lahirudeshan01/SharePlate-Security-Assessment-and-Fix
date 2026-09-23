import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import userService from '../services/userService'
import { toast } from 'react-toastify'

const ROLES = ['donor', 'shelter', 'admin', 'manager']

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })

  // Edit dialog state
  const [editDialog, setEditDialog] = useState({ open: false, user: null })
  const [editActive, setEditActive] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 400)

    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const query = {
        page: page + 1,
        limit: rowsPerPage,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }
      const res =
        filterRole === 'all'
          ? await userService.getAllUsers(query)
          : await userService.getUsersByRole(filterRole, query)
      setUsers(res.data?.users || [])
      setTotalCount(res.pagination?.total ?? res.data?.count ?? 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [filterRole, page, rowsPerPage, debouncedSearch])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setPage(0)
  }, [debouncedSearch])

  const handleDeleteConfirm = async () => {
    try {
      await userService.deleteUser(deleteDialog.user._id)
      toast.success(`User "${deleteDialog.user.name}" deleted`)
      setDeleteDialog({ open: false, user: null })
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleEditSave = async () => {
    try {
      await userService.updateUser(editDialog.user._id, { isActive: editActive })
      toast.success('User updated successfully')
      setEditDialog({ open: false, user: null })
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
    }
  }

  const openEditDialog = (u) => {
    setEditDialog({ open: true, user: u })
    setEditActive(u.isActive)
  }

  const handleChangePage = (_, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const roleColor = { donor: 'warning', shelter: 'success', admin: 'info', manager: 'secondary' }

  return (
    <Box>
      <Box className="page-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Users Management
          </Typography>
          <Typography color="text.secondary">Manage all registered users</Typography>
        </Box>
        <Button variant="outlined" onClick={fetchUsers}>
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              size="small"
              label="Search by name or email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 280 } }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={filterRole}
                label="Filter by Role"
                onChange={(e) => {
                  setPage(0)
                  setFilterRole(e.target.value)
                }}
              >
                <MenuItem value="all">All Roles</MenuItem>
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <TableContainer>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u._id} hover>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role}
                          color={roleColor[u.role] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{u.organizationName || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.isActive ? 'Active' : 'Inactive'}
                          color={u.isActive ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditDialog(u)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialog({ open: true, user: u })}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        {!loading && (
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteDialog.user?.name}</strong>? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, user: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit User – {editDialog.user?.name}</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Account Status"
            fullWidth
            value={editActive}
            onChange={(e) => setEditActive(e.target.value === 'true')}
            sx={{ mt: 1 }}
          >
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, user: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
