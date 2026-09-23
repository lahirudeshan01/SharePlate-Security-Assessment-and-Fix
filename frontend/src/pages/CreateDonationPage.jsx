import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import donationService from '../services/donationService'
import { toast } from 'react-toastify'

export default function CreateDonationPage() {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    try {
      setApiError('')
      setLoading(true)
      await donationService.create(data)
      toast.success('Donation created successfully!')
      navigate('/donations')
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to create donation')
    } finally {
      setLoading(false)
    }
  }

  // Minimum date for expiry is tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/manage-requests')}
        sx={{ mb: 2 }}
      >
        Back to Donations
      </Button>

      <Card sx={{ maxWidth: 700, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={3}>
            Create New Donation
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
                  inputProps={{ min: minDate }}
                  {...register('expiryDate', { required: 'Expiry date is required' })}
                  error={!!errors.expiryDate}
                  helperText={errors.expiryDate?.message}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  label="Pickup Address"
                  fullWidth
                  {...register('pickupAddress')}
                  placeholder="Where should the shelter pick up the food?"
                />
              </Grid>

              <Grid size={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 1 }}>
                  <Button variant="outlined" onClick={() => navigate('/donations')}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Donation'}
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
