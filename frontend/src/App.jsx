import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import ManagerRoute from './components/ManagerRoute'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import CreateDonationPage from './pages/CreateDonationPage'
import DonationsPage from './pages/DonationsPage'
import DonationDetailPage from './pages/DonationDetailPage'
import EditDonationPage from './pages/EditDonationPage'
import BrowseDonations from './pages/BrowseDonations'
import Dashboard from './pages/Dashboard'
import CreateRequest from './pages/CreateRequest'
import UsersPage from './pages/UsersPage'
import NotFoundPage from './pages/NotFoundPage'
import PickupManagementPage from './pages/PickupManagementPage'

const theme = createTheme({
  palette: {
    primary: { main: '#0ea55b' },
    secondary: { main: '#111827' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
})

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Protected routes (any authenticated user) */}
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/donations" element={<DonationsPage />} />
                <Route path="/donations/:id" element={<DonationDetailPage />} />
                <Route path="/donations/:id/edit" element={<EditDonationPage />} />
                <Route path="/create-donation" element={<CreateDonationPage />} />
                <Route path="/browse-donations" element={<BrowseDonations />} />
                <Route path="/manage-requests" element={<Dashboard />} />
                <Route path="/create-request/:donationId" element={<CreateRequest />} />

                {/* Manager-only routes */}
                <Route element={<ManagerRoute />}>
                  <Route path="/pickup-management" element={<PickupManagementPage />} />
                </Route>

                {/* Admin-only routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/users" element={<UsersPage />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  )
}
