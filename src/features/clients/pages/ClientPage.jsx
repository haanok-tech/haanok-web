import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
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
import { Plus, Search, Building2 } from 'lucide-react'
import apiClient from '../../../services/apiClient'

const initialForm = {
  id: '',
  clientCode: '',
  clientName: '',
  clientType: 'INDIVIDUAL',
  email: '',
  mobileNumber: '',
  alternateMobileNumber: '',
  gstNumber: '',
  panNumber: '',
  branchName: '',
  branchCode: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  website: '',
  businessCityId: '',
  stateId: '',
  businessCountryId: '',
  headOffice: true,
  stateHeadOffice: true,
  cityHeadOffice: true,
  clientId: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
  },
  shippingAddresses: [],
  productConfigs: [],
}

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.payload)) return payload.payload
  if (payload && Array.isArray(payload.content)) return payload.content
  if (payload && Array.isArray(payload.value)) return payload.value
  if (payload && Array.isArray(payload.items)) return payload.items
  if (payload && Array.isArray(payload.data)) return payload.data
  return []
}

const normalizeClient = (item, index) => ({
  id: item.id || item.clientId || `client-${index + 1}`,
  clientCode: item.clientCode || '',
  clientName: item.clientName || item.name || 'Unnamed Client',
  clientType: item.clientType || 'INDIVIDUAL',
  email: item.email || '',
  mobileNumber: item.mobileNumber || '',
  alternateMobileNumber: item.alternateMobileNumber || '',
  gstNumber: item.gstNumber || '',
  panNumber: item.panNumber || '',
  branchName: item.branchName || '',
  branchCode: item.branchCode || '',
  city: item.city || item.address?.city || '',
  state: item.state || item.address?.state || '',
  country: item.country || item.address?.country || 'India',
  postalCode: item.postalCode || item.address?.postalCode || '',
  website: item.website || '',
  businessCityId: item.businessCityId || '',
  active: item.active ?? true,
  createdAt: item.createdDate || item.createdAt || new Date().toISOString(),
})

