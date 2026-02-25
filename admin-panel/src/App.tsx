import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

import UsersPage from './pages/users/UsersPage'
import DistributorsPage from './pages/distributors/DistributorsPage'
import DistributorDetailPage from './pages/distributors/DistributorDetailPage'
import CustomersPage from './pages/customers/CustomersPage'
import CustomerDetailPage from './pages/customers/CustomerDetailPage'
import OrdersPage from './pages/orders/OrdersPage'
import OrderDetailPage from './pages/orders/OrderDetailPage'
import WithdrawalsPage from './pages/withdrawals/WithdrawalsPage'
import DashboardPage from './pages/dashboard/DashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />

            <Route path="users" element={<UsersPage />} />

            <Route path="distributors" element={<DistributorsPage />} />
            <Route path="distributors/:id" element={<DistributorDetailPage />} />

            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />

            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />

            <Route path="withdrawals" element={<WithdrawalsPage />} />

            <Route path="analytics" element={<DashboardPage />} />
            <Route path="settings" element={<div>Settings Module</div>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
