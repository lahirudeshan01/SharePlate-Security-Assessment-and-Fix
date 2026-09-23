import { Navigate, Outlet } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress color="primary" />
      </Box>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
