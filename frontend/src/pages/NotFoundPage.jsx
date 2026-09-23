import { Link } from 'react-router-dom'
import { Box, Typography, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

export default function NotFoundPage() {
  return (
    <Box
      className="animate-scale-in"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: '6rem', md: '9rem' },
          fontWeight: 800,
          color: '#e5e7eb',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          mb: 1,
        }}
      >
        404
      </Typography>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Page Not Found
      </Typography>
      <Typography color="text.secondary" mb={4} maxWidth={380} lineHeight={1.7}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Button
        variant="contained"
        size="large"
        component={Link}
        to="/"
        startIcon={<ArrowBackIcon />}
        sx={{ px: 4 }}
      >
        Back to Home
      </Button>
    </Box>
  )
}
