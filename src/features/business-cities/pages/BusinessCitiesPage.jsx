import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Building2, Plus, Search, Trash2 } from 'lucide-react'
import apiClient from '../../../services/apiClient'

const initialForm = {
  name: '',
  state: '',
  country: 'India',
  tier: 1,
  deliverySlaDays: 2,
  baseShippingCost: 50,
  fulfillmentHubs: 'Hub1, Hub2',
}

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.content)) return payload.content
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && Array.isArray(payload.items)) return payload.items
  if (payload && Array.isArray(payload.value)) return payload.value
  return []
}

const normalizeBusinessCity = (item, index) => ({
  id: item.id || `city-${index + 1}`,
  name: item.name || 'Unnamed City',
  cityCode: item.cityCode || '',
  state: item.state || '',
  country: item.country || 'India',
  tier: Number(item.tier ?? 1),
  deliverySlaDays: Number(item.deliverySlaDays ?? 2),
  baseShippingCost: Number(item.baseShippingCost ?? 0),
  fulfillmentHubs: Array.isArray(item.fulfillmentHubs)
    ? item.fulfillmentHubs
    : item.fulfillmentHubs
      ? String(item.fulfillmentHubs).split(',')
      : ['Hub1'],
  isActive: item.isActive ?? item.active ?? true,
  createdAt: item.createdDate || item.createdAt || new Date().toISOString(),
})

export default function BusinessCitiesPage() {
  const [cities, setCities] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [form, setForm] = useState(initialForm)

  const loadCities = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get('/api/business-cities')
      const payload = normalizeApiList(response.data)
      const items = payload.map((item, index) => normalizeBusinessCity(item, index))
      setCities(items)
    } catch (err) {
      console.error('Failed to load business cities:', err)
      setError('Unable to load business cities from the API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCities()
  }, [])

  const filteredCities = useMemo(() => {
    const keyword = search.toLowerCase()
    return cities.filter((city) => {
      return (
        !keyword ||
        city.name.toLowerCase().includes(keyword) ||
        city.state.toLowerCase().includes(keyword) ||
        city.country.toLowerCase().includes(keyword)
      )
    })
  }, [cities, search])

  const handleCreate = async () => {
    const payload = {
      name: form.name,
      state: form.state,
      country: form.country,
      tier: Number(form.tier),
      deliverySlaDays: Number(form.deliverySlaDays),
      baseShippingCost: Number(form.baseShippingCost),
      fulfillmentHubs: form.fulfillmentHubs
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }

    try {
      await apiClient.post('/api/business-cities', payload)
      setOpenDialog(false)
      setForm(initialForm)
      await loadCities()
    } catch (err) {
      console.error('Failed to create business city:', err)
      setError('Unable to create business city.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/api/business-cities/${id}`)
      setCities((prev) => prev.filter((city) => city.id !== id))
    } catch (err) {
      console.error('Failed to delete business city:', err)
      setError('Unable to delete business city.')
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.2 }}>Operations</Typography>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Business Cities</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setOpenDialog(true)}>
          Add City
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search city, state or country"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.65 }} /> }}
          />
        </Stack>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.2)' }}>
        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={22} />
            <Typography color="text.secondary">Loading cities...</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell>City</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell>SLA</TableCell>
                <TableCell>Shipping</TableCell>
                <TableCell>Hubs</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <TableRow key={city.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: '#eef2ff', color: '#4338ca', width: 36, height: 36 }}>
                          <Building2 size={18} />
                        </Avatar>
                        <Typography fontWeight={600}>{city.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{city.state}</TableCell>
                    <TableCell>{city.country}</TableCell>
                    <TableCell>
                      <Chip label={`Tier ${city.tier}`} color="primary" size="small" />
                    </TableCell>
                    <TableCell>{city.deliverySlaDays} days</TableCell>
                    <TableCell>₹{city.baseShippingCost}</TableCell>
                    <TableCell>{city.fulfillmentHubs.join(', ')}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" size="small" onClick={() => handleDelete(city.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No business cities found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Business City</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <TextField label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <TextField label="Tier" type="number" value={form.tier} onChange={(e) => setForm({ ...form, tier: Number(e.target.value) })} />
            <TextField label="Delivery SLA Days" type="number" value={form.deliverySlaDays} onChange={(e) => setForm({ ...form, deliverySlaDays: Number(e.target.value) })} />
            <TextField label="Base Shipping Cost" type="number" value={form.baseShippingCost} onChange={(e) => setForm({ ...form, baseShippingCost: Number(e.target.value) })} />
            <TextField label="Fulfillment Hubs" value={form.fulfillmentHubs} onChange={(e) => setForm({ ...form, fulfillmentHubs: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
