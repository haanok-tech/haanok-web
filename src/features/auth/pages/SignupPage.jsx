import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, TextField, Typography, Stack, InputAdornment, IconButton } from '@mui/material'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import apiClient from '../../../services/apiClient'

const initialForm = {
  username: '',
  email: '',
  password: '',
  fullName: '',
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const getErrorMessage = (err) => {
    const data = err?.response?.data || {}
    return (
      data.errorMessage ||
      data.appErrorMessage ||
      data.message ||
      data.error ||
      'Unable to create account. Please try again.'
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.username.trim() || !form.email.trim() || !form.password || !form.fullName.trim()) {
      setError('Please fill in all fields.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await apiClient.post('/api/auth/register', {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
      })

      setSuccess('Account created successfully. Redirecting to login...')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      console.error('Signup failed:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 45%, #f8fafc 100%)',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 500, p: 4, borderRadius: 4, boxShadow: '0 26px 60px rgba(91,45,157,0.12)' }}>
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: 1.4, fontWeight: 700 }}>
              New account
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5 }}>
              Sign up
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2, '& .MuiAlert-message': { fontWeight: 600 } }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          <TextField label="Full name" name="fullName" value={form.fullName} onChange={handleChange} fullWidth />
          <TextField label="Username" name="username" value={form.username} onChange={handleChange} fullWidth placeholder="7236924707" />
          <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} fullWidth placeholder="name@company.com" />
          <TextField
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end" size="small">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button type="submit" variant="contained" size="large" startIcon={<UserPlus size={18} />} disabled={loading} sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>

          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </Typography>
        </Stack>
      </Card>
    </Box>
  )
}
