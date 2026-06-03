import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ExpensesPage from './pages/ExpensesPage'
import ReportingPage from './pages/ReportingPage'
import StrikesPage from './pages/StrikesPage'
import Layout from './components/Layout'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="spesen" element={<ExpensesPage />} />
            <Route path="reporting" element={<ReportingPage />} />
            <Route path="strikes" element={<StrikesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
