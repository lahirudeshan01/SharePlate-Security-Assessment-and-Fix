import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TablePagination,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useAuth } from '../context/AuthContext'
import donationService from '../services/donationService'
import { toast } from 'react-toastify'

const statusColors = {
  available: 'success',
  reserved: 'warning',
  collected: 'info',
  expired: 'error',
}

export default function DonationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(9)
  const [totalCount, setTotalCount] = useState(0)

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      }
      if (search.trim()) params.search = search.trim()
      if (statusFilter) params.status = statusFilter

      let res
      // Donors see only their own donations; shelters see all
      if (user?.role === 'donor' || user?.role === 'restaurant') {
        res = await donationService.getMyDonations()
        // client-side filter + paginate for my-donations
        let data = res.donations || []
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          data = data.filter((d) => d.foodName.toLowerCase().includes(q))
        }
        if (statusFilter) {
          data = data.filter((d) => d.status === statusFilter)
        }
        setTotalCount(data.length)
        setDonations(data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage))
      } else {
        res = await donationService.getAll(params)
        setDonations(res.donations || [])
        setTotalCount(res.total ?? res.count ?? (res.donations || []).length)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load donations')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, user?.role, page, rowsPerPage])

  useEffect(() => {
    fetchDonations()
  }, [fetchDonations])

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0)
  }, [search, statusFilter])

  const handleReserve = async (id) => {
    try {
      await donationService.reserve(id)
      toast.success('Donation reserved!')
      fetchDonations()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reserve')
    }
  }

  const handleCollect = async (id) => {
    try {
      await donationService.markCollected(id)
      toast.success('Marked as collected!')
      fetchDonations()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to collect')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this donation?')) return
    try {
      await donationService.delete(id)
      toast.success('Donation deleted')
      fetchDonations()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  const isExpired = (d) => new Date(d.expiryDate) < new Date()

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700}>
          {(user?.role === 'donor' || user?.role === 'restaurant') ? 'My Donations' : 'Available Donations'}
        </Typography>
        {(user?.role === 'donor' || user?.role === 'restaurant') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/create-donation"
          >
            New Donation
          </Button>
        )}
      </Box>

      {/* Search & Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by food name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="available">Available</MenuItem>
          <MenuItem value="reserved">Reserved</MenuItem>
          <MenuItem value="collected">Collected</MenuItem>
          <MenuItem value="expired">Expired</MenuItem>
        </TextField>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : donations.length === 0 ? (
        <Alert severity="info">
          {search || statusFilter
            ? 'No donations match your filters.'
            : (user?.role === 'donor' || user?.role === 'restaurant')
              ? 'You have not created any donations yet.'
              : 'No donations available at the moment.'}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {donations.map((donation) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={donation._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 6 },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" fontWeight={600} noWrap sx={{ maxWidth: '70%' }}>
                      {donation.foodName}
                    </Typography>
                    <Chip
                      label={donation.status}
                      color={statusColors[donation.status] || 'default'}
                      size="small"
                    />
                  </Box>

                  {donation.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {donation.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <RestaurantIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Qty: {donation.quantity}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 16, color: isExpired(donation) ? 'error.main' : 'text.secondary' }} />
                    <Typography variant="body2" color={isExpired(donation) ? 'error.main' : 'text.secondary'}>
                      Expires: {new Date(donation.expiryDate).toLocaleDateString()}
                    </Typography>
                  </Box>

                  {donation.donor && (
                    <Typography variant="caption" color="text.secondary">
                      By: {donation.donor.organizationName || donation.donor.name}
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ px: 2, pb: 1.5, pt: 0, justifyContent: 'space-between' }}>
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => navigate(`/donations/${donation._id}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Box>
                    {/* Donor actions: edit / delete */}
                    {(user?.role === 'donor' || user?.role === 'restaurant') && (donation.donor?._id || donation.donor) === user?._id && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => navigate(`/donations/${donation._id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(donation._id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {/* Shelter actions: reserve */}
                    {user?.role === 'shelter' && donation.status === 'available' && !isExpired(donation) && (
                      <Button size="small" variant="outlined" startIcon={<BookmarkAddIcon />} onClick={() => handleReserve(donation._id)}>
                        Reserve
                      </Button>
                    )}

                    {/* Mark collected (donor or shelter that reserved) */}
                    {donation.status === 'reserved' &&
                      ((donation.donor?._id || donation.donor) === user?._id ||
                        (donation.reservedBy && ((donation.reservedBy._id || donation.reservedBy) === user?._id))) && (
                        <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleCollect(donation._id)}>
                          Collected
                        </Button>
                      )}
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[6, 9, 18, 36]}
          sx={{ mt: 2 }}
        />
      )}
    </Box>
  )
}
