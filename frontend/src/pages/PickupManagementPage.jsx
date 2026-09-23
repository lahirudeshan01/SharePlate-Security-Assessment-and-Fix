import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Container,
  Paper,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Stack,
  Divider,
  Card,
  CardContent,
  Grid,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import RefreshIcon from '@mui/icons-material/Refresh'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ScheduleIcon from '@mui/icons-material/Schedule'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import InfoIcon from '@mui/icons-material/Info'
import { pickupAPI } from '../services/api'
import { toast } from 'react-toastify'

const STATUS_COLORS = {
  scheduled: 'primary',
  'in-progress': 'warning',
  completed: 'success',
  cancelled: 'error',
}

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function StatCard({ label, value, icon, color }) {
  return (
    <Card elevation={1} sx={{ borderLeft: `4px solid ${color}`, borderRadius: 2 }}>
      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color={color}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
        <Box sx={{ color, opacity: 0.7 }}>{icon}</Box>
      </CardContent>
    </Card>
  )
}

export default function PickupManagementPage() {
  const [pickups, setPickups] = useState([])
  const [approvedRequests, setApprovedRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)

  // Schedule dialog
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleRequest, setScheduleRequest] = useState(null)
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduleNotes, setScheduleNotes] = useState('')
  const [scheduleLoading, setScheduleLoading] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editPickup, setEditPickup] = useState(null)
  const [editTime, setEditTime] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Cancel dialog
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelPickup, setCancelPickup] = useState(null)
  const [cancelMessage, setCancelMessage] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailPickup, setDetailPickup] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pickupsRes, requestsRes] = await Promise.all([
        pickupAPI.getAll(),
        pickupAPI.getApprovedRequests(),
      ])
      setPickups(pickupsRes.data.pickups || [])
      setApprovedRequests(requestsRes.data.requests || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Schedule pickup ──────────────────────────────────────
  const openSchedule = (request) => {
    setScheduleRequest(request)
    setScheduledTime('')
    setScheduleNotes('')
    setScheduleOpen(true)
  }

  const handleSchedule = async () => {
    if (!scheduledTime) {
      toast.warning('Please select a scheduled time')
      return
    }
    setScheduleLoading(true)
    try {
      await pickupAPI.schedule({
        requestId: scheduleRequest._id,
        scheduledTime,
        notes: scheduleNotes,
      })
      toast.success('Pickup scheduled successfully')
      setScheduleOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule pickup')
    } finally {
      setScheduleLoading(false)
    }
  }

  // ── Edit pickup ──────────────────────────────────────────
  const openEdit = (pickup) => {
    setEditPickup(pickup)
    setEditTime(pickup.scheduledTime ? new Date(pickup.scheduledTime).toISOString().slice(0, 16) : '')
    setEditNotes(pickup.notes || '')
    setEditOpen(true)
  }

  const handleEdit = async () => {
    setEditLoading(true)
    try {
      await pickupAPI.update(editPickup._id, {
        scheduledTime: editTime || undefined,
        notes: editNotes,
      })
      toast.success('Pickup updated successfully')
      setEditOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update pickup')
    } finally {
      setEditLoading(false)
    }
  }

  // ── Complete pickup ──────────────────────────────────────
  const handleComplete = async (pickup) => {
    try {
      await pickupAPI.complete(pickup._id)
      toast.success('Pickup marked as completed')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete pickup')
    }
  }

  // ── Cancel pickup ────────────────────────────────────────
  const openCancel = (pickup) => {
    setCancelPickup(pickup)
    setCancelMessage('')
    setCancelOpen(true)
  }

  const handleCancel = async () => {
    setCancelLoading(true)
    try {
      await pickupAPI.cancel(cancelPickup._id, cancelMessage)
      toast.success('Pickup cancelled')
      setCancelOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel pickup')
    } finally {
      setCancelLoading(false)
    }
  }

  // ── Stats ────────────────────────────────────────────────
  const stats = {
    scheduled: pickups.filter((p) => p.status === 'scheduled').length,
    inProgress: pickups.filter((p) => p.status === 'in-progress').length,
    completed: pickups.filter((p) => p.status === 'completed').length,
    cancelled: pickups.filter((p) => p.status === 'cancelled').length,
  }

  const filteredPickups =
    tab === 0
      ? pickups
      : pickups.filter((p) => {
          const statuses = [['scheduled', 'in-progress'], ['completed'], ['cancelled']]
          return statuses[tab - 1]?.includes(p.status)
        })

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#0ea55b' }} />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="#111827">
            <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#0ea55b' }} />
            Pickup Management
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            Schedule, track, and manage food pickup operations
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={loadData} sx={{ bgcolor: '#f4f5f7', borderRadius: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Scheduled" value={stats.scheduled} icon={<ScheduleIcon sx={{ fontSize: 36 }} />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="In Progress" value={stats.inProgress} icon={<LocalShippingIcon sx={{ fontSize: 36 }} />} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Completed" value={stats.completed} icon={<CheckCircleIcon sx={{ fontSize: 36 }} />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Pending Requests" value={approvedRequests.length} icon={<AddIcon sx={{ fontSize: 36 }} />} color="#0ea55b" />
        </Grid>
      </Grid>

      {/* Pending approved requests */}
      {approvedRequests.length > 0 && (
        <Paper elevation={1} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: '#f0faf4', borderBottom: '1px solid #d1fadf' }}>
            <Typography fontWeight={700} color="#166534">
              ✅ {approvedRequests.length} Approved Request{approvedRequests.length > 1 ? 's' : ''} Waiting for Pickup
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Food</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Shelter</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pickup Address</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Approved</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvedRequests.map((req) => (
                  <TableRow key={req._id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{req.donation?.foodName || req.foodName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{req.shelter?.organizationName || req.shelter?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{req.shelter?.email}</Typography>
                    </TableCell>
                    <TableCell>{req.requestedQuantity}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {req.donation?.pickupAddress || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(req.updatedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => openSchedule(req)}
                        sx={{ bgcolor: '#0ea55b', '&:hover': { bgcolor: '#0a8f4e' }, textTransform: 'none' }}
                      >
                        Schedule
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Pickups table */}
      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              '& .Mui-selected': { color: '#0ea55b' },
              '& .MuiTabs-indicator': { backgroundColor: '#0ea55b' },
            }}
          >
            <Tab label={`All (${pickups.length})`} sx={{ textTransform: 'none' }} />
            <Tab label={`Active (${stats.scheduled + stats.inProgress})`} sx={{ textTransform: 'none' }} />
            <Tab label={`Completed (${stats.completed})`} sx={{ textTransform: 'none' }} />
            <Tab label={`Cancelled (${stats.cancelled})`} sx={{ textTransform: 'none' }} />
          </Tabs>
        </Box>

        {filteredPickups.length === 0 ? (
          <Box py={6} textAlign="center">
            <LocalShippingIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 1 }} />
            <Typography color="text.secondary">No pickups found</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Food</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Shelter</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Scheduled Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPickups.map((pickup) => (
                  <TableRow key={pickup._id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {pickup.request?.donation?.foodName || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Qty: {pickup.request?.donation?.quantity ?? pickup.request?.requestedQuantity ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {pickup.request?.shelter?.organizationName || pickup.request?.shelter?.name || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pickup.request?.shelter?.phone || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {pickup.scheduledTime
                          ? new Date(pickup.scheduledTime).toLocaleString()
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[pickup.status] || pickup.status}
                        color={STATUS_COLORS[pickup.status] || 'default'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {pickup.notes || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            onClick={() => { setDetailPickup(pickup); setDetailOpen(true) }}
                            sx={{ color: '#6b7280' }}
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {(pickup.status === 'scheduled' || pickup.status === 'in-progress') && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEdit(pickup)} sx={{ color: '#1976d2' }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Mark complete">
                              <IconButton size="small" onClick={() => handleComplete(pickup)} sx={{ color: '#2e7d32' }}>
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton size="small" onClick={() => openCancel(pickup)} sx={{ color: '#d32f2f' }}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Schedule Dialog ─────────────────────────── */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Schedule Pickup
          {scheduleRequest && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {scheduleRequest.donation?.foodName || scheduleRequest.foodName} —{' '}
              {scheduleRequest.shelter?.organizationName || scheduleRequest.shelter?.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Scheduled Date & Time"
              type="datetime-local"
              fullWidth
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().slice(0, 16) }}
            />
            <TextField
              label="Notes (optional)"
              multiline
              rows={3}
              fullWidth
              value={scheduleNotes}
              onChange={(e) => setScheduleNotes(e.target.value)}
              placeholder="e.g. Call before arriving, use side entrance…"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setScheduleOpen(false)} variant="outlined" disabled={scheduleLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            variant="contained"
            disabled={scheduleLoading}
            sx={{ bgcolor: '#0ea55b', '&:hover': { bgcolor: '#0a8f4e' } }}
          >
            {scheduleLoading ? <CircularProgress size={18} color="inherit" /> : 'Schedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Dialog ─────────────────────────────── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Pickup</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Scheduled Date & Time"
              type="datetime-local"
              fullWidth
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} variant="outlined" disabled={editLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            disabled={editLoading}
            sx={{ bgcolor: '#1976d2' }}
          >
            {editLoading ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Cancel Dialog ───────────────────────────── */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#d32f2f' }}>Cancel Pickup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will cancel the pickup and record an issue on the request.
          </Alert>
          <TextField
            label="Reason / Issue Message (optional)"
            multiline
            rows={3}
            fullWidth
            value={cancelMessage}
            onChange={(e) => setCancelMessage(e.target.value)}
            placeholder="e.g. Vehicle unavailable, please reschedule…"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelOpen(false)} variant="outlined" disabled={cancelLoading}>
            Back
          </Button>
          <Button
            onClick={handleCancel}
            variant="contained"
            color="error"
            disabled={cancelLoading}
          >
            {cancelLoading ? <CircularProgress size={18} color="inherit" /> : 'Confirm Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Detail Dialog ───────────────────────────── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Pickup Details
          <Chip
            label={STATUS_LABELS[detailPickup?.status] || detailPickup?.status}
            color={STATUS_COLORS[detailPickup?.status] || 'default'}
            size="small"
            sx={{ ml: 1, fontWeight: 600 }}
          />
        </DialogTitle>
        {detailPickup && (
          <DialogContent>
            <Stack spacing={1.5}>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">Food Item</Typography>
                <Typography fontWeight={600}>{detailPickup.request?.donation?.foodName || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Quantity</Typography>
                <Typography>{detailPickup.request?.donation?.quantity ?? detailPickup.request?.requestedQuantity ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Pickup Address</Typography>
                <Typography>{detailPickup.request?.donation?.pickupAddress || '—'}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">Shelter</Typography>
                <Typography fontWeight={600}>{detailPickup.request?.shelter?.organizationName || detailPickup.request?.shelter?.name || '—'}</Typography>
                <Typography variant="body2" color="text.secondary">{detailPickup.request?.shelter?.email}</Typography>
                <Typography variant="body2" color="text.secondary">{detailPickup.request?.shelter?.phone}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">Scheduled Time</Typography>
                <Typography>{detailPickup.scheduledTime ? new Date(detailPickup.scheduledTime).toLocaleString() : '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Notes</Typography>
                <Typography>{detailPickup.notes || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography>{new Date(detailPickup.createdAt).toLocaleString()}</Typography>
              </Box>
            </Stack>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailOpen(false)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
