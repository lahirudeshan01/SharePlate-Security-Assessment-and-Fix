import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Stack,
  Avatar,
  Chip,
} from '@mui/material'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import RecyclingIcon from '@mui/icons-material/Recycling'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import PeopleIcon from '@mui/icons-material/People'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'

/* ── Animated counter hook ─────────────────────────────────── */
function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = 0
          const startTime = performance.now()
          const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1)
            setCount(Math.floor(progress * (end - start) + start))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return { count, ref }
}

/* ── Data ──────────────────────────────────────────────────── */
const features = [
  {
    icon: <RestaurantIcon sx={{ fontSize: 32, color: '#fff' }} />,
    gradient: 'linear-gradient(135deg, #e65100 0%, #ff8a50 100%)',
    title: 'Restaurants',
    description:
      'Share surplus food instead of throwing it away. Help your community and reduce waste effortlessly.',
  },
  {
    icon: <VolunteerActivismIcon sx={{ fontSize: 32, color: '#fff' }} />,
    gradient: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
    title: 'Shelters & NGOs',
    description:
      'Discover available food donations near you and request exactly what your shelter needs.',
  },
  {
    icon: <RecyclingIcon sx={{ fontSize: 32, color: '#fff' }} />,
    gradient: 'linear-gradient(135deg, #795548 0%, #a1887f 100%)',
    title: 'Zero Food Waste',
    description:
      'Every meal shared is food saved from landfill — a step toward a sustainable future for all.',
  },
]

const howItWorks = [
  {
    step: '01',
    icon: <RestaurantIcon sx={{ fontSize: 28, color: '#e65100' }} />,
    title: 'List Surplus Food',
    description: 'Restaurants post available meals, specifying quantity, pickup time and dietary info.',
  },
  {
    step: '02',
    icon: <PeopleIcon sx={{ fontSize: 28, color: '#2e7d32' }} />,
    title: 'Shelters Request',
    description: 'Nearby shelters browse listings and request the food they need for their community.',
  },
  {
    step: '03',
    icon: <LocalShippingIcon sx={{ fontSize: 28, color: '#1565c0' }} />,
    title: 'Pickup & Deliver',
    description: 'Coordinate a convenient pickup or delivery — the food reaches those who need it.',
  },
  {
    step: '04',
    icon: <FavoriteIcon sx={{ fontSize: 28, color: '#c62828' }} />,
    title: 'Make an Impact',
    description: 'Track your contribution. Every plate shared builds a stronger, kinder community.',
  },
]

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Restaurant Owner',
    avatar: 'S',
    color: '#e65100',
    text: 'SharePlate made it incredibly easy to donate our leftover meals. We now waste almost nothing!',
  },
  {
    name: 'James Rivera',
    role: 'Shelter Manager',
    avatar: 'J',
    color: '#2e7d32',
    text: 'We receive fresh, quality food every week through the platform. It has been a game-changer for us.',
  },
  {
    name: 'Priya Sharma',
    role: 'Volunteer Coordinator',
    avatar: 'P',
    color: '#1565c0',
    text: 'The pickup coordination is seamless. I can manage everything from my phone in minutes.',
  },
]

