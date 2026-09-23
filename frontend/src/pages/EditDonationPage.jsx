import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Grid,
  CircularProgress,
  MenuItem,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import donationService from '../services/donationService'
import { toast } from 'react-toastify'

export default function EditDonationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const res = await donationService.getById(id)
        const d = res.donation || res.data
        reset({
          foodName: d.foodName,
          description: d.description || '',
          quantity: d.quantity,
          pickupAddress: d.pickupAddress || '',
          expiryDate: d.expiryDate ? d.expiryDate.split('T')[0] : '',
          status: d.status,
        })
      } catch (err) {
        setApiError(err.response?.data?.message || 'Failed to load donation')
      } finally {
        setLoading(false)
      }
    }
    fetchDonation()
  }, [id, reset])

  const onSubmit = async (data) => {
    try {
      setApiError('')
      setSaving(true)
      await donationService.update(id, data)
      toast.success('Donation updated successfully!')
      navigate(`/donations/${id}`)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to update donation')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/donations/${id}`)}
        sx={{ mb: 2 }}
      >
        Back to Details
      </Button>

      <Card sx={{ maxWidth: 700, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={3}>
            Edit Donation
          </Typography>

          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  label="Food Name"
                  fullWidth
                  {...register('foodName', { required: 'Food name is required' })}
                  error={!!errors.foodName}
                  helperText={errors.foodName?.message}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  {...register('description', {
                    maxLength: { value: 500, message: 'Max 500 characters' },
                  })}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Quantity"
                  type="number"
                  fullWidth
                  {...register('quantity', {
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Minimum quantity is 1' },
                    valueAsNumber: true,
                  })}
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Expiry Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  {...register('expiryDate', { required: 'Expiry date is required' })}
                  error={!!errors.expiryDate}
                  helperText={errors.expiryDate?.message}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Status"
                  select
                  fullWidth
                  defaultValue="available"
                  {...register('status')}
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="reserved">Reserved</MenuItem>
                  <MenuItem value="collected">Collected</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </TextField>
              </Grid>

              <Grid size={12}>
                <TextField
                  label="Pickup Address"
                  fullWidth
                  {...register('pickupAddress')}
                />
              </Grid>

              <Grid size={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 1 }}>
                  <Button variant="outlined" onClick={() => navigate(`/donations/${id}`)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
