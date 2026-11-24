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
  IconButton,
} from '@mui/material'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import apiClient from '../../../services/apiClient'

const initialForm = {
  name: '',
  productCode: '',
  description: '',
  sku: '',
  hsnNumber: '',
  eanNumber: '',
  categoryId: '',
  subCategoryId: '',
  warehouseId: '',
  businessCityId: '',
  price: '',
  productStatus: 'CREATED',
  length: '15',
  lengthUnit: 'cm',
  width: '7.5',
  widthUnit: 'cm',
  height: '0.8',
  heightUnit: 'cm',
  volume: '90',
  volumeUnit: 'cm³',
  unitWeight: '0.2',
  unitWeightType: 'kg',
  imageUrl: '',
  imageKey: '',
  imageName: '',
}

const getImageKeyFromUrl = (url) => {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    return decodeURIComponent(parsed.pathname.split('/').pop() || '')
  } catch {
    return url
  }
}

const fetchSignedImageUrl = async (key) => {
  if (!key) return ''

  try {
    const response = await apiClient.get('/api/files/document', {
      params: { key, expiration: 3600 },
    })

    return response?.data?.payload || response?.data?.url || response?.data?.signedUrl || ''
  } catch (err) {
    console.error('Failed to resolve signed document URL:', err)
    return ''
  }
}

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.content)) return payload.content
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && Array.isArray(payload.items)) return payload.items
  if (payload && Array.isArray(payload.value)) return payload.value
  return []
}

const normalizeCategory = (item) => ({
  id: item.id || item.categoryId || item.slug || item.name,
  name: item.name || 'Unnamed Category',
})

const normalizeSubcategory = (item) => ({
  id: item.id || item.subCategoryId || item.slug || item.name,
  categoryId: item.categoryId || item.parentId || '',
  name: item.name || 'Unnamed Subcategory',
})

const normalizeWarehouse = (item) => ({
  id: item.id || item.warehouseId || item.warehouseCode || item.name,
  name: item.warehouseName || item.name || 'Unnamed Warehouse',
  businessCityId: item.businessCityId || '',
})

const normalizeProduct = (item, index) => ({
  id: item.id || item.productId || `prod-${index + 1}`,
  name: item.name || 'Unnamed Product',
  productCode: item.productCode || item.code || '',
  description: item.description || '',
  sku: item.sku || '',
  hsnNumber: item.hsnNumber || '',
  eanNumber: item.eanNumber || '',
  categoryId: item.categoryId || '',
  categoryName: item.category || item.categoryName || 'Uncategorized',
  subCategoryId: item.subCategoryId || '',
  warehouseId: item.warehouseId || '',
  businessCityId: item.businessCityId || '',
  price: Number(item.price ?? item.sellingPrice ?? 0),
  productStatus: item.productStatus || item.status || 'CREATED',
  stock: Number(item.stock ?? 0),
  imageUrl: item.imageUrl || item.image || '',
  createdAt: item.createdDate || item.createdAt || new Date().toISOString(),
})

const getProductListFromResponse = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.content)) return payload.content
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && Array.isArray(payload.items)) return payload.items
  if (payload && Array.isArray(payload.value)) return payload.value
  if (payload && Array.isArray(payload.products)) return payload.products
  return []
}

