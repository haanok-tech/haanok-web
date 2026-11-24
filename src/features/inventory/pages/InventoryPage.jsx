import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Activity, PackageCheck, PackagePlus, Search, Warehouse, Zap } from 'lucide-react'
import apiClient from '../../../services/apiClient'

const createInitialForm = () => ({
  warehouseId: 'warehouse123',
  productId: 'product123',
  initialQuantity: 100,
  reorderLevel: 10,
  reorderQuantity: 50,
})

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.content)) return payload.content
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && Array.isArray(payload.items)) return payload.items
  if (payload && Array.isArray(payload.value)) return payload.value
  return []
}

const normalizeInventory = (item, index) => ({
  id: item.id || item.inventoryId || item._id || `inventory-${index + 1}`,
  warehouseId: item.warehouseId || item.warehouse?.id || item.warehouseIdValue || '',
  productId: item.productId || item.product?.id || item.productIdValue || '',
  availableQuantity: Number(item.availableQuantity ?? item.currentQuantity ?? item.quantity ?? item.totalQuantity ?? 0),
  reservedQuantity: Number(item.reservedQuantity ?? 0),
  committedQuantity: Number(item.committedQuantity ?? 0),
  damagedQuantity: Number(item.damagedQuantity ?? 0),
  reorderLevel: Number(item.reorderLevel ?? 0),
  reorderQuantity: Number(item.reorderQuantity ?? 0),
  lastUpdatedAt: item.lastUpdatedAt || item.updatedAt || item.createdAt || new Date().toISOString(),
})

const stockActions = [
  { label: 'Reserve Stock', endpoint: 'reserve' },
  { label: 'Commit Stock', endpoint: 'commit' },
  { label: 'Release Reservation', endpoint: 'release-reservation' },
  { label: 'Cancel Committed', endpoint: 'cancel-committed' },
  { label: 'Dispatch Stock', endpoint: 'dispatch' },
  { label: 'Receive Stock', endpoint: 'receive' },
  { label: 'Mark Damaged', endpoint: 'mark-damaged' },
  { label: 'Restore Damaged', endpoint: 'restore-damaged' },
]

