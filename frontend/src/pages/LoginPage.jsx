import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import GoogleIcon from '@mui/icons-material/Google'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import '../styles/global.css'

export default function LoginPage() {
  const { user, login, loginWithToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tokenParam = params.get('token')
    const errorParam = params.get('error')
    if (tokenParam) {
      loginWithToken(tokenParam).then(() => {
        toast.success('Successfully logged in with Google!')
        navigate('/dashboard')
      })
    } else if (errorParam) {
      setApiError('Google OAuth authentication failed.')
    }
  }, [location])

  const onSubmit = async (data) => {
    try {
      setApiError('')
      setLoading(true)
      const res = await login(data)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    const backendBase = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000'
    window.location.href = `${backendBase}/api/auth/google`
  }

  return (
    <Box className="auth-page">
      <Card className="auth-card" elevation={3}>
        <Box className="auth-logo">
          <Typography variant="h4" fontWeight={700} color="primary">
            🍽️ SharePlate
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            Sign in to your account
          </Typography>
        </Box>

        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

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

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            {...register('password', { required: 'Password is required' })}
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

          <Box textAlign="right" mt={-1}>
            <Link to="/forgot-password" style={{ color: '#e65100', fontSize: '0.875rem' }}>
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>

          <Divider sx={{ my: 1 }}>OR</Divider>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{ py: 1.2, borderColor: '#003366', color: '#003366' }}
          >
            Sign in with Google
          </Button>

          <Typography textAlign="center" variant="body2" mt={1}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#e65100', fontWeight: 600 }}>
              Register
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  )
}