export default function ProductPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialForm)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [signedImageUrls, setSignedImageUrls] = useState({})
  const [failedImages, setFailedImages] = useState({})

  const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    const key = getImageKeyFromUrl(imageUrl)
    return key ? signedImageUrls[key] || imageUrl : imageUrl
  }

  const markImageFailed = (productId) => {
    setFailedImages((prev) => ({ ...prev, [productId]: true }))
  }

  const handlePreviewImage = async (imageUrl) => {
    if (!imageUrl) return
    const key = getImageKeyFromUrl(imageUrl)

    try {
      if (key && !imageUrl.includes('?')) {
        const signedUrl = await fetchSignedImageUrl(key)
        if (signedUrl) {
          window.open(signedUrl, '_blank', 'noopener,noreferrer')
          return
        }
      }
      window.open(imageUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('Failed to fetch presigned URL:', err)
      window.open(imageUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      setError('')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name || 'product-image')
      formData.append('fileType', file.type || 'image/png')
      formData.append('module', 'PRODUCT')
      formData.append('referenceId', form.id || 'new-product')
      formData.append('tag', 'product-image')
      formData.append(
        'metadata',
        JSON.stringify({
          source: 'frontend',
          uploadedAt: new Date().toISOString(),
        }),
      )

      const response = await apiClient.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const payload = response?.data?.payload || {}
      const uploadedImageUrl = payload.url || ''
      const uploadedImageKey = payload.key || getImageKeyFromUrl(uploadedImageUrl)

      setForm((prev) => ({
        ...prev,
        imageUrl: uploadedImageUrl,
        imageKey: uploadedImageKey,
        imageName: payload.finalName || file.name,
      }))
    } catch (err) {
      console.error('File upload failed:', err)
      setError('Unable to upload product image. Please try again.')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  useEffect(() => {
    const loadSignedImages = async () => {
      const imageEntries = products.filter((product) => product.imageUrl).map((product) => ({
        key: getImageKeyFromUrl(product.imageUrl),
        url: product.imageUrl,
        id: product.id,
      }))

      const uniqueImages = imageEntries.filter((entry, index, arr) => entry.key && arr.findIndex((item) => item.key === entry.key) === index)

      for (const image of uniqueImages) {
        if (!image.key || image.url.includes('?')) continue
        const signedUrl = await fetchSignedImageUrl(image.key)
        if (signedUrl) {
          setSignedImageUrls((prev) => ({ ...prev, [image.key]: signedUrl }))
        }
      }
    }

    if (products.length > 0) {
      loadSignedImages()
    }
  }, [products])

  useEffect(() => {
    setFailedImages((prev) => {
      const next = { ...prev }

      products.forEach((product) => {
        const key = getImageKeyFromUrl(product.imageUrl)
        if (key && signedImageUrls[key]) {
          delete next[product.id]
        }
      })

      return next
    })
  }, [products, signedImageUrls])

  const loadProducts = async (keyword = '') => {
    try {
      setLoading(true)
      setError('')

      const q = keyword.trim()
      const url = q
        ? `/product/v1/search?page=0&size=20&sortBy=name&sortDir=asc&q=${encodeURIComponent(q)}`
        : '/product/v1/search?page=0&size=20&sortBy=name&sortDir=asc'

      const response = await apiClient.get(url)
      const rawList = getProductListFromResponse(response?.data)
      const list = rawList.length > 0 ? rawList.map((item, index) => normalizeProduct(item, index)) : []
      setProducts(list)
    } catch (err) {
      console.error('Failed to load products:', err)
      setError('Unable to load products from the API.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [categoriesResponse, subcategoriesResponse, warehousesResponse] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/subcategories'),
          apiClient.get('/api/warehouses'),
        ])

        const categoryList = normalizeApiList(categoriesResponse.data).map(normalizeCategory)
        const subcategoryList = normalizeApiList(subcategoriesResponse.data).map(normalizeSubcategory)
        const warehouseList = normalizeApiList(warehousesResponse.data).map(normalizeWarehouse)

        setCategories(categoryList)
        setSubcategories(subcategoryList)
        setWarehouses(warehouseList)
      } catch (err) {
        console.error('Failed to load catalog metadata:', err)
      }
    }

    loadCatalog()
  }, [])

  useEffect(() => {
    loadProducts(search)
  }, [search])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keyword = search.toLowerCase()
      const matchesSearch =
        !keyword ||
        (product.name || '').toLowerCase().includes(keyword) ||
        (product.productCode || '').toLowerCase().includes(keyword) ||
        (product.sku || '').toLowerCase().includes(keyword)
      const matchesStatus = statusFilter === 'All' || (product.productStatus || '').toUpperCase() === statusFilter.toUpperCase()
      return matchesSearch && matchesStatus
    })
  }, [products, search, statusFilter])

  const activeSubcategories = subcategories.filter((item) => item.categoryId === form.categoryId)

  const handleOpenCreate = () => {
    setEditingProduct(null)
    setForm({
      ...initialForm,
      categoryId: categories[0]?.id || '',
      warehouseId: warehouses[0]?.id || '',
      businessCityId: warehouses[0]?.businessCityId || '',
    })
    setOpenDialog(true)
  }

  const handleOpenEdit = (product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      productCode: product.productCode,
      description: product.description,
      sku: product.sku,
      hsnNumber: product.hsnNumber,
      eanNumber: product.eanNumber,
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId,
      warehouseId: product.warehouseId,
      businessCityId: product.businessCityId,
      price: String(product.price),
      productStatus: product.productStatus,
      length: String(product.length || 15),
      lengthUnit: 'cm',
      width: String(product.width || 7.5),
      widthUnit: 'cm',
      height: String(product.height || 0.8),
      heightUnit: 'cm',
      volume: String(product.volume || 90),
      volumeUnit: 'cm³',
      unitWeight: String(product.unitWeight || 0.2),
      unitWeightType: 'kg',
      imageUrl: product.imageUrl,
    })
    setOpenDialog(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.productCode || !form.categoryId || !form.subCategoryId || !form.warehouseId) return

    const selectedCategory = categories.find((item) => item.id === form.categoryId)
    const selectedWarehouse = warehouses.find((item) => item.id === form.warehouseId)

    const payload = {
      productCode: form.productCode,
      description: form.description,
      category: selectedCategory?.name || '',
      name: form.name,
      sku: form.sku || form.productCode,
      hsnNumber: form.hsnNumber,
      eanNumber: form.eanNumber,
      price: Number(form.price || 0),
      productStatus: form.productStatus,
      length: Number(form.length || 0),
      lengthUnit: form.lengthUnit,
      width: Number(form.width || 0),
      widthUnit: form.widthUnit,
      height: Number(form.height || 0),
      heightUnit: form.heightUnit,
      volume: Number(form.volume || 0),
      volumeUnit: form.volumeUnit,
      unitWeight: Number(form.unitWeight || 0),
      unitWeightType: form.unitWeightType,
      imageUrl: form.imageUrl,
      warehouseId: form.warehouseId,
      businessCityId: form.businessCityId || selectedWarehouse?.businessCityId || '',
      categoryId: form.categoryId,
      subCategoryId: form.subCategoryId,
      documentDto: {
        documentCode: 'DOC123',
        name: 'Sample Document',
        fileType: 'PDF',
        url: 'http://example.com/document.pdf',
      },
    }

    try {
      if (editingProduct) {
        await apiClient.put(`/product/v1/${editingProduct.id}`, payload)
      } else {
        await apiClient.post('/product/v1', payload)
      }

      setOpenDialog(false)
      setForm(initialForm)
      await loadProducts(search)
    } catch (err) {
      console.error('Failed to save product:', err)
      setError('Unable to save product to the API.')
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.2 }}>Catalog</Typography>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Products</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleOpenCreate}>Add Product</Button>
      </Box>

      <Card sx={{ p: 2, mb: 3, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search by product name, code, or SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.65 }} /> }}
          />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="CREATED">Created</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.2)' }}>
        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={22} />
            <Typography color="text.secondary">Loading products...</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 920 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell>Image</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell sx={{ width: 120 }}>
                        {failedImages[product.id] ? (
                          <Box
                            sx={{
                              width: 72,
                              height: 72,
                              borderRadius: 3,
                              display: 'grid',
                              placeItems: 'center',
                              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(34,197,94,0.08))',
                              border: '1px solid rgba(148,163,184,0.28)',
                              color: '#475569',
                              fontWeight: 800,
                              fontSize: 22,
                            }}
                          >
                            {product.name?.charAt(0)?.toUpperCase() || 'P'}
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              width: 72,
                              height: 72,
                              borderRadius: 3,
                              overflow: 'hidden',
                              display: 'grid',
                              placeItems: 'center',
                              border: '1px solid rgba(148,163,184,0.28)',
                              background: product.imageUrl ? '#f8fafc' : 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(34,197,94,0.08))',
                              boxShadow: product.imageUrl ? '0 8px 18px rgba(15,23,42,0.06)' : 'none',
                              cursor: product.imageUrl ? 'pointer' : 'default',
                            }}
                            onClick={() => product.imageUrl && handlePreviewImage(product.imageUrl)}
                          >
                            {product.imageUrl ? (
                              <Box
                                component="img"
                                src={resolveImageUrl(product.imageUrl)}
                                alt={product.name}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                onError={() => markImageFailed(product.id)}
                              />
                            ) : (
                              <Typography variant="h6" sx={{ fontWeight: 800, color: '#475569' }}>
                                {product.name?.charAt(0)?.toUpperCase() || 'P'}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.productCode}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.categoryName}</TableCell>
                      <TableCell>{warehouses.find((item) => item.id === product.warehouseId)?.name || '-'}</TableCell>
                      <TableCell>₹{Number(product.price || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={product.productStatus}
                          color={product.productStatus === 'ACTIVE' ? 'success' : product.productStatus === 'CREATED' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(product)}>
                            <Pencil size={16} />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => {}}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit product' : 'Add product'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField fullWidth label="Product Code" value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })} />
            </Stack>

            <TextField label="Description" multiline minRows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              <TextField fullWidth label="HSN Number" value={form.hsnNumber} onChange={(e) => setForm({ ...form, hsnNumber: e.target.value })} />
              <TextField fullWidth label="EAN Number" value={form.eanNumber} onChange={(e) => setForm({ ...form, eanNumber: e.target.value })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value, subCategoryId: '' })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Subcategory</InputLabel>
                <Select
                  label="Subcategory"
                  value={form.subCategoryId}
                  onChange={(e) => setForm({ ...form, subCategoryId: e.target.value })}
                >
                  {activeSubcategories.map((subcategory) => (
                    <MenuItem key={subcategory.id} value={subcategory.id}>{subcategory.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={form.productStatus} onChange={(e) => setForm({ ...form, productStatus: e.target.value })}>
                  <MenuItem value="CREATED">CREATED</MenuItem>
                  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                  <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Warehouse</InputLabel>
              <Select
                label="Warehouse"
                value={form.warehouseId}
                onChange={(e) => {
                  const selected = warehouses.find((item) => item.id === e.target.value)
                  setForm({
                    ...form,
                    warehouseId: e.target.value,
                    businessCityId: selected?.businessCityId || '',
                  })
                }}
              >
                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField label="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />

            <Box>
              <Button
                variant="outlined"
                component="label"
                sx={{ width: '100%', py: 1.5 }}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
                <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
              </Button>

              {form.imageName && (
                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, p: 1.5, borderRadius: 2, border: '1px solid rgba(148,163,184,0.3)', background: '#f8fafc' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {form.imageName}
                  </Typography>
                  {form.imageUrl && (
                    <Button size="small" variant="text" onClick={() => handlePreviewImage(form.imageUrl)}>
                      View
                    </Button>
                  )}
                </Box>
              )}

              {form.imageUrl && (
                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    component="img"
                    src={resolveImageUrl(form.imageUrl)}
                    alt={form.imageName || 'Uploaded preview'}
                    sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 2, cursor: 'pointer', border: '1px solid rgba(148,163,184,0.4)' }}
                    onClick={() => handlePreviewImage(form.imageUrl)}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Click the image to open the signed file URL.
                  </Typography>
                </Box>
              )}
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Length" type="number" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} />
              <TextField fullWidth label="Length Unit" value={form.lengthUnit} onChange={(e) => setForm({ ...form, lengthUnit: e.target.value })} />
              <TextField fullWidth label="Width" type="number" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
              <TextField fullWidth label="Width Unit" value={form.widthUnit} onChange={(e) => setForm({ ...form, widthUnit: e.target.value })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Height" type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
              <TextField fullWidth label="Height Unit" value={form.heightUnit} onChange={(e) => setForm({ ...form, heightUnit: e.target.value })} />
              <TextField fullWidth label="Volume" type="number" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
              <TextField fullWidth label="Volume Unit" value={form.volumeUnit} onChange={(e) => setForm({ ...form, volumeUnit: e.target.value })} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Unit Weight" type="number" value={form.unitWeight} onChange={(e) => setForm({ ...form, unitWeight: e.target.value })} />
              <TextField fullWidth label="Unit Weight Type" value={form.unitWeightType} onChange={(e) => setForm({ ...form, unitWeightType: e.target.value })} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editingProduct ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
