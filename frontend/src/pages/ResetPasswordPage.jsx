import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import authService from '../services/authService'
import { toast } from 'react-toastify'
import '../styles/global.css'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    try {
      setApiError('')
      setLoading(true)
      await authService.resetPassword(token, data.password)
      toast.success('Password reset successful! Please sign in.')
      navigate('/login')
    } catch (err) {
      setApiError(err.response?.data?.message || 'Reset link is invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className="auth-page">
      <Card className="auth-card" elevation={3}>
        <Box className="auth-logo">
          <Typography variant="h4" fontWeight={700} color="primary">
            🍽️ SharePlate
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            Set a new password
          </Typography>
        </Box>

        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} className="form-gap">
          <TextField
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
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

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </Button>

          <Typography textAlign="center" variant="body2">
            Remember your password?{' '}
            <Link to="/login" style={{ color: '#e65100', fontWeight: 600 }}>
              Sign in
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  )
}
