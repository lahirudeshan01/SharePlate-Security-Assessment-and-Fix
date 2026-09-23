import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import authService from '../services/authService'
import '../styles/global.css'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
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
      await authService.forgotPassword(data.email)
      setSent(true)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to send reset email. Please try again.')
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
            Forgot your password?
          </Typography>
        </Box>

        {sent ? (
          <Alert severity="success">
            If that email is registered, a password reset link has been sent. Please check your
            inbox.
          </Alert>
        ) : (
          <>
            {apiError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {apiError}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" mb={2}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} className="form-gap">
              <TextField
                label="Email"
                type="email"
                fullWidth
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </Button>
            </Box>
          </>
        )}

        <Box textAlign="center" mt={2}>
          <Link to="/login" style={{ color: '#e65100', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ArrowBackIcon fontSize="small" /> Back to Sign In
          </Link>
        </Box>
      </Card>
    </Box>
  )
}
