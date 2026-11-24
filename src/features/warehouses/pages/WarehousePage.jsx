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
import { Plus, Search, Trash2, Warehouse } from 'lucide-react'
import apiClient from '../../../services/apiClient'

const initialForm = {
  warehouseCode: '',
  warehouseName: '',
  warehouseType: 'DISTRIBUTION_CENTER',
  warehouseRole: 'FULFILLMENT_CENTER',
  parentWarehouseId: '',
  street: '',
  city: '',
  state: '',
  country: 'India',
  zipCode: '',
  serviceablePincodes: '201301, 201302',
  capacity: 1000,
  capacityUnit: 'sqft',
  managerName: '',
  contactNumber: '',
  email: '',
  businessCityId: '',
}

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.content)) return payload.content
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && Array.isArray(payload.items)) return payload.items
  if (payload && Array.isArray(payload.value)) return payload.value
  return []
}

const normalizeWarehouse = (item, index) => ({
  id: item.id || `wh-${index + 1}`,
  warehouseCode: item.warehouseCode || '',
  warehouseName: item.warehouseName || item.name || 'Unnamed Warehouse',
  warehouseType: item.warehouseType || 'DISTRIBUTION_CENTER',
  warehouseRole: item.warehouseRole || 'FULFILLMENT_CENTER',
  parentWarehouseId: item.parentWarehouseId || null,
  address: item.address || {
    street: '',
    city: '',
    state: '',
    country: 'India',
    zipCode: '',
  },
  serviceablePincodes: Array.isArray(item.serviceablePincodes) ? item.serviceablePincodes : (item.serviceablePincodes ? String(item.serviceablePincodes).split(',') : []),
  capacity: Number(item.capacity ?? 0),
  capacityUnit: item.capacityUnit || 'sqft',
  managerName: item.managerName || '',
  contactNumber: item.contactNumber || '',
  email: item.email || '',
  businessCityId: item.businessCityId || '',
  isActive: item.isActive ?? item.active ?? true,
  createdAt: item.createdDate || item.createdAt || new Date().toISOString(),
})

