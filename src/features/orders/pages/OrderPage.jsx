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
import { Plus, Search, ShoppingCart } from 'lucide-react'
import apiClient from '../../../services/apiClient'

const createItem = () => ({
  productId: '',
  quantity: 1,
  mrp: 0,
})

const initialForm = {
  customerId: '',
  totalPrice: '',
  items: [createItem()],
}

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.content)) return payload.content
  if (payload && Array.isArray(payload.value)) return payload.value
  if (payload && Array.isArray(payload.items)) return payload.items
  if (payload && Array.isArray(payload.data)) return payload.data
  return []
}

const normalizeOrder = (item, index) => ({
  id: item.id || item.orderId || `order-${index + 1}`,
  customerId: item.customerId || 'Unknown',
  totalPrice: Number(item.totalPrice ?? item.total ?? 0),
  itemCount: Array.isArray(item.items) ? item.items.length : 0,
  items: Array.isArray(item.items) ? item.items : [],
  createdAt: item.createdDate || item.createdAt || new Date().toISOString(),
})

export default function OrderPage() {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [form, setForm] = useState(initialForm)

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get('/order/v1')
      const items = normalizeApiList(response.data).map((item, index) => normalizeOrder(item, index))
      setOrders(items)
    } catch (err) {
      console.error('Failed to load orders:', err)
      setError('Unable to load orders from the API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    const keyword = search.toLowerCase()
    return orders.filter((order) => {
      const matches =
        !keyword ||
        order.customerId.toLowerCase().includes(keyword) ||
        order.items.some((item) => (item.productId || '').toLowerCase().includes(keyword))
      return matches
    })
  }, [orders, search])

  const handleCreate = async () => {
    if (!form.customerId || !form.items.length) {
      setError('Customer ID and at least one product item are required.')
      return
    }

    const payload = {
      customerId: form.customerId,
      items: form.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity || 0),
        mrp: Number(item.mrp || 0),
      })),
      totalPrice: Number(form.totalPrice || 0),
    }

    try {
      await apiClient.post('/order/v1', payload)
      setOpenDialog(false)
      setForm(initialForm)
      await loadOrders()
    } catch (err) {
      console.error('Failed to create order:', err)
      setError('Unable to create order.')
    }
  }

  const updateItem = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.2 }}>Operations</Typography>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Orders</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setOpenDialog(true)}>
          Add Order
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search by customer id or product id"
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
            <Typography color="text.secondary">Loading orders...</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: '#eef2ff', color: '#4338ca' }}>
                          <ShoppingCart size={18} />
                        </Box>
                        <Typography fontWeight={600}>{order.id}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{order.customerId}</TableCell>
                    <TableCell>
                      <Chip label={`${order.itemCount} items`} size="small" color="primary" />
                    </TableCell>
                    <TableCell>₹{Number(order.totalPrice || 0).toFixed(2)}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Order</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Customer ID"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            />

            {form.items.map((item, index) => (
              <Card key={index} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                  <TextField
                    fullWidth
                    label="Product ID"
                    value={item.productId}
                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                  />
                  <TextField
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  />
                  <TextField
                    label="MRP"
                    type="number"
                    value={item.mrp}
                    onChange={(e) => updateItem(index, 'mrp', e.target.value)}
                  />
                </Stack>
              </Card>
            ))}

            <Button
              variant="outlined"
              startIcon={<Plus size={16} />}
              onClick={() => setForm((prev) => ({ ...prev, items: [...prev.items, createItem()] }))}
            >
              Add Product
            </Button>

            <TextField
              label="Total Price"
              type="number"
              value={form.totalPrice}
              onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
            />
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
