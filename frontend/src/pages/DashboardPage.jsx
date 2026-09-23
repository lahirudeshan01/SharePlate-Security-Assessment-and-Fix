import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Container,
  Button,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import BusinessIcon from '@mui/icons-material/Business'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ScheduleIcon from '@mui/icons-material/Schedule'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useAuth } from '../context/AuthContext'
import { pickupAPI } from '../services/api'

const roleConfig = {
  restaurant: {
    iconBg: 'rgba(230,81,0,0.1)',
    label: 'Restaurant',
    color: 'warning',
    welcome: 'Share surplus food and reduce waste.',
  },
  donor: {
    iconBg: 'rgba(230,81,0,0.1)',
    label: 'Restaurant',
    color: 'warning',
    welcome: 'Share surplus food and reduce waste.',
  },
  shelter: {
    iconBg: 'rgba(46,125,50,0.1)',
    label: 'Shelter / NGO',
    color: 'success',
    welcome: 'Find available food donations near you.',
  },
  admin: {
    iconBg: 'rgba(21,101,192,0.1)',
    label: 'Administrator',
    color: 'info',
    welcome: 'Manage platform users and activity.',
  },
  manager: {
    iconBg: 'rgba(14,165,91,0.1)',
    label: 'Pickup Manager',
    color: 'success',
    welcome: 'Schedule and coordinate food pickups.',
  },
}

function RoleIcon({ role, size = 28 }) {
  const sx = { fontSize: size }
  if (role === 'donor' || role === 'restaurant') return <RestaurantIcon sx={{ ...sx, color: '#e65100' }} />
  if (role === 'shelter') return <VolunteerActivismIcon sx={{ ...sx, color: '#2e7d32' }} />
  if (role === 'admin') return <AdminPanelSettingsIcon sx={{ ...sx, color: '#1565c0' }} />
  if (role === 'manager') return <LocalShippingIcon sx={{ ...sx, color: '#0ea55b' }} />
  return <PersonIcon sx={{ ...sx, color: '#6b7280' }} />
}

function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 0.75 }}>
      <Box sx={{ color: 'text.secondary', mt: 0.15, flexShrink: 0, display: 'flex' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={500} color="text.primary">
          {value}
        </Typography>
      </Box>
    </Box>
  )
}