const normalizeBusinessCity = (item, index) => ({
  id: item.id || `city-${index + 1}`,
  name: item.name || 'Unnamed City',
  state: item.state || '',
  country: item.country || 'India',
})

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState([])
  const [businessCities, setBusinessCities] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [form, setForm] = useState(initialForm)

  const loadBusinessCities = async () => {
    try {
      const response = await apiClient.get('/api/business-cities')
      const payload = normalizeApiList(response.data)
      const items = payload.map((item, index) => normalizeBusinessCity(item, index))
      setBusinessCities(items)

      if (!form.businessCityId && items.length > 0) {
        setForm((prev) => ({ ...prev, businessCityId: items[0].id }))
      }
    } catch (err) {
      console.error('Failed to load business cities:', err)
    }
  }

  const loadWarehouses = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get('/api/warehouses')
      const payload = normalizeApiList(response.data)
      const items = payload.map((item, index) => normalizeWarehouse(item, index))
      setWarehouses(items)
    } catch (err) {
      console.error('Failed to load warehouses:', err)
      setError('Unable to load warehouses from the API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBusinessCities()
    loadWarehouses()
  }, [])

  const filteredWarehouses = useMemo(() => {
    const keyword = search.toLowerCase()
    return warehouses.filter((warehouse) => {
      return (
        !keyword ||
        warehouse.warehouseName.toLowerCase().includes(keyword) ||
        warehouse.warehouseCode.toLowerCase().includes(keyword) ||
        warehouse.address.city.toLowerCase().includes(keyword)
      )
    })
  }, [warehouses, search])

  const handleCreate = async () => {
    const payload = {
      warehouseCode: form.warehouseCode,
      warehouseName: form.warehouseName,
      warehouseType: form.warehouseType,
      warehouseRole: form.warehouseRole,
      parentWarehouseId: form.parentWarehouseId || null,
      address: {
        street: form.street,
        city: form.city,
        state: form.state,
        country: form.country,
        zipCode: form.zipCode,
      },
      serviceablePincodes: form.serviceablePincodes
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      capacity: Number(form.capacity),
      capacityUnit: form.capacityUnit,
      managerName: form.managerName,
      contactNumber: form.contactNumber,
      email: form.email,
      businessCityId: form.businessCityId,
    }

    try {
      await apiClient.post('/api/warehouses', payload)
      setOpenDialog(false)
      setForm(initialForm)
      await loadWarehouses()
    } catch (err) {
      console.error('Failed to create warehouse:', err)
      setError('Unable to create warehouse.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/api/warehouses/${id}`)
      setWarehouses((prev) => prev.filter((warehouse) => warehouse.id !== id))
    } catch (err) {
      console.error('Failed to delete warehouse:', err)
      setError('Unable to delete warehouse.')
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.2 }}>Operations</Typography>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Warehouses</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setOpenDialog(true)}>
          Add Warehouse
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search by warehouse name or code"
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
            <Typography color="text.secondary">Loading warehouses...</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell>Warehouse</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWarehouses.length > 0 ? (
                filteredWarehouses.map((warehouse) => (
                  <TableRow key={warehouse.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: '#eef2ff', color: '#4338ca' }}>
                          <Warehouse size={18} />
                        </Box>
                        <Typography fontWeight={600}>{warehouse.warehouseName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{warehouse.warehouseCode || '-'}</TableCell>
                    <TableCell>
                      <Chip label={warehouse.warehouseType} color="primary" size="small" />
                    </TableCell>
                    <TableCell>{warehouse.address.city || '-'}</TableCell>
                    <TableCell>{warehouse.capacity} {warehouse.capacityUnit}</TableCell>
                    <TableCell>{warehouse.managerName || '-'}</TableCell>
                    <TableCell>{warehouse.contactNumber || '-'}</TableCell>
                    <TableCell align="center">
                      <Button color="error" size="small" variant="text" startIcon={<Trash2 size={16} />} onClick={() => handleDelete(warehouse.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No warehouses found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Warehouse</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Warehouse Code" value={form.warehouseCode} onChange={(e) => setForm({ ...form, warehouseCode: e.target.value })} />
            <TextField label="Warehouse Name" value={form.warehouseName} onChange={(e) => setForm({ ...form, warehouseName: e.target.value })} />
            <FormControl>
              <InputLabel>Warehouse Type</InputLabel>
              <Select label="Warehouse Type" value={form.warehouseType} onChange={(e) => setForm({ ...form, warehouseType: e.target.value })}>
                <MenuItem value="DISTRIBUTION_CENTER">DISTRIBUTION_CENTER</MenuItem>
                <MenuItem value="FULFILLMENT_CENTER">FULFILLMENT_CENTER</MenuItem>
                <MenuItem value="CROSS_DOCKING_FACILITY">CROSS_DOCKING_FACILITY</MenuItem>
                <MenuItem value="COLD_STORAGE_WAREHOUSE">COLD_STORAGE_WAREHOUSE</MenuItem>
                <MenuItem value="AUTOMATED_WAREHOUSE">AUTOMATED_WAREHOUSE</MenuItem>
                <MenuItem value="BULK_STORAGE_WAREHOUSE">BULK_STORAGE_WAREHOUSE</MenuItem>
                <MenuItem value="PICK_AND_PACK_WAREHOUSE">PICK_AND_PACK_WAREHOUSE</MenuItem>
                <MenuItem value="CONSOLIDATION_WAREHOUSE">CONSOLIDATION_WAREHOUSE</MenuItem>
                <MenuItem value="REVERSE_LOGISTICS_WAREHOUSE">REVERSE_LOGISTICS_WAREHOUSE</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Warehouse Role</InputLabel>
              <Select label="Warehouse Role" value={form.warehouseRole} onChange={(e) => setForm({ ...form, warehouseRole: e.target.value })}>
                <MenuItem value="FULFILLMENT_CENTER">FULFILLMENT_CENTER</MenuItem>
                <MenuItem value="DARK_STORE">DARK_STORE</MenuItem>
                <MenuItem value="DISTRIBUTION_CENTER">DISTRIBUTION_CENTER</MenuItem>
                <MenuItem value="SORTATION_CENTER">SORTATION_CENTER</MenuItem>
                <MenuItem value="DELIVERY_STATION">DELIVERY_STATION</MenuItem>
                <MenuItem value="PICKUP_POINT">PICKUP_POINT</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            <TextField label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <TextField label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <TextField label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <TextField label="ZIP Code" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
            <TextField label="Serviceable Pincodes" value={form.serviceablePincodes} onChange={(e) => setForm({ ...form, serviceablePincodes: e.target.value })} />
            <TextField label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
            <TextField label="Capacity Unit" value={form.capacityUnit} onChange={(e) => setForm({ ...form, capacityUnit: e.target.value })} />
            <TextField label="Manager Name" value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} />
            <TextField label="Contact Number" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
            <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <FormControl>
              <InputLabel>Business City</InputLabel>
              <Select
                label="Business City"
                value={form.businessCityId}
                onChange={(e) => setForm({ ...form, businessCityId: e.target.value })}
              >
                {businessCities.map((city) => (
                  <MenuItem key={city.id} value={city.id}>
                    {city.name} - {city.state || city.country}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