export default function InventoryPage() {
  const [form, setForm] = useState(createInitialForm())
  const [inventory, setInventory] = useState([])
  const [selectedInventoryId, setSelectedInventoryId] = useState('')
  const [warehouseId, setWarehouseId] = useState('warehouse123')
  const [productId, setProductId] = useState('product123')
  const [lookupId, setLookupId] = useState('')
  const [quantity, setQuantity] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    refreshWarehouseInventory('warehouse123')
  }, [])

  const refreshWarehouseInventory = async (nextWarehouseId = warehouseId) => {
    if (!nextWarehouseId) {
      setInventory([])
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.get(`/api/inventory/warehouse/${nextWarehouseId}`)
      const normalized = normalizeList(response.data).map(normalizeInventory)
      setInventory(normalized)
      if (normalized[0]?.id) setSelectedInventoryId(normalized[0].id)
    } catch (err) {
      console.error('Failed to load warehouse inventory:', err)
      setError('Unable to load inventory for this warehouse.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInventory = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const payload = {
        warehouseId: form.warehouseId,
        productId: form.productId,
        initialQuantity: Number(form.initialQuantity),
        reorderLevel: Number(form.reorderLevel),
        reorderQuantity: Number(form.reorderQuantity),
      }

      const response = await apiClient.post('/api/inventory', payload)
      const created = response.data
      const createdId = created?.id || created?.inventoryId || selectedInventoryId || lookupId

      setSuccess(`Inventory created successfully${createdId ? ` (ID: ${createdId})` : ''}.`)
      setSelectedInventoryId(createdId || '')
      setLookupId(createdId || '')
      await refreshWarehouseInventory(form.warehouseId)
    } catch (err) {
      console.error('Failed to create inventory:', err)
      setError('Unable to create inventory. Check the warehouse and product values.')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadById = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await apiClient.get(`/api/inventory/${lookupId}`)
      const item = response.data
      const normalized = normalizeInventory(item)
      setInventory([normalized])
      setSelectedInventoryId(normalized.id)
      setSuccess(`Inventory loaded for ID ${normalized.id}.`)
    } catch (err) {
      console.error('Failed to load inventory by id:', err)
      setError('Unable to load inventory by ID.')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadByWarehouseAndProduct = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await apiClient.get(`/api/inventory/warehouse/${warehouseId}/product/${productId}`)
      const item = response.data
      const normalized = normalizeInventory(item)
      setInventory([normalized])
      setSelectedInventoryId(normalized.id)
      setSuccess(`Inventory loaded for warehouse ${warehouseId} and product ${productId}.`)
    } catch (err) {
      console.error('Failed to load inventory by warehouse and product:', err)
      setError('Unable to load inventory for the selected warehouse and product.')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (endpoint) => {
    const id = selectedInventoryId || lookupId

    if (!id) {
      setError('Select or enter an inventory ID before running a stock action.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await apiClient.post(`/api/inventory/${id}/${endpoint}`, {
        quantity: Number(quantity),
      })

      setSuccess(`${endpoint.replace(/-/g, ' ')} completed successfully.`)
      const detailResponse = await apiClient.get(`/api/inventory/${id}`)
      const normalized = normalizeInventory(detailResponse.data)
      setInventory([normalized])
      setSelectedInventoryId(normalized.id)
      setLookupId(normalized.id)
    } catch (err) {
      console.error(`Failed to perform ${endpoint}:`, err)
      setError(`Unable to ${endpoint.replace(/-/g, ' ')} inventory.`)
    } finally {
      setLoading(false)
    }
  }

  const totalAvailable = useMemo(
    () => inventory.reduce((sum, item) => sum + Number(item.availableQuantity || 0), 0),
    [inventory],
  )

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.2 }}>Operations</Typography>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Inventory</Typography>
        </Box>
        <Chip label="Inventory API Console" color="primary" variant="outlined" />
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <PackagePlus size={18} color="#4338ca" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Created</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{inventory.length}</Typography>
            <Typography color="text.secondary">inventory records</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <PackageCheck size={18} color="#16a34a" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Available</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{totalAvailable}</Typography>
            <Typography color="text.secondary">units in stock</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Zap size={18} color="#f59e0b" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Reserved</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {inventory.reduce((sum, item) => sum + Number(item.reservedQuantity || 0), 0)}
            </Typography>
            <Typography color="text.secondary">units reserved</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Activity size={18} color="#dc2626" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Damaged</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {inventory.reduce((sum, item) => sum + Number(item.damagedQuantity || 0), 0)}
            </Typography>
            <Typography color="text.secondary">damaged units</Typography>
          </Card>
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none', mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Create Inventory</Typography>
            <Stack spacing={2}>
              <TextField label="Warehouse ID" value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} />
              <TextField label="Product ID" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} />
              <TextField type="number" label="Initial Quantity" value={form.initialQuantity} onChange={(e) => setForm({ ...form, initialQuantity: e.target.value })} />
              <TextField type="number" label="Reorder Level" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
              <TextField type="number" label="Reorder Quantity" value={form.reorderQuantity} onChange={(e) => setForm({ ...form, reorderQuantity: e.target.value })} />
              <Button variant="contained" onClick={handleCreateInventory} disabled={loading}>
                {loading ? 'Creating...' : 'Create Inventory'}
              </Button>
            </Stack>
          </Card>

          <Card sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none', mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Lookup Inventory</Typography>
            <Stack spacing={2}>
              <TextField label="Inventory ID" value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
              <Button variant="outlined" onClick={handleLoadById} disabled={loading || !lookupId}>
                Get Inventory by ID
              </Button>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth label="Warehouse ID" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} />
                <Button variant="outlined" onClick={() => refreshWarehouseInventory(warehouseId)} disabled={loading || !warehouseId}>
                  Load by Warehouse
                </Button>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth label="Product ID" value={productId} onChange={(e) => setProductId(e.target.value)} />
                <Button variant="outlined" onClick={handleLoadByWarehouseAndProduct} disabled={loading || !warehouseId || !productId}>
                  Load by Warehouse + Product
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none', mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Stock Actions</Typography>
            <Stack spacing={2}>
              <TextField label="Inventory ID" value={selectedInventoryId} onChange={(e) => setSelectedInventoryId(e.target.value)} />
              <TextField type="number" label="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {stockActions.map((action) => (
                  <Button key={action.endpoint} variant="contained" color="secondary" size="small" onClick={() => handleAction(action.endpoint)} disabled={loading}>
                    {action.label}
                  </Button>
                ))}
              </Box>
            </Stack>
          </Card>

          <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.2)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(148,163,184,0.2)', bgcolor: '#f8fafc' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Warehouse size={18} color="#0f172a" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Inventory Records</Typography>
              </Stack>
            </Box>

            {loading ? (
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={22} />
                <Typography color="text.secondary">Loading inventory...</Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell>ID</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Available</TableCell>
                    <TableCell>Reserved</TableCell>
                    <TableCell>Damaged</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.length > 0 ? (
                    inventory.map((item) => (
                      <TableRow key={item.id} hover onClick={() => setSelectedInventoryId(item.id)} sx={{ cursor: 'pointer' }}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.warehouseId}</TableCell>
                        <TableCell>{item.productId}</TableCell>
                        <TableCell>{item.availableQuantity}</TableCell>
                        <TableCell>{item.reservedQuantity}</TableCell>
                        <TableCell>{item.damagedQuantity}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                          No inventory records available.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
