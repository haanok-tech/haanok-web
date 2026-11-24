import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Chip,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react'
import apiClient from '../../../services/apiClient'

const initialForm = {
  name: '',
  code: '',
  slug: '',
  description: '',
  image: '',
  status: 'Active',
  documentCode: '',
  documentName: '',
  documentFileType: '',
  documentUrl: '',
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

const isImageFile = (fileType, url) => {
  const normalizedType = String(fileType || '').toLowerCase()
  if (normalizedType.startsWith('image/') || /^(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(normalizedType)) {
    return true
  }

  try {
    return /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(new URL(url).pathname)
  } catch {
    return false
  }
}

const normalizeCategory = (item, index) => ({
  id: item.id || `cat-${index + 1}`,
  name: item.name || 'Unnamed Category',
  code: item.code || item.id || `CAT-${index + 1}`,
  slug: item.slug || item.name?.toLowerCase().replace(/\s+/g, '-') || '',
  description: item.description || '',
  image: item.image || item.imageUrl || (isImageFile(item.documentDto?.fileType, item.documentDto?.url) ? item.documentDto.url : ''),
  documentCode: item.documentDto?.documentCode || '',
  documentName: item.documentDto?.name || '',
  documentFileType: item.documentDto?.fileType || '',
  documentUrl: item.documentDto?.url || '',
  status: item.isActive === false || item.active === false ? 'Inactive' : 'Active',
  createdAt: item.createdDate || item.createdAt || new Date().toISOString(),
  subcategoryCount: 0,
  subcategories: [],
})

const normalizeSubcategory = (item, index) => ({
  id: item.id || `sub-${index + 1}`,
  categoryId: item.categoryId || '',
  name: item.name || 'Unnamed Subcategory',
  slug: item.slug || item.name?.toLowerCase().replace(/\s+/g, '-') || '',
  description: item.description || '',
  status: item.isActive === false || item.active === false ? 'Inactive' : 'Active',
  createdAt: item.createdDate || item.createdAt || new Date().toISOString(),
})

export default function CategoryPage() {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [signedImageUrls, setSignedImageUrls] = useState({})
  const [failedImages, setFailedImages] = useState({})
  const [documentInfo, setDocumentInfo] = useState({
    documentCode: '',
    name: '',
    fileType: '',
    url: '',
  })

  const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    const key = getImageKeyFromUrl(imageUrl)
    return key ? signedImageUrls[key] || imageUrl : imageUrl
  }

  const markImageFailed = (categoryId) => {
    setFailedImages((prev) => ({ ...prev, [categoryId]: true }))
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

  useEffect(() => {
    const loadSignedImages = async () => {
      const imageEntries = categories.filter((category) => category.image).map((category) => ({
        key: getImageKeyFromUrl(category.image),
        url: category.image,
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

    if (categories.length > 0) {
      loadSignedImages()
    }
  }, [categories])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        setError('')

        const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}&page=0&size=10&sortBy=name&sortDir=asc` : '/categories'

        const [categoriesResponse, subcategoriesResponse] = await Promise.all([
          apiClient.get(query),
          apiClient.get('/subcategories'),
        ])

        const categoryList = normalizeApiList(categoriesResponse.data).map((item, index) => normalizeCategory(item, index))
        const subcategoryList = normalizeApiList(subcategoriesResponse.data).map((item, index) => normalizeSubcategory(item, index))

        const groupedSubcategories = subcategoryList.reduce((acc, item) => {
          const key = item.categoryId
          if (!acc[key]) acc[key] = []
          acc[key].push(item)
          return acc
        }, {})

        const mergedCategories = categoryList.map((category) => ({
          ...category,
          subcategories: groupedSubcategories[category.id] || [],
          subcategoryCount: groupedSubcategories[category.id]?.length || 0,
        }))

        setCategories(mergedCategories)
      } catch (err) {
        console.error('Failed to load categories:', err)
        setError('Unable to load categories from the API.')
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [search])

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const keyword = search.toLowerCase()
      const matchesSearch =
        !keyword ||
        category.name.toLowerCase().includes(keyword) ||
        category.code.toLowerCase().includes(keyword)
      const matchesStatus = statusFilter === 'All' || category.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [categories, search, statusFilter])

  const handleOpenCreate = () => {
    setEditingCategory(null)
    setForm(initialForm)
    setDocumentInfo({ documentCode: '', name: '', fileType: '', url: '' })
    setOpenDialog(true)
  }

  const handleOpenEdit = (category) => {
    setEditingCategory(category)
    setForm({
      name: category.name,
      code: category.code,
      slug: category.slug,
      description: category.description,
      image: category.image,
      status: category.status,
      documentCode: category.documentCode || '',
      documentName: category.documentName || '',
      documentFileType: category.documentFileType || '',
      documentUrl: category.documentUrl || '',
    })
    setDocumentInfo({
      documentCode: category.documentCode || '',
      name: category.documentName || '',
      fileType: category.documentFileType || '',
      url: category.documentUrl || '',
    })
    setOpenDialog(true)
  }

  const handleDelete = (id) => {
    setCategories((prev) => prev.filter((category) => category.id !== id))
  }

  const handlePreviewImage = async (imageUrl) => {
    const key = getImageKeyFromUrl(imageUrl)

    if (!imageUrl) return

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

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingDocument(true)
      setError('')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name || 'category-document')
      formData.append('fileType', file.type || 'application/pdf')
      formData.append('module', 'CATEGORY')
      formData.append('referenceId', editingCategory?.id || 'new-category-document')
      formData.append('tag', 'category-document')
      formData.append(
        'metadata',
        JSON.stringify({
          source: 'frontend',
          uploadedAt: new Date().toISOString(),
        }),
      )

      const response = await apiClient.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const payload = response?.data?.payload || response?.data || {}
      const nextDocument = buildDocumentInfoFromUpload(payload, file)

      setDocumentInfo(nextDocument)
      setForm((prev) => ({
        ...prev,
        documentCode: nextDocument.documentCode,
        documentName: nextDocument.name,
        documentFileType: nextDocument.fileType,
        documentUrl: nextDocument.url,
      }))
    } catch (err) {
      console.error('Document upload failed:', err)
      setError('Unable to upload document. Please try again.')
    } finally {
      setUploadingDocument(false)
      event.target.value = ''
    }
  }

  const getDocumentFileType = (fileType) => {
    if (!fileType) return 'PDF'
    const normalized = String(fileType).split('/').pop() || fileType
    return normalized.toUpperCase()
  }

  const buildDocumentInfoFromUpload = (payload, fallbackFile) => {
    const uploadPayload = payload || {}
    const uploadedUrl = uploadPayload.url || uploadPayload.fileUrl || uploadPayload.signedUrl || ''
    const uploadedKey = uploadPayload.key || uploadPayload.documentCode || uploadPayload.fileKey || `DOC-${Date.now()}`
    const uploadedFileName = uploadPayload.finalName || uploadPayload.name || fallbackFile?.name || 'Uploaded Document'
    const uploadedFileType = getDocumentFileType(uploadPayload.fileType || fallbackFile?.type || 'application/pdf')

    return {
      documentCode: uploadedKey,
      name: uploadedFileName,
      fileType: uploadedFileType,
      url: uploadedUrl,
    }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.code) return

    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      description: form.description,
      parentId: null,
      level: 1,
      imageUrl: form.image || null,
      isActive: form.status === 'Active',
      displayOrder: 1,
      documentDto: {
        documentCode: form.documentCode || documentInfo.documentCode || `DOC-${Date.now()}`,
        name: form.documentName || documentInfo.name || 'Uploaded Document',
        fileType: form.documentFileType || documentInfo.fileType || 'PDF',
        url: form.documentUrl || documentInfo.url || '',
      },
    }

    try {
      if (editingCategory) {
        const response = await apiClient.put(`/categories/${editingCategory.id}`, payload)
        const updatedItem = response.data || { ...editingCategory, ...payload }

        setCategories((prev) =>
          prev.map((category) =>
            category.id === editingCategory.id
              ? {
                  ...category,
                  ...normalizeCategory(updatedItem, 0),
                  status: updatedItem.isActive === false || updatedItem.active === false ? 'Inactive' : 'Active',
                }
              : category,
          ),
        )
      } else {
        const response = await apiClient.post('/categories', payload)
        const createdItem = response.data || { ...payload, id: `cat-${Date.now()}` }
        setCategories((prev) => [{
          ...normalizeCategory(createdItem, 0),
          subcategoryCount: 0,
          subcategories: [],
        }, ...prev])
      }

      setOpenDialog(false)
      setForm(initialForm)
    } catch (err) {
      console.error('Failed to save category:', err)
      setError('Unable to save category to the API.')
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.2 }}>Catalog</Typography>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Categories</Typography>
        </Box>

        <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleOpenCreate}>
          Add Category
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3, borderRadius: 4, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search by category name or code"
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
            <Typography color="text.secondary">Loading categories...</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Subcategories</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell sx={{ width: 120 }}>
                      {failedImages[category.id] ? (
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
                          {category.name?.charAt(0)?.toUpperCase() || 'C'}
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
                            background: category.image
                              ? '#f8fafc'
                              : 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(34,197,94,0.08))',
                            boxShadow: category.image ? '0 8px 18px rgba(15,23,42,0.06)' : 'none',
                            cursor: category.image ? 'pointer' : 'default',
                          }}
                          onClick={() => category.image && handlePreviewImage(category.image)}
                        >
                          {category.image ? (
                            <Box
                              component="img"
                              src={resolveImageUrl(category.image)}
                              alt={category.name}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                              onError={() => markImageFailed(category.id)}
                            />
                          ) : (
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#475569' }}>
                              {category.name?.charAt(0)?.toUpperCase() || 'C'}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.code}</TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell sx={{ maxWidth: 230 }}>{category.description}</TableCell>
                    <TableCell>
                      <Chip label={category.status} color={category.status === 'Active' ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>{category.subcategoryCount || 0}</TableCell>
                    <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(category)}>
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton size="small" color="secondary" onClick={() => category.image && handlePreviewImage(category.image)}>
                          <Eye size={16} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(category.id)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Edit category' : 'Add category'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Category Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Category Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <TextField label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <TextField label="Description" multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <Box>
              <Button
                variant="outlined"
                component="label"
                sx={{ width: '100%', py: 1.5 }}
                disabled={uploadingDocument}
              >
                {uploadingDocument ? 'Uploading...' : 'Upload Document'}
                <input hidden accept=".pdf,application/pdf" type="file" onChange={handleDocumentUpload} />
              </Button>

              {(form.documentName || form.documentUrl) && (
                <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, border: '1px solid rgba(148,163,184,0.3)', background: '#f8fafc' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', overflowWrap: 'anywhere' }}>
                      {form.documentName || form.documentCode || 'Attached file'}
                    </Typography>
                    {form.documentUrl && (
                      <Button size="small" variant="text" onClick={() => handlePreviewImage(form.documentUrl)}>
                        View
                      </Button>
                    )}
                  </Box>
                  {form.documentUrl && isImageFile(form.documentFileType, form.documentUrl) && (
                    <Box
                      component="img"
                      src={form.documentUrl}
                      alt={form.documentName || 'Category image'}
                      sx={{ display: 'block', mt: 1.5, maxWidth: '100%', maxHeight: 200, objectFit: 'contain', cursor: 'pointer' }}
                      onClick={() => handlePreviewImage(form.documentUrl)}
                    />
                  )}
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
          <Button variant="contained" onClick={handleSubmit}>{editingCategory ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