// ── Manager-specific stat card ────────────────────────────────────────────────
function StatCard({ label, value, icon, color, loading }) {
  return (
    <Card elevation={1} sx={{ borderLeft: `4px solid ${color}`, borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color={color} lineHeight={1}>
            {loading ? <CircularProgress size={24} sx={{ color }} /> : value}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {label}
          </Typography>
        </Box>
        <Box sx={{ color, opacity: 0.6 }}>{icon}</Box>
      </CardContent>
    </Card>
  )
}

// ── Manager dashboard ─────────────────────────────────────────────────────────
function ManagerDashboard({ user }) {
  const navigate = useNavigate()
  const [pickups, setPickups] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([pickupAPI.getAll(), pickupAPI.getApprovedRequests()])
      .then(([pickupsRes, reqRes]) => {
        setPickups(pickupsRes.data.pickups || [])
        setPendingRequests(reqRes.data.requests || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const scheduled = pickups.filter((p) => p.status === 'scheduled').length
  const inProgress = pickups.filter((p) => p.status === 'in-progress').length
  const completed = pickups.filter((p) => p.status === 'completed').length
  const recent = pickups.slice(0, 5)

  const STATUS_COLORS = { scheduled: '#1976d2', 'in-progress': '#ed6c02', completed: '#2e7d32', cancelled: '#d32f2f' }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="#111827">
            Pickup Manager Dashboard
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            Welcome back, <strong>{user?.name}</strong>
          </Typography>
        </Box>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/pickup-management')}
          sx={{ bgcolor: '#0ea55b', '&:hover': { bgcolor: '#0a8f4e' }, fontWeight: 600, borderRadius: 2 }}
        >
          Open Pickup Management
        </Button>
      </Box>

      {/* Stats row */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Scheduled" value={scheduled} loading={loading}
            icon={<ScheduleIcon sx={{ fontSize: 36 }} />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="In Progress" value={inProgress} loading={loading}
            icon={<LocalShippingIcon sx={{ fontSize: 36 }} />} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Completed" value={completed} loading={loading}
            icon={<CheckCircleIcon sx={{ fontSize: 36 }} />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Awaiting Pickup" value={pendingRequests.length} loading={loading}
            icon={<PendingActionsIcon sx={{ fontSize: 36 }} />} color="#0ea55b" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent pickups */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ pb: 0 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography fontWeight={700}>Recent Pickups</Typography>
                <Button size="small" onClick={() => navigate('/pickup-management')}
                  sx={{ color: '#0ea55b', textTransform: 'none' }}>
                  View all
                </Button>
              </Box>
            </CardContent>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress sx={{ color: '#0ea55b' }} />
              </Box>
            ) : recent.length === 0 ? (
              <Box py={4} textAlign="center">
                <LocalShippingIcon sx={{ fontSize: 40, color: '#d1d5db', mb: 1 }} />
                <Typography color="text.secondary" variant="body2">No pickups yet</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Food</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Shelter</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Scheduled</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recent.map((p) => (
                      <TableRow key={p._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {p.request?.donation?.foodName || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {p.request?.shelter?.organizationName || p.request?.shelter?.name || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {p.scheduledTime ? new Date(p.scheduledTime).toLocaleDateString() : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={p.status}
                            size="small"
                            sx={{
                              bgcolor: STATUS_COLORS[p.status] + '1a',
                              color: STATUS_COLORS[p.status],
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              textTransform: 'capitalize',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Profile card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={1} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                <Box sx={{ display: 'inline-flex', p: 1, borderRadius: 2, bgcolor: 'rgba(14,165,91,0.1)' }}>
                  <LocalShippingIcon sx={{ fontSize: 24, color: '#0ea55b' }} />
                </Box>
                <Box>
                  <Typography fontWeight={700} lineHeight={1.2}>{user?.name}</Typography>
                  <Chip label="Pickup Manager" color="success" size="small" sx={{ mt: 0.3 }} />
                </Box>
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <InfoRow icon={<EmailIcon fontSize="small" />} label="Email" value={user?.email} />
              <InfoRow icon={<PhoneIcon fontSize="small" />} label="Phone" value={user?.phone} />
              <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
                <Chip
                  label={user?.isActive ? 'Active' : 'Inactive'}
                  color={user?.isActive ? 'success' : 'error'}
                  size="small"
                />
                <Chip
                  label={user?.isVerified ? 'Verified' : 'Unverified'}
                  color={user?.isVerified ? 'success' : 'default'}
                  size="small"
                  variant="outlined"
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                Member since{' '}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                  : '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

// ── Generic dashboard (donor / shelter / admin) ───────────────────────────────
function GenericDashboard({ user }) {
  const navigate = useNavigate()
  const role = roleConfig[user?.role] || roleConfig.donor

  const fullAddress = [
    user?.address?.street,
    user?.address?.city,
    user?.address?.state,
    user?.address?.zipCode,
    user?.address?.country,
  ]
    .filter(Boolean)
    .join(', ') || user?.location?.adress || user?.location?.address || ''

  const hasDetailedCoords =
    user?.preciseLocation?.latitude !== undefined && user?.preciseLocation?.longitude !== undefined
  const hasSimpleCoords =
    user?.location?.lat !== undefined && user?.location?.lng !== undefined
  const hasPreciseLocation = hasDetailedCoords || hasSimpleCoords

  const lat = hasDetailedCoords ? user.preciseLocation.latitude : user?.location?.lat
  const lng = hasDetailedCoords ? user.preciseLocation.longitude : user?.location?.lng
  const preciseCoordinateText = hasPreciseLocation ? `${lat}, ${lng}` : ''
  const preciseLocationMapUrl = hasPreciseLocation ? `https://www.google.com/maps?q=${lat},${lng}` : ''

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Box className="page-header">
          <Typography variant="h4" fontWeight={700}>Dashboard</Typography>
          <Typography color="text.secondary" mt={0.5}>
            Welcome back, <strong>{user?.name}</strong>
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Profile summary card */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: '100%' }} elevation={1}>
              <CardContent sx={{ pt: 3, px: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 1.5,
                      borderRadius: 3,
                      bgcolor: role.iconBg,
                      flexShrink: 0,
                    }}
                  >
                    <RoleIcon role={user?.role} size={28} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                      {user?.name}
                    </Typography>
                    <Chip label={role.label} color={role.color} size="small" sx={{ mt: 0.5 }} />
                  </Box>
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                <InfoRow icon={<PersonIcon fontSize="small" />} label="Full Name" value={user?.name} />
                <InfoRow icon={<EmailIcon fontSize="small" />} label="Email" value={user?.email} />
                <InfoRow icon={<PhoneIcon fontSize="small" />} label="Phone" value={user?.phone} />
                <InfoRow icon={<BusinessIcon fontSize="small" />} label="Organization" value={user?.organizationName} />
                <InfoRow icon={<LocationOnIcon fontSize="small" />} label="Address" value={fullAddress} />
                <InfoRow icon={<LocationOnIcon fontSize="small" />} label="Map Coordinates" value={preciseCoordinateText} />
                {hasPreciseLocation && (
                  <Typography variant="caption" sx={{ pl: 4.5 }}>
                    <a href={preciseLocationMapUrl} target="_blank" rel="noreferrer">
                      Open in Google Maps
                    </a>
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Role info / account status */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Card elevation={1}>
                  <CardContent sx={{ px: 3, py: 2.5 }}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600} letterSpacing="0.08em">
                      Your Role
                    </Typography>
                    <Typography variant="h6" fontWeight={600} mt={0.5}>
                      {role.label}
                    </Typography>
                    <Typography color="text.secondary" variant="body2" mt={0.5}>
                      {role.welcome}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={12}>
                <Card elevation={1}>
                  <CardContent sx={{ px: 3, py: 2.5 }}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600} letterSpacing="0.08em">
                      Account Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                      <Chip
                        label={user?.isActive ? 'Active' : 'Inactive'}
                        color={user?.isActive ? 'success' : 'error'}
                        size="small"
                      />
                      <Chip
                        label={user?.isVerified ? 'Email Verified' : 'Email Not Verified'}
                        color={user?.isVerified ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                      <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Member since{' '}
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : '—'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Quick Actions for donors */}
          {(user?.role === 'donor' || user?.role === 'restaurant') && (
            <Grid size={12}>
              <Card elevation={1}>
                <CardContent sx={{ px: 3, py: 2.5 }}>
                  <Typography variant="overline" color="text.secondary" fontWeight={600} letterSpacing="0.08em">
                    Quick Actions
                  </Typography>
                  <Stack direction="row" spacing={2} mt={1.5} flexWrap="wrap">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<RestaurantIcon />}
                      onClick={() => navigate('/donations')}
                    >
                      My Donations
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate('/create-donation')}
                    >
                      + New Donation
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Quick Actions for shelters */}
          {user?.role === 'shelter' && (
            <Grid size={12}>
              <Card elevation={1}>
                <CardContent sx={{ px: 3, py: 2.5 }}>
                  <Typography variant="overline" color="text.secondary" fontWeight={600} letterSpacing="0.08em">
                    Quick Actions
                  </Typography>
                  <Stack direction="row" spacing={2} mt={1.5}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<VolunteerActivismIcon />}
                      onClick={() => navigate('/manage-requests')}
                    >
                      Browse & Request Donations
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

        </Grid>
      </Box>
    </Container>
  )
}

// ── Entry point ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()

  if (user?.role === 'manager') return <ManagerDashboard user={user} />
  return <GenericDashboard user={user} />
}
