import { useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Paper,
  Stack,
  Divider,
  LinearProgress,
  Avatar,
} from '@mui/material'
import {
  ArrowUpRight,
  Package,
  Tags,
  Boxes,
  CircleDollarSign,
  TrendingUp,
  Sparkles,
  Target,
  Activity,
  ShoppingBag,
} from 'lucide-react'
import { mockCategories, mockProducts } from '../../../services/mockData'

const summaryCards = [
  { label: 'Total Categories', value: mockCategories.length, chip: '+12%', icon: Tags, accent: '#8b5cf6' },
  { label: 'Subcategories', value: '18', chip: '+5%', icon: Boxes, accent: '#14b8a6' },
  { label: 'Products', value: mockProducts.length, chip: '+8%', icon: Package, accent: '#f59e0b' },
  { label: 'Revenue', value: '$84.2K', chip: '12.4%', icon: CircleDollarSign, accent: '#22c55e' },
]

const channelPerformance = [
  { label: 'Website', value: '64%', color: '#8b5cf6', progress: 64 },
  { label: 'Marketplace', value: '48%', color: '#14b8a6', progress: 48 },
  { label: 'Mobile App', value: '72%', color: '#f59e0b', progress: 72 },
]

export default function DashboardPage() {
  const recentProducts = useMemo(() => mockProducts.slice(0, 4), [])
  const topCategory = mockCategories[0]

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '1.7fr 0.9fr' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.96) 0%, rgba(79,70,229,0.9) 36%, rgba(15,23,42,0.96) 100%)',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(91, 33, 182, 0.35)',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at top right, rgba(255,255,255,0.16), transparent 28%), radial-gradient(circle at bottom left, rgba(34,197,94,0.2), transparent 30%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Box>
                <Chip
                  icon={<Sparkles size={14} />}
                  label="Sales pulse"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.12)',
                    fontWeight: 700,
                    mb: 1.5,
                  }}
                />
                <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.06em' }}>
                  Welcome back, Sandeep
                </Typography>
              </Box>
              <Button
                variant="contained"
                endIcon={<ArrowUpRight size={16} />}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.14)',
                  boxShadow: 'none',
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                }}
              >
                Export report
              </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mt: 2 }}>
              <Box sx={{ p: 2.3, borderRadius: 3, bgcolor: 'rgba(15,23,42,0.22)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', letterSpacing: 1.3 }}>
                  Revenue this month
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 800, mt: 1, letterSpacing: '-0.06em' }}>$84.2K</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                  <TrendingUp size={16} color="#86efac" />
                  <Typography variant="body2" sx={{ color: '#d1fae5', fontWeight: 700 }}>+18.4% vs last month</Typography>
                </Box>
              </Box>

              <Box sx={{ p: 2.3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', letterSpacing: 1.3 }}>
                  Conversion rate
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 800, mt: 1, letterSpacing: '-0.06em' }}>7.8%</Typography>
                <Box sx={{ mt: 1.5 }}>
                  <LinearProgress variant="determinate" value={78} sx={{ height: 8, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#86efac' } }} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(10px)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Channel performance</Typography>
            <Avatar sx={{ width: 34, height: 34, background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', fontSize: 14 }}>AI</Avatar>
          </Box>

          <Stack spacing={2.2}>
            {channelPerformance.map((channel) => (
              <Box key={channel.label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{channel.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>{channel.value}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={channel.progress}
                  sx={{
                    height: 9,
                    borderRadius: 999,
                    bgcolor: 'rgba(148,163,184,0.15)',
                    '& .MuiLinearProgress-bar': { background: channel.color, borderRadius: 999 },
                  }}
                />
              </Box>
            ))}
          </Stack>

          <Box sx={{ mt: 3, p: 2, borderRadius: 3, background: 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(59,130,246,0.08))', border: '1px solid rgba(20,184,166,0.2)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1.2 }}>Top category</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>{topCategory?.name || 'Electronics'}</Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: 2, background: 'rgba(20,184,166,0.12)', color: '#0f766e' }}>
                <Target size={18} />
              </Box>
            </Box>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              Highest performing segment with steady growth across the last 30 days.
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 2.5,
        }}
      >
        {summaryCards.map(({ label, value, chip, icon: Icon, accent }) => (
          <Card key={label} elevation={0} sx={{ borderRadius: 3.5, border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.7)', overflow: 'hidden' }}>
            <CardContent sx={{ p: 2.2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1.1, borderRadius: 2.5, background: `${accent}18`, color: accent, display: 'grid', placeItems: 'center' }}>
                  <Icon size={18} />
                </Box>
                <Chip label={chip} size="small" sx={{ bgcolor: `${accent}18`, color: accent, fontWeight: 700, borderRadius: 1.5 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.2 }}>{value}</Typography>
              <Typography variant="body2" sx={{ mt: 0.8, color: 'text.secondary' }}>{label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.8fr) minmax(280px, 0.9fr)' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.8)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.4 }}>Inventory</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Recent products</Typography>
            </Box>
            <Button variant="text" sx={{ color: '#4f46e5', fontWeight: 700 }}>View all</Button>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <Box component="thead">
                <Box component="tr" sx={{ textAlign: 'left' }}>
                  <Box component="th" sx={{ p: 1.5, color: 'text.secondary', fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Product</Box>
                  <Box component="th" sx={{ p: 1.5, color: 'text.secondary', fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</Box>
                  <Box component="th" sx={{ p: 1.5, color: 'text.secondary', fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</Box>
                  <Box component="th" sx={{ p: 1.5, color: 'text.secondary', fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Stock</Box>
                  <Box component="th" sx={{ p: 1.5, color: 'text.secondary', fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</Box>
                </Box>
              </Box>
              <Box component="tbody">
                {recentProducts.map((product) => (
                  <Box component="tr" key={product.id} sx={{ borderTop: '1px solid rgba(148,163,184,0.2)', '&:hover': { background: 'rgba(148,163,184,0.04)' } }}>
                    <Box component="td" sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box component="img" src={product.image} sx={{ width: 44, height: 44, borderRadius: 2.5, objectFit: 'cover', border: '1px solid rgba(148,163,184,0.22)' }} />
                        <Box>
                          <Typography sx={{ fontWeight: 700 }}>{product.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{product.sku}</Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box component="td" sx={{ p: 1.5, color: 'text.secondary', fontWeight: 500 }}>{product.categoryName}</Box>
                    <Box component="td" sx={{ p: 1.5, fontWeight: 700 }}>${product.sellingPrice}</Box>
                    <Box component="td" sx={{ p: 1.5, fontWeight: 600 }}>{product.stock}</Box>
                    <Box component="td" sx={{ p: 1.5 }}>
                      <Chip
                        label={product.status}
                        size="small"
                        sx={{
                          bgcolor: product.status === 'Active' ? 'rgba(34,197,94,0.12)' : product.status === 'Low Stock' ? 'rgba(245,158,11,0.14)' : 'rgba(239,68,68,0.12)',
                          color: product.status === 'Active' ? '#15803d' : product.status === 'Low Stock' ? '#b45309' : '#b91c1c',
                          fontWeight: 700,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.8)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Quick actions</Typography>
            <Box sx={{ p: 1, borderRadius: 2, background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}>
              <ShoppingBag size={16} />
            </Box>
          </Box>

          <Stack spacing={1.5}>
            <Button variant="contained" sx={{ justifyContent: 'space-between', borderRadius: 2.5, py: 1.4, px: 1.8, background: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)', boxShadow: '0 12px 30px rgba(124,58,237,0.25)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tags size={16} />
                <span>Add category</span>
              </Box>
              <ArrowUpRight size={16} />
            </Button>

            <Button variant="outlined" sx={{ justifyContent: 'space-between', borderRadius: 2.5, py: 1.4, px: 1.8, borderColor: 'rgba(148,163,184,0.35)', color: 'text.primary' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Boxes size={16} />
                <span>Create subcategory</span>
              </Box>
              <ArrowUpRight size={16} />
            </Button>

            <Button variant="outlined" sx={{ justifyContent: 'space-between', borderRadius: 2.5, py: 1.4, px: 1.8, borderColor: 'rgba(148,163,184,0.35)', color: 'text.primary' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Package size={16} />
                <span>Add product</span>
              </Box>
              <ArrowUpRight size={16} />
            </Button>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,1))', color: '#fff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Sales activity</Typography>
              <Activity size={16} color="#a5b4fc" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1.2, letterSpacing: '-0.06em' }}>1,284</Typography>
            <Typography variant="body2" sx={{ mt: 0.6, color: 'rgba(255,255,255,0.72)' }}>Orders processed in last 7 days</Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
