// …existing imports…
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import PricesPage from "@/pages/Prices";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen grid grid-cols-12">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-2 border-r bg-white">
          <div className="p-4 text-lg font-semibold">cool-toolbox</div>
          <nav className="flex flex-col gap-1 p-2 text-sm">
            <Link className="px-3 py-2 rounded hover:bg-gray-100" to="/">Dashboard</Link>
            <Link className="px-3 py-2 rounded hover:bg-gray-100" to="/prices">Prices</Link>
          </nav>
        </aside>
        {/* Main */}
        <main className="col-span-12 md:col-span-10 bg-gray-50">
          <Routes>
            {/* your existing routes */}
            <Route path="/prices" element={<PricesPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}