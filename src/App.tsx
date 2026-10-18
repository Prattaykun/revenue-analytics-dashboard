import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FilterProvider } from './lib/filters'
import { Layout } from './components/Layout'
import Overview from './pages/Overview'
import Leads from './pages/Leads'
import Quotations from './pages/Quotations'
import Deals from './pages/Deals'
import Orders from './pages/Orders'
import { DealDetail, LeadDetail } from './pages/Detail'

export default function App() {
  return (
    <HashRouter>
      <FilterProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/quotations" element={<Quotations />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/deals/:id" element={<DealDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </FilterProvider>
    </HashRouter>
  )
}
