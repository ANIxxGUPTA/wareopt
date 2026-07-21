import { useEffect, useState } from 'react';
import { getDeliverySlots, optimizeDelivery } from '../services/api';
import type { DeliverySlot, SlotAssignment } from '../services/api';
import { AlertCircle, Loader2, Play } from 'lucide-react';
import axios from 'axios';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DeliverySlotView = () => {
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [assignments, setAssignments] = useState<SlotAssignment[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultStats, setResultStats] = useState<{distance: number, time: number} | null>(null);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await getDeliverySlots();
      setSlots(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    setResultStats(null);
    
    try {
      const res = await optimizeDelivery();
      setAssignments(res.data.assignments);
      setResultStats({
        distance: res.data.totalDistanceKm,
        time: res.data.solveTimeMs
      });
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setError(err.response.data.message || "Optimization failed: Constraints could not be satisfied.");
      } else {
        setError("An unexpected error occurred during optimization.");
      }
    } finally {
      setLoading(false);
    }
  };

  const assignmentsBySlot = assignments.reduce((acc, curr) => {
    if (!acc[curr.slot.id]) acc[curr.slot.id] = [];
    acc[curr.slot.id].push(curr);
    return acc;
  }, {} as Record<number, SlotAssignment[]>);

  const plotData = assignments.map(a => ({
    x: a.order.destinationLng,
    y: a.order.destinationLat,
    slotId: a.slot.id,
    weight: a.order.weightKg
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Delivery Routing</h2>
          <p className="text-sm text-gray-500">Run CP-SAT solver to assign orders to vehicle slots minimizing distance.</p>
        </div>
        <button
          onClick={handleOptimize}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Run Optimization
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {resultStats && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 flex gap-8">
          <div>
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Distance</p>
            <p className="text-2xl font-bold text-emerald-600">{resultStats.distance.toFixed(2)} km</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Solve Time</p>
            <p className="text-2xl font-bold text-emerald-600">{resultStats.time} ms</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot / Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Orders</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {slots.map((slot, idx) => {
                const assigned = assignmentsBySlot[slot.id] || [];
                const currentWeight = assigned.reduce((sum, a) => sum + a.order.weightKg, 0);
                const colorClass = COLORS[idx % COLORS.length];
                
                return (
                  <tr key={slot.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorClass }}></div>
                        {slot.vehicleId} <br/>
                        <span className="text-xs text-gray-500">{new Date(slot.startTime).toLocaleTimeString()} - {new Date(slot.endTime).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (currentWeight / slot.maxCapacityKg) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-500">{currentWeight.toFixed(1)} / {slot.maxCapacityKg} kg</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {assigned.length > 0 ? (
                        <span className="font-medium text-gray-900">{assigned.length} orders</span>
                      ) : (
                        <span className="text-gray-400 italic">None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 h-[400px]">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Route Map (Lng/Lat)</h3>
          {assignments.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name="Longitude" />
                <YAxis type="number" dataKey="y" name="Latitude" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Orders" data={plotData} fill="#8884d8">
                  {plotData.map((entry, index) => {
                    const slotIndex = slots.findIndex(s => s.id === entry.slotId);
                    return <Cell key={`cell-${index}`} fill={COLORS[slotIndex % COLORS.length]} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Run optimization to view map
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
