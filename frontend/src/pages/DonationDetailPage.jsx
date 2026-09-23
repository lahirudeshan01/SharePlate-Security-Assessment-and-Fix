import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Grid,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PersonIcon from '@mui/icons-material/Person'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '../context/AuthContext'
import donationService from '../services/donationService'
import { toast } from 'react-toastify'

const statusColors = {
  available: 'success',
  reserved: 'warning',
  collected: 'info',
  expired: 'error',
}

export default function DonationDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [donation, setDonation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        setLoading(true)
        const res = await donationService.getById(id)
        setDonation(res.donation || res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load donation')
      } finally {
        setLoading(false)
      }
    }
    fetchDonation()
  }, [id])

  const handleReserve = async () => {
    try {
      const res = await donationService.reserve(id)
      toast.success('Donation reserved!')
      setDonation(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reserve')
    }
  }

  const handleCollect = async () => {
    try {
      const res = await donationService.markCollected(id)
      toast.success('Marked as collected!')
      setDonation(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to collect')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this donation?')) return
    try {
      await donationService.delete(id)
      toast.success('Donation deleted')
      navigate('/donations')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/donations')} sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!donation) return null

  const isExpired = new Date(donation.expiryDate) < new Date()
  const isDonor = donation.donor?._id === user?._id
  const isReserver = donation.reservedBy && (donation.reservedBy._id === user?._id || donation.reservedBy === user?._id)

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/donations')} sx={{ mb: 2 }}>
        Back to Donations
      </Button>

      <Card sx={{ maxWidth: 700, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h4" fontWeight={700}>
              {donation.foodName}
            </Typography>
            <Chip
              label={donation.status}
              color={statusColors[donation.status] || 'default'}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            {donation.description && (
              <Grid size={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{donation.description}</Typography>
              </Grid>
            )}

            <Grid size={6}>
              <Typography variant="subtitle2" color="text.secondary">Quantity</Typography>
              <Typography variant="body1" fontWeight={600}>{donation.quantity}</Typography>
            </Grid>

            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 18, color: isExpired ? 'error.main' : 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Expiry Date</Typography>
                  <Typography variant="body1" color={isExpired ? 'error.main' : 'text.primary'} fontWeight={600}>
                    {new Date(donation.expiryDate).toLocaleDateString()}
                    {isExpired && ' (Expired)'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {donation.pickupAddress && (
              <Grid size={12}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.3 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Pickup Address</Typography>
                    <Typography variant="body1">{donation.pickupAddress}</Typography>
                  </Box>
                </Box>
              </Grid>
            )}

            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Donated By</Typography>
                  <Typography variant="body1">
                    {donation.donor?.organizationName || donation.donor?.name || 'Unknown'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {donation.reservedBy && (
              <Grid size={6}>
                <Typography variant="subtitle2" color="text.secondary">Reserved By</Typography>
                <Typography variant="body1">
                  {donation.reservedBy?.organizationName || donation.reservedBy?.name || 'A shelter'}
                </Typography>
              </Grid>
            )}

            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">
                Created: {new Date(donation.createdAt).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Donor: edit / delete own donations */}
            {(user?.role === 'donor' || user?.role === 'restaurant') && isDonor && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/donations/${donation._id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </>
            )}

            {/* Shelter: reserve */}
            {user?.role === 'shelter' && donation.status === 'available' && !isExpired && (
              <Button
                variant="contained"
                startIcon={<BookmarkAddIcon />}
                onClick={handleReserve}
              >
                Reserve This Donation
              </Button>
            )}

            {/* Mark as collected */}
            {donation.status === 'reserved' && (isDonor || isReserver) && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={handleCollect}
              >
                Mark as Collected
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