export default function ClientPage() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [editingClient, setEditingClient] = useState(null)

  const loadClients = async (keyword = '') => {
    try {
      setLoading(true)
      setError('')

      const url = keyword.trim()
        ? `/api/client/search?name=${encodeURIComponent(keyword.trim())}`
        : '/api/client'

      const response = await apiClient.get(url)
      const items = normalizeApiList(response.data).map((item, index) => normalizeClient(item, index))
      setClients(items)
    } catch (err) {
      console.error('Failed to load clients:', err)
      setError('Unable to load clients from the API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients(search)
  }, [search])

  const filteredClients = useMemo(() => {
    const keyword = search.toLowerCase()
    return clients.filter((client) => {
      return (
        !keyword ||
        client.clientName.toLowerCase().includes(keyword) ||
        client.clientCode.toLowerCase().includes(keyword) ||
        client.email.toLowerCase().includes(keyword)
      )
    })
  }, [clients, search])

  const handleOpenCreate = () => {
    setEditingClient(null)
    setForm(initialForm)
    setOpenDialog(true)
  }

  const handleOpenEdit = (client) => {
    setEditingClient(client)
    setForm({
      id: client.id || '',
      clientCode: client.clientCode || '',
      clientName: client.clientName || '',
      clientType: client.clientType || 'INDIVIDUAL',
      email: client.email || '',
      mobileNumber: client.mobileNumber || '',
      alternateMobileNumber: client.alternateMobileNumber || '',
      gstNumber: client.gstNumber || '',
      panNumber: client.panNumber || '',
      branchName: client.branchName || '',
      branchCode: client.branchCode || '',
      city: client.city || '',
      state: client.state || '',
      country: client.country || 'India',
      postalCode: client.postalCode || '',
      website: client.website || '',
      businessCityId: client.businessCityId || '',
      stateId: client.stateId || '',
      businessCountryId: client.businessCountryId || '',
      headOffice: client.headOffice ?? true,
      stateHeadOffice: client.stateHeadOffice ?? true,
      cityHeadOffice: client.cityHeadOffice ?? true,
      clientId: client.clientId || client.id || '',
      address: {
        line1: client.address?.addressLine1 || client.address?.line1 || '',
        line2: client.address?.addressLine2 || client.address?.line2 || '',
        city: client.address?.city || client.city || '',
        state: client.address?.state || client.state || '',
        country: client.address?.country || client.country || 'India',
        postalCode: client.address?.postalCode || client.postalCode || '',
      },
      shippingAddresses: client.shippingAddresses || [],
      productConfigs: client.productConfigs || [],
    })
    setOpenDialog(true)
  }

  const handleCreate = async () => {
    const payload = {
      clientCode: form.clientCode || 'CLIENT-001',
      clientName: form.clientName,
      clientType: form.clientType,
      email: form.email,
      mobileNumber: form.mobileNumber,
      alternateMobileNumber: form.alternateMobileNumber,
      gstNumber: form.gstNumber,
      panNumber: form.panNumber,
      address: {
        line1: form.address.line1,
        line2: form.address.line2,
        city: form.address.city,
        state: form.address.state,
        postalCode: form.address.postalCode,
        country: form.address.country,
      },
      branchName: form.branchName,
      branchCode: form.branchCode,
      city: form.city,
      businessCityId: form.businessCityId,
      state: form.state,
      stateId: form.stateId,
      country: form.country,
      businessCountryId: form.businessCountryId,
      postalCode: form.postalCode,
      website: form.website,
      headOffice: form.headOffice,
      stateHeadOffice: form.stateHeadOffice,
      cityHeadOffice: form.cityHeadOffice,
      clientId: form.clientId || form.clientCode || 'client-001',
      shippingAddresses: form.shippingAddresses,
      productConfigs: form.productConfigs,
    }

    try {
      if (editingClient) {
        await apiClient.patch(`/api/client/${editingClient.id || editingClient.clientId || form.clientId}`, payload)
      } else {
        await apiClient.post('/api/client', payload)
      }

      setOpenDialog(false)
      setForm(initialForm)
      setEditingClient(null)
      await loadClients(search)
    } catch (err) {
      console.error('Failed to save client:', err)
      setError('Unable to save client.')
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.2 }}>Operations</Typography>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Clients</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleOpenCreate}>
          Add Client
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search by client name, code or email"
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
            <Typography color="text.secondary">Loading clients...</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell>Client</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: '#eef2ff', color: '#4338ca' }}>
                          <Building2 size={18} />
                        </Box>
                        <Typography fontWeight={600}>{client.clientName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{client.clientCode || '-'}</TableCell>
                    <TableCell>
                      <Chip label={client.clientType} color="primary" size="small" />
                    </TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.mobileNumber || '-'}</TableCell>
                    <TableCell>{client.city || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={client.active ? 'Active' : 'Inactive'}
                        color={client.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" onClick={() => handleOpenEdit(client)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No clients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Client Name" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
              <TextField fullWidth label="Client Code" value={form.clientCode} onChange={(e) => setForm({ ...form, clientCode: e.target.value })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Client Type</InputLabel>
                <Select label="Client Type" value={form.clientType} onChange={(e) => setForm({ ...form, clientType: e.target.value })}>
                  <MenuItem value="INDIVIDUAL">INDIVIDUAL</MenuItem>
                  <MenuItem value="BUSINESS">BUSINESS</MenuItem>
                  <MenuItem value="PARTNER">PARTNER</MenuItem>
                  <MenuItem value="CORPORATE">CORPORATE</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Mobile Number" value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} />
              <TextField fullWidth label="Alternate Mobile" value={form.alternateMobileNumber} onChange={(e) => setForm({ ...form, alternateMobileNumber: e.target.value })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="GST Number" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
              <TextField fullWidth label="PAN Number" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Branch Name" value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} />
              <TextField fullWidth label="Branch Code" value={form.branchCode} onChange={(e) => setForm({ ...form, branchCode: e.target.value })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <TextField fullWidth label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              <TextField fullWidth label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Postal Code" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
              <TextField fullWidth label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Address Line 1" value={form.address.line1} onChange={(e) => setForm({ ...form, address: { ...form.address, line1: e.target.value } })} />
              <TextField fullWidth label="Address Line 2" value={form.address.line2} onChange={(e) => setForm({ ...form, address: { ...form.address, line2: e.target.value } })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Address City" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
              <TextField fullWidth label="Address State" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
              <TextField fullWidth label="Address Country" value={form.address.country} onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Address Postal Code" value={form.address.postalCode} onChange={(e) => setForm({ ...form, address: { ...form.address, postalCode: e.target.value } })} />
              <TextField fullWidth label="Business City Id" value={form.businessCityId} onChange={(e) => setForm({ ...form, businessCityId: e.target.value })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="State Id" value={form.stateId} onChange={(e) => setForm({ ...form, stateId: e.target.value })} />
              <TextField fullWidth label="Business Country Id" value={form.businessCountryId} onChange={(e) => setForm({ ...form, businessCountryId: e.target.value })} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>{editingClient ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
