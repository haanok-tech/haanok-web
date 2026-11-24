import { Routes, Route } from 'react-router-dom'
import DashboardPage from '../features/dashboard/pages/DashboardPage'
import CategoryPage from '../features/categories/pages/CategoryPage'
import SubcategoryPage from '../features/subcategories/pages/SubcategoryPage'
import ProductPage from '../features/products/pages/ProductPage'
import BusinessCitiesPage from '../features/business-cities/pages/BusinessCitiesPage'
import WarehousePage from '../features/warehouses/pages/WarehousePage'
import OrderPage from '../features/orders/pages/OrderPage'
import ClientPage from '../features/clients/pages/ClientPage'
import InventoryPage from '../features/inventory/pages/InventoryPage'
import PlaceholderPage from '../components/layout/PlaceholderPage'
import AppLayout from '../components/layout/AppLayout'
import LoginPage from '../features/auth/pages/LoginPage'
import SignupPage from '../features/auth/pages/SignupPage'
import ProtectedRoute from '../components/auth/ProtectedRoute'

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/categories" element={<CategoryPage />} />
          <Route path="/subcategories" element={<SubcategoryPage />} />
          <Route path="/business-cities" element={<BusinessCitiesPage />} />
          <Route path="/warehouses" element={<WarehousePage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/clients" element={<ClientPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/customers" element={<PlaceholderPage title="Customers" description="Customers module coming soon." />} />
          <Route path="/suppliers" element={<PlaceholderPage title="Suppliers" description="Suppliers module coming soon." />} />
          <Route path="/reports" element={<PlaceholderPage title="Reports" description="Reports module coming soon." />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" description="Settings module coming soon." />} />
        </Route>
      </Route>
    </Routes>
  )
}
