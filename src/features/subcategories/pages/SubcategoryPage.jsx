import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Chip,
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
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import apiClient from '../../../services/apiClient'

const initialForm = {
  categoryId: '',
  name: '',
  code: '',
  slug: '',
  description: '',
  image: '',
  imageName: '',
  status: 'Active',
}

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.value)) return payload.value
  if (payload && Array.isArray(payload.items)) return payload.items
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && Array.isArray(payload.content)) return payload.content
  return []
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

const normalizeCategory = (item, index) => ({
  id: item.id || item.categoryId || `cat-${index + 1}`,
  name: item.name || 'Unnamed Category',
  code: item.code || item.slug || `CAT-${index + 1}`,
})

const normalizeSubcategory = (item, index) => {
  const category = item.category || {}
  const statusValue = item.status || (item.isActive === false || item.active === false ? 'Inactive' : 'Active')

  return {
    id: item.id || `sub-${index + 1}`,
    categoryId: item.categoryId || category.id || '',
    categoryName: item.categoryName || category.name || 'Uncategorized',
    name: item.name || 'Unnamed',
    code: item.code || item.slug || `SUB-${index + 1}`,
    slug: item.slug || item.name?.toLowerCase().replace(/\s+/g, '-') || '',
    description: item.description || '',
    image: item.image || item.imageUrl || '',
    status: statusValue === 'Inactive' || statusValue === false ? 'Inactive' : 'Active',
    createdAt: item.createdDate || item.createdAt || new Date().toISOString(),
  }
}

