import { useEffect, useState } from 'react';
import { Users, Calendar, Box, RotateCcw, AlertCircle, Loader2, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import { getWorkers, getShifts, resetDatabase, getLowStockInventory, getInventory } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const DashboardHome = () => {
  const [counts, setCounts] = useState({ workers: 0, shifts: 0, lowStock: 0, inventoryItems: 0 });
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchCounts = () => {
    Promise.all([getWorkers(), getShifts(), getLowStockInventory(), getInventory()]).then(
      ([resWorkers, resShifts, resLowStock, resInventory]) => {
        setCounts({
          workers: resWorkers.data.length,
          shifts: resShifts.data.length,
          lowStock: resLowStock.data.length,
          inventoryItems: resInventory.data.length,
        });
      }
    ).catch(err => {
      console.error(err);
      setError("Failed to fetch dashboard data.");
    });
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to completely reset all data? This will wipe workers, shifts, and assignments permanently.")) {
      setResetting(true);
      setError(null);
      try {
        await resetDatabase();
        fetchCounts(); // refresh the numbers to 0
      } catch (err) {
        console.error(err);
        setError("Failed to reset database.");
      } finally {
        setResetting(false);
      }
    }
  };

  const stats = [
    { label: 'Total Workers', value: counts.workers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Shifts', value: counts.shifts, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Low Stock Alerts', value: counts.lowStock, icon: AlertTriangle, color: counts.lowStock > 0 ? 'text-red-600' : 'text-gray-500', bg: counts.lowStock > 0 ? 'bg-red-100' : 'bg-gray-100' },
  ];

  return (
    <div className="space-y-8">
      {/* A. Intro/Explainer Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to WareOpt</h2>
        <p className="text-gray-600 max-w-3xl">
          WareOpt is your all-in-one operations tool for managing warehouse logistics. Optimize your worker shift scheduling and track your inventory seamlessly from this central hub.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* B. Existing Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
              <div className={`p-3 rounded-full ${stat.bg} ${stat.color} mr-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* C. "How It Works" / Module Explainer Section */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => navigate('/shifts')}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-gray-900">Shift Assignments</h4>
              </div>
              <p className="text-sm text-gray-600">
                Manage your worker roster, define shift requirements, and run an optimizer to auto-assign workers to shifts based on skills, cost, and availability.
              </p>
            </div>



            <div 
              onClick={() => navigate('/inventory')}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group md:col-span-2"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-md group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Box className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-gray-900">Inventory Management</h4>
              </div>
              <p className="text-sm text-gray-600">
                Track stock levels, get low-stock alerts, and see a full audit history of every quantity change.
              </p>
            </div>
          </div>
        </div>

        {/* D. Getting Started Checklist */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Getting Started</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              {counts.workers > 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />}
              <span className={`text-sm ${counts.workers > 0 ? 'text-gray-900' : 'text-gray-500'}`}>Add your first worker</span>
            </li>
            <li className="flex items-start gap-3">
              {counts.shifts > 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />}
              <span className={`text-sm ${counts.shifts > 0 ? 'text-gray-900' : 'text-gray-500'}`}>Create a shift</span>
            </li>
            <li className="flex items-start gap-3">
              {counts.workers > 0 && counts.shifts > 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />}
              <span className={`text-sm ${counts.workers > 0 && counts.shifts > 0 ? 'text-gray-900' : 'text-gray-500'}`}>Run optimization</span>
            </li>
            <li className="flex items-start gap-3">
              {counts.inventoryItems > 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />}
              <span className={`text-sm ${counts.inventoryItems > 0 ? 'text-gray-900' : 'text-gray-500'}`}>Add inventory items</span>
            </li>
          </ul>
        </div>
      </div>

      {/* E. Quick Actions & Danger Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/shifts')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Manage Shift Optimization
            </button>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-8">
          <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Danger Zone
          </h3>
          <p className="text-sm text-red-700 mb-4">
            Completely wipe all workers, shifts, assignments, and inventory from the database to start fresh.
          </p>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
};