/* ── Component ─────────────────────────────────────────────── */
export default function HomePage() {
  const meals = useCounter(500, 2000)
  const restaurants = useCounter(50, 1800)
  const shelters = useCounter(30, 1600)

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <Box
        className="animate-fade-in"
        sx={{
          position: 'relative',
          background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #111827 100%)',
          color: 'white',
          py: { xs: 12, md: 18 },
          textAlign: 'center',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-40%',
            right: '-20%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(230,81,0,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-30%',
            left: '-15%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(14,165,91,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Chip
            label="🍽️ SHAREPLATE PLATFORM"
            sx={{
              bgcolor: 'rgba(230,81,0,0.15)',
              color: '#ff8a50',
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontSize: '0.7rem',
              mb: 3,
              border: '1px solid rgba(230,81,0,0.25)',
              py: 0.5,
            }}
          />
          <Typography
            variant="h1"
            className="animate-fade-up delay-1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.25rem' },
              fontWeight: 800,
              lineHeight: 1.1,
              mb: 3,
              color: '#f9fafb',
              letterSpacing: '-0.02em',
            }}
          >
            Food for those{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #e65100, #ff8a50)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              who need it
            </Box>
          </Typography>
          <Typography
            className="animate-fade-up delay-2"
            sx={{
              color: 'rgba(255,255,255,0.55)',
              mb: 5,
              maxWidth: 560,
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.8,
              fontSize: '1.1rem',
            }}
          >
            Connecting restaurants with shelters to reduce food waste and feed
            communities — one plate at a time.
          </Typography>
          <Stack
            className="animate-fade-up delay-3"
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{ width: '100%' }}
          >
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/register"
              endIcon={<ArrowForwardIcon />}
              sx={{
                background: 'linear-gradient(135deg, #e65100, #ff6d00)',
                boxShadow: '0 4px 20px rgba(230,81,0,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #bf4500, #e65100)',
                  boxShadow: '0 6px 28px rgba(230,81,0,0.45)',
                },
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/login"
              sx={{
                color: 'rgba(255,255,255,0.85)',
                borderColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.5)',
                  bgcolor: 'rgba(255,255,255,0.06)',
                },
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ─── Animated Stats ───────────────────────────────── */}
      <Box
        sx={{
          bgcolor: '#fff',
          borderBottom: '1px solid #e5e7eb',
          position: 'relative',
          mt: -4,
          mx: { xs: 2, md: 'auto' },
          maxWidth: 900,
          borderRadius: 3,
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          zIndex: 2,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          divider={
            <Box sx={{ width: { sm: '1px' }, height: { xs: '1px', sm: 'auto' }, bgcolor: '#f0f0f0', alignSelf: 'stretch' }} />
          }
          sx={{ py: { xs: 3, md: 4 } }}
        >
          {[
            { ref: meals.ref, value: meals.count, suffix: '+', label: 'Meals Shared', color: '#e65100' },
            { ref: restaurants.ref, value: restaurants.count, suffix: '+', label: 'Partner Restaurants', color: '#2e7d32' },
            { ref: shelters.ref, value: shelters.count, suffix: '+', label: 'Shelters Supported', color: '#1565c0' },
          ].map((s) => (
            <Box ref={s.ref} key={s.label} sx={{ flex: 1, textAlign: 'center', py: { xs: 1.5, sm: 0 } }}>
              <Typography variant="h3" fontWeight={800} sx={{ color: s.color }}>
                {s.value}{s.suffix}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.5}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* ─── Features ─────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <Chip
            label="WHY SHAREPLATE"
            size="small"
            sx={{
              bgcolor: 'rgba(14,165,91,0.08)',
              color: '#0ea55b',
              fontWeight: 700,
              letterSpacing: '0.08em',
              fontSize: '0.7rem',
              mb: 2,
            }}
          />
          <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>
            A smarter way to{' '}
            <Box component="span" sx={{ color: '#0ea55b' }}>
              share food
            </Box>
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 520, mx: 'auto', lineHeight: 1.7 }}>
            Our platform makes it effortless for restaurants, shelters, and volunteers to
            connect and reduce food waste together.
          </Typography>
        </Box>
        <Grid container spacing={4} justifyContent="center">
          {features.map((f, i) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 4 }}
              key={f.title}
              className={`animate-fade-up delay-${i + 1}`}
            >
              <Card
                className="card-hover"
                sx={{
                  height: '100%',
                  p: 0,
                  borderRadius: 4,
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                  '&:hover': {
                    boxShadow: '0 16px 48px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 4, pb: '32px !important' }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 1.5,
                      borderRadius: 3,
                      background: f.gradient,
                      mb: 3,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontSize: '1.15rem' }}>
                    {f.title}
                  </Typography>
                  <Typography color="text.secondary" variant="body2" lineHeight={1.8}>
                    {f.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ─── How It Works ─────────────────────────────────── */}
      <Box sx={{ bgcolor: '#f8fafc', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Chip
              label="HOW IT WORKS"
              size="small"
              sx={{
                bgcolor: 'rgba(230,81,0,0.08)',
                color: '#e65100',
                fontWeight: 700,
                letterSpacing: '0.08em',
                fontSize: '0.7rem',
                mb: 2,
              }}
            />
            <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>
              Four simple steps
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 460, mx: 'auto', lineHeight: 1.7 }}>
              From surplus food to a served meal — it only takes a few clicks.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {howItWorks.map((item, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.step} className={`animate-fade-up delay-${i + 1}`}>
                <Box sx={{ textAlign: 'center', position: 'relative' }}>
                  <Typography
                    sx={{
                      fontSize: '4rem',
                      fontWeight: 900,
                      color: 'rgba(0,0,0,0.04)',
                      lineHeight: 1,
                      mb: -2,
                      position: 'relative',
                      zIndex: 0,
                    }}
                  >
                    {item.step}
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 1.5,
                      borderRadius: '50%',
                      bgcolor: '#fff',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      mb: 2,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography color="text.secondary" variant="body2" lineHeight={1.8} sx={{ px: 1 }}>
                    {item.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Testimonials ─────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <Chip
            label="TESTIMONIALS"
            size="small"
            sx={{
              bgcolor: 'rgba(21,101,192,0.08)',
              color: '#1565c0',
              fontWeight: 700,
              letterSpacing: '0.08em',
              fontSize: '0.7rem',
              mb: 2,
            }}
          />
          <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>
            Loved by our community
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {testimonials.map((t, i) => (
            <Grid size={{ xs: 12, md: 4 }} key={t.name} className={`animate-fade-up delay-${i + 1}`}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <FormatQuoteIcon sx={{ fontSize: 32, color: t.color, opacity: 0.3, mb: 1 }} />
                  <Typography sx={{ lineHeight: 1.8, color: '#374151', mb: 3, fontSize: '0.95rem' }}>
                    &ldquo;{t.text}&rdquo;
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: t.color, fontWeight: 700, width: 44, height: 44 }}>
                      {t.avatar}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700} variant="body2">
                        {t.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.role}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ─── Trust badges ─────────────────────────────────── */}
      <Box sx={{ bgcolor: '#f8fafc', py: 5, borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
        <Container maxWidth="md">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={4}
            justifyContent="center"
            alignItems="center"
          >
            {[
              { icon: <CheckCircleOutlineIcon sx={{ color: '#0ea55b' }} />, text: '100% Free to Use' },
              { icon: <CheckCircleOutlineIcon sx={{ color: '#0ea55b' }} />, text: 'Verified Partners' },
              { icon: <CheckCircleOutlineIcon sx={{ color: '#0ea55b' }} />, text: 'Real-Time Tracking' },
              { icon: <CheckCircleOutlineIcon sx={{ color: '#0ea55b' }} />, text: 'Secure & Private' },
            ].map((b) => (
              <Stack key={b.text} direction="row" spacing={1} alignItems="center">
                {b.icon}
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  {b.text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #111827 100%)',
          py: { xs: 10, md: 14 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '700px',
            background: 'radial-gradient(circle, rgba(230,81,0,0.08) 0%, transparent 60%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight={800} sx={{ color: '#f9fafb', mb: 2, letterSpacing: '-0.01em' }}>
            Ready to make a{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #e65100, #ff8a50)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              difference?
            </Box>
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 5, lineHeight: 1.8, fontSize: '1.05rem' }}>
            Join SharePlate today and be part of the solution to food waste and hunger.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/register"
              endIcon={<ArrowForwardIcon />}
              sx={{
                background: 'linear-gradient(135deg, #e65100, #ff6d00)',
                boxShadow: '0 4px 20px rgba(230,81,0,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #bf4500, #e65100)',
                  boxShadow: '0 6px 28px rgba(230,81,0,0.45)',
                },
                px: 5,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              Join Now — It's Free
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
