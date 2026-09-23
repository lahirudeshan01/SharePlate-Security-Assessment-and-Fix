import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Tabs,
  Tab,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import '../styles/global.css'

const ROLE_TABS = [
  { value: 'donor', label: 'Restaurant', icon: <RestaurantIcon fontSize="small" /> },
  { value: 'shelter', label: 'Shelter / NGO', icon: <VolunteerActivismIcon fontSize="small" /> },
  { value: 'manager', label: 'Manager', icon: <AdminPanelSettingsIcon fontSize="small" /> },
]

export default function RegisterPage() {
  const { register: authRegister } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [roleTab, setRoleTab] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm({ defaultValues: { role: 'donor' }, mode: 'onChange' })

  const selectedRole = ROLE_TABS[roleTab].value

  const handleTabChange = (_, newValue) => {
    setRoleTab(newValue)
    setValue('role', ROLE_TABS[newValue].value)
  }

  const onSubmit = async (data) => {
    try {
      setApiError('')
      setLoading(true)
      await authRegister({ ...data, role: selectedRole })
      toast.success('Account created successfully! Welcome to SharePlate.')
      navigate('/dashboard')
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className="auth-page" sx={{ alignItems: 'flex-start', py: 4 }}>
      <Card className="auth-card" elevation={3} sx={{ maxWidth: 560 }}>
        <Box className="auth-logo">
          <Typography variant="h4" fontWeight={700} color="primary">
            🍽️ SharePlate
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            Create your account
          </Typography>
        </Box>

        {/* Role tabs */}
        <Tabs
          value={roleTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            mb: 2,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
            '& .Mui-selected': { color: '#0ea55b' },
            '& .MuiTabs-indicator': { backgroundColor: '#0ea55b' },
          }}
        >
          {ROLE_TABS.map((t) => (
            <Tab key={t.value} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>

        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} className="form-gap">
          {/* Hidden role field */}
          <input type="hidden" {...register('role')} value={selectedRole} />

          {/* Basic info */}
          <TextField
            label="Full Name"
            fullWidth
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
              maxLength: { value: 50, message: 'Name cannot exceed 50 characters' },
              pattern: { value: /^[A-Za-z ]+$/, message: 'Name can only contain letters and spaces' },
            })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          <TextField
            label="Email"
            type="email"
            fullWidth
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
                message: 'Password must include uppercase, lowercase, number, and special character (@$!%*?&)',
              },
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((p) => !p)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            {...register('confirmPassword', {
              required: 'Confirm password is required',
              validate: (value) => value === watch('password') || 'Passwords do not match',
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />

          {/* Organization name for donor/shelter only */}
          {(selectedRole === 'donor' || selectedRole === 'shelter') && (
            <TextField
              label="Organization Name"
              fullWidth
              {...register('organizationName', {
                required: 'Organization name is required',
              })}
              error={!!errors.organizationName}
              helperText={errors.organizationName?.message}
            />
          )}

          <TextField
            label="Phone"
            fullWidth
            {...register('phone', {
              required: 'Phone number is required',
              pattern: { value: /^[0-9]{10,15}$/, message: 'Enter a valid phone number (10–15 digits)' },
            })}
            error={!!errors.phone}
            helperText={errors.phone?.message}
          />

          {/* Address — not required for manager */}
          {selectedRole !== 'manager' && (
            <>
              <Divider textAlign="left">
                <Typography variant="caption" color="text.secondary">
                  Address (optional)
                </Typography>
              </Divider>

              <Alert severity="info" sx={{ mb: 1 }}>
                Precise map coordinates are added later from your profile settings.
              </Alert>

              <TextField label="Street" fullWidth {...register('address.street')} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField label="City" {...register('address.city')} />
                <TextField label="State" {...register('address.state')} />
                <TextField label="Zip Code" {...register('address.zipCode')} />
                <TextField label="Country" {...register('address.country')} />
              </Box>
            </>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading || !isValid}
            sx={{ bgcolor: '#0ea55b', '&:hover': { bgcolor: '#0a8f4e' } }}
          >
            {loading ? 'Creating account…' : `Create ${ROLE_TABS[roleTab].label} Account`}
          </Button>

          <Typography textAlign="center" variant="body2">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0ea55b', fontWeight: 600 }}>
              Sign in
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  )
}