export default function SubcategoryPage() {
  const [subcategories, setSubcategories] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [signedImageUrls, setSignedImageUrls] = useState({})
  const [failedImages, setFailedImages] = useState({})

  const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    const key = getImageKeyFromUrl(imageUrl)
    return key ? signedImageUrls[key] || imageUrl : imageUrl
  }

  const markImageFailed = (subcategoryId) => {
    setFailedImages((prev) => ({ ...prev, [subcategoryId]: true }))
  }

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiClient.get('/categories')
        const categoryList = normalizeApiList(response?.data).map((item, index) => normalizeCategory(item, index))
        setCategories(categoryList)

        if (!form.categoryId && categoryList.length > 0) {
          setForm((prev) => ({ ...prev, categoryId: categoryList[0].id }))
        }
      } catch (err) {
        console.error('Failed to load categories for dropdown:', err)
      }
    }

    const loadSubcategories = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await apiClient.get('/subcategories')
        const data = response?.data
        const payload = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.content)
                ? data.content
                : Array.isArray(data?.result)
                  ? data.result
                  : []

        const items = payload.map((item, index) => normalizeSubcategory(item, index))
        setSubcategories(items)
      } catch (err) {
        console.error('Failed to load subcategories:', err)
        setError('Unable to load subcategories from the API.')
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
    loadSubcategories()
  }, [])

  useEffect(() => {
    const loadSignedImages = async () => {
      const imageEntries = subcategories
        .filter((subcategory) => subcategory.image)
        .map((subcategory) => ({
          key: getImageKeyFromUrl(subcategory.image),
          url: subcategory.image,
          id: subcategory.id,
        }))

      const uniqueImages = imageEntries.filter(
        (entry, index, arr) => entry.key && arr.findIndex((item) => item.key === entry.key) === index,
      )

      for (const image of uniqueImages) {
        if (!image.key || image.url.includes('?')) continue
        const signedUrl = await fetchSignedImageUrl(image.key)
        if (signedUrl) {
          setSignedImageUrls((prev) => ({ ...prev, [image.key]: signedUrl }))
        }
      }
    }

    if (subcategories.length > 0) {
      loadSignedImages()
    }
  }, [subcategories])

  const categoryNameMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category.name
      return acc
    }, {})
  }, [categories])

  const normalizedSubcategories = useMemo(() => {
    return subcategories.map((subcategory) => ({
      ...subcategory,
      categoryName: categoryNameMap[subcategory.categoryId] || subcategory.categoryName || 'Uncategorized',
    }))
  }, [subcategories, categoryNameMap])

  const filteredSubcategories = useMemo(() => {
    return normalizedSubcategories.filter((subcategory) => {
      const keyword = search.toLowerCase()
      const matchesSearch =
        !keyword ||
        subcategory.name.toLowerCase().includes(keyword) ||
        subcategory.code.toLowerCase().includes(keyword) ||
        (subcategory.categoryName || '').toLowerCase().includes(keyword)
      const matchesStatus = statusFilter === 'All' || subcategory.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter, normalizedSubcategories])

  const handleOpenCreate = () => {
    setEditingSubcategory(null)
    setForm({
      ...initialForm,
      categoryId: categories[0]?.id || '',
    })
    setOpenDialog(true)
  }

  const handleOpenEdit = (subcategory) => {
    setEditingSubcategory(subcategory)
    setForm({
      categoryId: subcategory.categoryId,
      name: subcategory.name,
      code: subcategory.code,
      slug: subcategory.slug,
      description: subcategory.description,
      image: subcategory.image,
      imageName: subcategory.image ? getImageKeyFromUrl(subcategory.image) : '',
      status: subcategory.status,
    })
    setOpenDialog(true)
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
      formData.append('name', file.name || 'subcategory-image')
      formData.append('fileType', file.type || 'image/png')
      formData.append('module', 'SUBCATEGORY')
      formData.append('referenceId', editingSubcategory?.id || 'new-subcategory')
      formData.append('tag', 'subcategory-image')
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
        image: uploadedImageUrl,
        imageName: payload.finalName || file.name,
      }))

      if (uploadedImageKey) {
        setForm((prev) => ({ ...prev, image: uploadedImageUrl }))
      }
    } catch (err) {
      console.error('File upload failed:', err)
      setError('Unable to upload subcategory image. Please try again.')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleSubmit = () => {
    if (!form.categoryId || !form.name.trim()) return

    const normalizedName = form.name.trim()
    const generatedCode = (form.code || '').trim() || `SUB-${Date.now().toString().slice(-6)}`
    const generatedSlug = (form.slug || '').trim() || normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    const categoryName = categories.find((cat) => cat.id === form.categoryId)?.name || 'Unknown'
    const payload = {
      categoryId: form.categoryId,
      name: normalizedName,
      code: generatedCode,
      slug: generatedSlug,
      description: form.description,
      imageUrl: form.image,
      isActive: form.status === 'Active',
      displayOrder: 1,
      documentDto: {
        documentCode: 'DOC123',
        name: 'Sample Document',
        fileType: 'PDF',
        url: 'http://example.com/document.pdf',
      },
    }

    if (editingSubcategory) {
      setSubcategories((prev) =>
        prev.map((item) =>
          item.id === editingSubcategory.id
            ? { ...item, ...payload, categoryName, slug: payload.slug }
            : item,
        ),
      )
    } else {
      setSubcategories((prev) => [
        {
          id: `sub-${Date.now()}`,
          ...payload,
          categoryName,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
    }

    setOpenDialog(false)
    setForm(initialForm)
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.2 }}>Catalog</Typography>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Subcategories</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleOpenCreate}>Add Subcategory</Button>
      </Box>

      <Card sx={{ p: 2, mb: 3, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search by subcategory name or code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.65 }} /> }}
          />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
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
            <Typography color="text.secondary">Loading subcategories...</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubcategories.length > 0 ? (
                filteredSubcategories.map((subcategory) => (
                  <TableRow key={subcategory.id} hover>
                    <TableCell>
                      <Avatar
                        src={failedImages[subcategory.id] ? '' : resolveImageUrl(subcategory.image)}
                        alt={subcategory.name}
                        variant="rounded"
                        sx={{ width: 42, height: 42 }}
                        onError={() => markImageFailed(subcategory.id)}
                      />
                    </TableCell>
                    <TableCell>{subcategory.name}</TableCell>
                    <TableCell>{subcategory.categoryName}</TableCell>
                    <TableCell>{subcategory.slug}</TableCell>
                    <TableCell>
                      <Chip label={subcategory.status} color={subcategory.status === 'Active' ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>{new Date(subcategory.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(subcategory)}>
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
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No subcategories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSubcategory ? 'Edit subcategory' : 'Add subcategory'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <TextField label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <TextField label="Description" multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

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
                  {form.image && (
                    <Button size="small" variant="text" onClick={() => handlePreviewImage(form.image)}>
                      View
                    </Button>
                  )}
                </Box>
              )}

              {form.image && (
                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src={failedImages[form.imageName] ? '' : resolveImageUrl(form.image)}
                    alt={form.imageName || 'Uploaded preview'}
                    variant="rounded"
                    sx={{ width: 72, height: 72, cursor: 'pointer', border: '1px solid rgba(148,163,184,0.4)' }}
                    onClick={() => handlePreviewImage(form.image)}
                    onError={() => markImageFailed(form.imageName || 'upload-preview')}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Click the image to open the signed file URL.
                  </Typography>
                </Box>
              )}
            </Box>

            <FormControl>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editingSubcategory ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
