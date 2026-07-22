import { useEffect, useState } from 'react';
import { Users, Box, RotateCcw, AlertCircle, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { getWorkers, getShifts, resetDatabase, getLowStockInventory, getInventory } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const DashboardHome = () => {
  const [counts, setCounts] = useState({ workers: 0, shifts: 0, lowStock: 0, inventoryItems: 0 });
  const [resetting, setResetting] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);
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

  // Setup Progress Calculation
  const steps = [
    { label: 'Add your first worker', done: counts.workers > 0 },
    { label: 'Create a shift', done: counts.shifts > 0 },
    { label: 'Run shift optimization', done: counts.workers > 0 && counts.shifts > 0 },
    { label: 'Add inventory items', done: counts.inventoryItems > 0 },
  ];
  const completedStepsCount = steps.filter(s => s.done).length;
  const nextPendingStep = steps.find(s => !s.done)?.label || "All setup steps complete!";
  const progressPercentage = (completedStepsCount / steps.length) * 100;

  return (
    <div className="space-y-8">
      {/* 1. Header & Setup Progress */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome to WareOpt</h2>
          <p className="text-gray-600">Your central operations hub for shift scheduling and inventory management.</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-w-[300px]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">{completedStepsCount} of 4 steps complete</span>
            <span className="text-xs font-medium text-gray-500">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <p className="text-xs text-gray-600">
            {completedStepsCount < 4 ? <span className="font-medium">Next:</span> : ""} {nextPendingStep}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* 2. Interactive Core Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module Card 1: Shifts */}
        <div 
          onClick={() => navigate('/shifts')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group flex flex-col"
        >
          <div className="p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Shift Assignments</h3>
            <div className="flex items-center gap-4 mb-3">
              <div>
                <p className="text-2xl font-bold text-gray-900">{counts.workers}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Workers</p>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{counts.shifts}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Shifts</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Auto-assign workers to shifts based on skills, cost, and availability.
            </p>
          </div>
          <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-center">
            <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700">Manage Shifts</span>
          </div>
        </div>

        {/* Module Card 2: Inventory */}
        <div 
          onClick={() => navigate('/inventory')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group flex flex-col"
        >
          <div className="p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Box className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Inventory Management</h3>
            <div className="flex items-center gap-4 mb-3">
              <div>
                <p className="text-2xl font-bold text-gray-900">{counts.inventoryItems}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Items</p>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div>
                <p className={`text-2xl font-bold ${counts.lowStock > 0 ? 'text-red-600' : 'text-gray-900'}`}>{counts.lowStock}</p>
                <p className={`text-xs font-medium uppercase tracking-wider ${counts.lowStock > 0 ? 'text-red-600' : 'text-gray-500'}`}>Low Stock</p>
              </div>
              {counts.lowStock > 0 && (
                <div className="ml-auto bg-red-100 text-red-600 p-2 rounded-full animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Track stock levels, get low-stock alerts, and view full audit history.
            </p>
          </div>
          <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-center">
            <span className="text-sm font-semibold text-amber-600 group-hover:text-amber-700">Manage Inventory</span>
          </div>
        </div>
      </div>

      {/* 3. Advanced/Admin (Danger Zone) */}
      <div className="pt-8 border-t border-gray-200 flex flex-col items-center">
        <button
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          {showDangerZone ? 'Hide advanced/admin options' : 'Show advanced/admin options'}
        </button>

        {showDangerZone && (
          <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-8 mt-4 w-full max-w-3xl">
            <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-sm text-red-700 mb-4">
              Completely wipe all workers, shifts, assignments, and inventory from the database to start fresh. This is used to delete all previously existing logs and data, and start entirely afresh.
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
        )}
      </div>
    </div>
  );
};
