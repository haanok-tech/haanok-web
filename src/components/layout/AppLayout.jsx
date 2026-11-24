import { useMemo, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Box,
  AppBar,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Badge,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Menu as MuiMenu,
  MenuItem,
} from '@mui/material'
import {
  Menu,
  LayoutDashboard,
  Layers3,
  Boxes,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Settings,
  Bell,
  ChevronRight,
  Building2,
  Warehouse,
  LogOut,
} from 'lucide-react'
import apiClient, { clearAuthTokens } from '../../services/apiClient'

const drawerWidth = 280

const menuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Categories', to: '/categories', icon: Layers3 },
  { label: 'Subcategories', to: '/subcategories', icon: Boxes },
  { label: 'BusinessCities', to: '/business-cities', icon: Building2 },
  { label: 'Warehouses', to: '/warehouses', icon: Warehouse },
  { label: 'Products', to: '/products', icon: ShoppingCart },
  { label: 'Orders', to: '/orders', icon: ShoppingCart },
  { label: 'Clients', to: '/clients', icon: Users },
  { label: 'Inventory', to: '/inventory', icon: Boxes },
  { label: 'Customers', to: '/customers', icon: Users },
  { label: 'Suppliers', to: '/suppliers', icon: Truck },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  { label: 'Settings', to: '/settings', icon: Settings },
]

const theme = createTheme({
  palette: {
    primary: { main: '#7c3aed' },
    secondary: { main: '#22c55e' },
    background: { default: '#f3f6fb' },
  },
  typography: {
    fontFamily: 'Inter, Segoe UI, sans-serif',
    h1: { fontWeight: 700, fontSize: '2.6rem', lineHeight: 1.15 },
    h2: { fontWeight: 700, fontSize: '2.2rem', lineHeight: 1.2 },
    h3: { fontWeight: 700, fontSize: '1.8rem', lineHeight: 1.2 },
    h4: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.25 },
    h5: { fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.3 },
    h6: { fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.35 },
    body1: { fontSize: '0.96rem' },
    body2: { fontSize: '0.85rem' },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiListItemButton: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiAppBar: { styleOverrides: { root: { backgroundColor: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)' } } },
  },
})

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await apiClient.post('/api/auth/logout', { refreshToken })
      }
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      clearAuthTokens()
      setAnchorEl(null)
      navigate('/login')
    }
  }

  const navContent = useMemo(
    () => (
      <Box
        sx={{
          width: drawerWidth,
          height: '100%',
          background: 'linear-gradient(180deg, #0b1020 0%, #111827 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at top left, rgba(124,58,237,0.28), transparent 38%), radial-gradient(circle at bottom right, rgba(34,197,94,0.14), transparent 30%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.75 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 35%, #22c55e 100%)',
                boxShadow: '0 12px 30px rgba(124,58,237,0.45)',
              }}
            >
              D
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#cbd5e1', letterSpacing: 1.6, textTransform: 'uppercase' }}>
                Storefront
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>Dashboard</Typography>
            </Box>
          </Box>

          <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
            {menuItems.map(({ label, to, icon: Icon }) => (
              <ListItem key={label} disablePadding sx={{ mb: 0.55 }}>
                <ListItemButton
                  component={NavLink}
                  to={to}
                  end={to === '/dashboard'}
                  sx={({ isActive }) => ({
                    color: isActive ? '#fff' : '#cbd5e1',
                    bgcolor: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                    border: isActive ? '1px solid rgba(139,92,246,0.6)' : '1px solid transparent',
                    boxShadow: isActive ? '0 12px 30px rgba(124,58,237,0.18)' : 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                    py: 1.2,
                    px: 1.25,
                  })}
                >
                  <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                    <Icon size={18} />
                  </ListItemIcon>
                  <ListItemText primary={label} sx={{ '& .MuiTypography-root': { fontWeight: 600 } }} />
                  <ChevronRight size={16} opacity={0.8} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box sx={{ p: 2.5, pb: 3 }}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(34,197,94,0.12))',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 3,
                p: 2,
              }}
            >
              <Typography variant="caption" sx={{ color: '#dfe7ff', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Inventory
              </Typography>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 800 }}>
                2,458
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                active products
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    ),
    [],
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f3f6fb' }}>
        <Box component="nav" sx={{ display: { xs: 'none', md: 'block' }, position: 'relative' }}>
          {navContent}
        </Box>

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' } }}
        >
          {navContent}
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
          <AppBar
            position="sticky"
            color="transparent"
            elevation={0}
            sx={{
              borderBottom: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(18px)',
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: 76, px: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton color="primary" edge="start" sx={{ display: { md: 'none' } }} onClick={() => setMobileOpen(true)}>
                  <Menu size={20} />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
                  Admin Panel
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Badge badgeContent={3} color="error">
                  <IconButton sx={{ color: '#111827', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 2 }}>
                    <Bell size={18} />
                  </IconButton>
                </Badge>
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)',
                    boxShadow: '0 8px 20px rgba(124,58,237,0.25)',
                    cursor: 'pointer',
                  }}
                  onClick={(event) => setAnchorEl(event.currentTarget)}
                >
                  SA
                </Avatar>

                <MuiMenu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={handleLogout}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LogOut size={16} />
                      <Typography variant="body2">Logout</Typography>
                    </Box>
                  </MenuItem>
                </MuiMenu>
              </Box>
            </Toolbar>
          </AppBar>

          <Box sx={{ p: { xs: 2, md: 3.5 } }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}
