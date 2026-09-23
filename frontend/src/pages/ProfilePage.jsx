import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import userService from '../services/userService'
import authService from '../services/authService'
import { toast } from 'react-toastify'

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    watch: watchProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm({ defaultValues: {} })

  // Fetch fresh profile data on mount so fields are always populated
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authAPI.getCurrentUser()
        const profileData = response.data.user || response.data
        resetProfile({
          name: profileData?.name || '',
          phone: profileData?.phone || '',
          organizationName: profileData?.organizationName || '',
          address: {
            street: profileData?.address?.street || '',
            city: profileData?.address?.city || '',
            state: profileData?.address?.state || '',
            zipCode: profileData?.address?.zipCode || '',
            country: profileData?.address?.country || '',
          },
          preciseLocation: {
            latitude: profileData?.preciseLocation?.latitude ?? '',
            longitude: profileData?.preciseLocation?.longitude ?? '',
          },
        })
      } catch {
        // Fall back to context user if API call fails
        resetProfile({
          name: user?.name || '',
          phone: user?.phone || '',
          organizationName: user?.organizationName || '',
          address: {
            street: user?.address?.street || '',
            city: user?.address?.city || '',
            state: user?.address?.state || '',
            zipCode: user?.address?.zipCode || '',
            country: user?.address?.country || '',
          },
          preciseLocation: {
            latitude: user?.preciseLocation?.latitude ?? '',
            longitude: user?.preciseLocation?.longitude ?? '',
          },
        })
      } finally {
        setFetchLoading(false)
      }
    }
    fetchProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const watchedLatitude = watchProfile('preciseLocation.latitude')
  const watchedLongitude = watchProfile('preciseLocation.longitude')
  const latNum = Number(watchedLatitude)
  const lngNum = Number(watchedLongitude)
  const hasMapCoordinates =
    watchedLatitude !== '' &&
    watchedLongitude !== '' &&
    watchedLatitude !== undefined &&
    watchedLongitude !== undefined &&
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum)
  const googleMapsUrl = hasMapCoordinates
    ? `https://www.google.com/maps?q=${latNum},${lngNum}`
    : null

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm()

  const onProfileSubmit = async (data) => {
    try {
      setProfileError('')
      setProfileLoading(true)

      const latitude = data?.preciseLocation?.latitude
      const longitude = data?.preciseLocation?.longitude
      const preciseLocation =
        latitude !== '' && longitude !== '' && latitude !== undefined && longitude !== undefined
          ? { latitude: Number(latitude), longitude: Number(longitude) }
          : undefined

      const payload = {
        name: data.name,
        phone: data.phone,
        organizationName: data.organizationName,
        address: {
          street: data?.address?.street || '',
          city: data?.address?.city || '',
          state: data?.address?.state || '',
          zipCode: data?.address?.zipCode || '',
          country: data?.address?.country || '',
        },
        ...(preciseLocation ? { preciseLocation } : {}),
      }

      const res = await userService.updateProfile(payload)
      updateUser(res.data)
      toast.success('Profile updated successfully')
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const onPasswordSubmit = async (data) => {
    try {
      setPasswordError('')
      setPasswordLoading(true)
      await authService.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Password updated successfully')
      resetPassword()
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true)
      await userService.deleteAccount()
      toast.success('Account deleted successfully')
      logout()
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account')
      setDeleteDialogOpen(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          My Profile
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Manage your account information
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left column: Personal Information */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {profileError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {profileError}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handleProfileSubmit(onProfileSubmit)}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
              >
                <TextField
                  label="Full Name"
                  fullWidth
                  {...regProfile('name', { required: 'Name is required' })}
                  error={!!profileErrors.name}
                  helperText={profileErrors.name?.message}
                />

                <TextField
                  label="Phone (10 digits)"
                  fullWidth
                  {...regProfile('phone', {
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Enter a valid 10-digit phone number',
                    },
                  })}
                  error={!!profileErrors.phone}
                  helperText={profileErrors.phone?.message}
                />

                {(user?.role === 'donor' || user?.role === 'restaurant' || user?.role === 'shelter') && (
                  <TextField
                    label="Organization Name"
                    fullWidth
                    {...regProfile('organizationName')}
                  />
                )}

                {user?.role !== 'manager' && (
                  <>
                    <Divider>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                    </Divider>

                    <TextField label="Street" fullWidth {...regProfile('address.street')} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <TextField label="City" fullWidth {...regProfile('address.city')} />
                      <TextField label="State" fullWidth {...regProfile('address.state')} />
                      <TextField label="Zip Code" fullWidth {...regProfile('address.zipCode')} />
                      <TextField label="Country" fullWidth {...regProfile('address.country')} />
                    </Box>

                    <Divider>
                      <Typography variant="caption" color="text.secondary">
                        Precise Map Location (optional)
                      </Typography>
                    </Divider>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <TextField
                        label="Latitude"
                        placeholder="Ex: 6.9271"
                        fullWidth
                        {...regProfile('preciseLocation.latitude', {
                          validate: (value) => {
                            const lngVal = watchProfile('preciseLocation.longitude')
                            if (!value && lngVal) return 'Provide both latitude and longitude'
                            if (value && !Number.isFinite(Number(value))) return 'Must be a valid number'
                            if (value && (Number(value) < -90 || Number(value) > 90))
                              return 'Must be between -90 and 90'
                            return true
                          },
                        })}
                        error={!!profileErrors?.preciseLocation?.latitude}
                        helperText={profileErrors?.preciseLocation?.latitude?.message}
                      />
                      <TextField
                        label="Longitude"
                        placeholder="Ex: 79.8612"
                        fullWidth
                        {...regProfile('preciseLocation.longitude', {
                          validate: (value) => {
                            const latVal = watchProfile('preciseLocation.latitude')
                            if (!value && latVal) return 'Provide both latitude and longitude'
                            if (value && !Number.isFinite(Number(value))) return 'Must be a valid number'
                            if (value && (Number(value) < -180 || Number(value) > 180))
                              return 'Must be between -180 and 180'
                            return true
                          },
                        })}
                        error={!!profileErrors?.preciseLocation?.longitude}
                        helperText={profileErrors?.preciseLocation?.longitude?.message}
                      />
                    </Box>

                    {googleMapsUrl && (
                      <Alert severity="info">
                        Map preview:{' '}
                        <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                          {googleMapsUrl}
                        </a>
                      </Alert>
                    )}
                  </>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" variant="contained" disabled={profileLoading}>
                    {profileLoading ? 'Saving…' : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Account info */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Account
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
              <Typography fontWeight={500} sx={{ mb: 2 }}>
                {user?.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={
                    (user?.role === 'donor' || user?.role === 'restaurant') ? 'Restaurant' :
                    user?.role === 'shelter' ? 'Shelter / NGO' :
                    user?.role === 'manager' ? 'Manager' :
                    user?.role === 'admin' ? 'Admin' :
                    user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)
                  }
                  color="primary"
                  size="small"
                />
                <Chip
                  label={user?.isActive !== false ? 'Active' : 'Inactive'}
                  color={user?.isActive !== false ? 'success' : 'error'}
                  size="small"
                />
                <Chip
                  label={user?.isVerified ? 'Verified' : 'Unverified'}
                  color={user?.isVerified ? 'success' : 'default'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Change password */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Change Password
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {passwordError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {passwordError}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
              >
                <TextField
                  label="Current Password"
                  type={showCurrent ? 'text' : 'password'}
                  fullWidth
                  {...regPassword('currentPassword', { required: 'Current password is required' })}
                  error={!!passwordErrors.currentPassword}
                  helperText={passwordErrors.currentPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowCurrent((p) => !p)} edge="end">
                          {showCurrent ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="New Password"
                  type={showNew ? 'text' : 'password'}
                  fullWidth
                  {...regPassword('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                  error={!!passwordErrors.newPassword}
                  helperText={passwordErrors.newPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNew((p) => !p)} edge="end">
                          {showNew ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" variant="outlined" disabled={passwordLoading}>
                    {passwordLoading ? 'Updating…' : 'Update Password'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card sx={{ border: '1px solid', borderColor: 'error.light' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} color="error" gutterBottom>
                Danger Zone
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                fullWidth
              >
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete your account? All your data will be removed
            and this action <strong>cannot be undone</strong>.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={
              deleteLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />
            }
          >
            {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
