import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, TextField, Typography, Stack, InputAdornment, IconButton } from '@mui/material'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import apiClient, { setAuthTokens } from '../../../services/apiClient'

const initialForm = {
  usernameOrEmail: '',
  password: '',
}

const getNestedValue = (obj, pathList) => {
  return pathList.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : ''), obj)
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.usernameOrEmail.trim() || !form.password.trim()) {
      setError('Username/email and password are required.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await apiClient.post('/api/auth/login', {
        usernameOrEmail: form.usernameOrEmail.trim(),
        password: form.password,
      })

      const payload = response?.data?.payload || response?.data?.data || response?.data || {}
      const accessToken =
        payload.accessToken ||
        payload.access_token ||
        payload.token ||
        payload.jwt ||
        getNestedValue(response, ['data', 'accessToken']) ||
        getNestedValue(response, ['data', 'token'])

      const refreshToken =
        payload.refreshToken ||
        payload.refresh_token ||
        getNestedValue(response, ['data', 'refreshToken']) ||
        getNestedValue(response, ['data', 'refresh_token'])

      if (!accessToken) {
        setError('Login succeeded but no access token was returned by the server.')
        return
      }

      setAuthTokens({ accessToken, refreshToken })
      navigate('/dashboard')
    } catch (err) {
      console.error('Login failed:', err)
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Invalid username/email or password.')
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
      <Card sx={{ width: '100%', maxWidth: 460, p: 4, borderRadius: 4, boxShadow: '0 26px 60px rgba(91,45,157,0.12)' }}>
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: 1.4, fontWeight: 700 }}>
              Welcome back
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5 }}>
              Sign in
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Username or Email"
            name="usernameOrEmail"
            value={form.usernameOrEmail}
            onChange={handleChange}
            fullWidth
            placeholder="7236924707 or name@company.com"
          />

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

          <Button type="submit" variant="contained" size="large" startIcon={<LogIn size={18} />} disabled={loading} sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}>
            {loading ? 'Signing in...' : 'Login'}
          </Button>

          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
            Don&apos;t have an account?{' '}
            <Link to="/signup" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>
              Create one
            </Link>
          </Typography>
        </Stack>
      </Card>
    </Box>
  )
}
