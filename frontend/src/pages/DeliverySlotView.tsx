import React, { useEffect, useState } from 'react';
import { getDeliverySlots, getDeliveryOrders, optimizeDelivery, createDeliveryOrder, updateDeliveryOrder, deleteDeliveryOrder, createDeliverySlot, updateDeliverySlot, deleteDeliverySlot } from '../services/api';
import type { DeliverySlot, SlotAssignment, DeliveryOrder } from '../services/api';
import { AlertCircle, Loader2, Play, Plus, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Modal } from '../components/Modal';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DeliverySlotView = () => {
  const [activeTab, setActiveTab] = useState<'optimize' | 'orders' | 'slots'>('optimize');
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [assignments, setAssignments] = useState<SlotAssignment[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultStats, setResultStats] = useState<{distance: number, time: number} | null>(null);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Partial<DeliveryOrder> | null>(null);
  const [editingSlot, setEditingSlot] = useState<Partial<DeliverySlot> | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [slotRes, orderRes] = await Promise.all([getDeliverySlots(), getDeliveryOrders()]);
      setSlots(slotRes.data);
      setOrders(orderRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data.");
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

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingOrder?.id) {
        await updateDeliveryOrder(editingOrder.id, editingOrder);
      } else {
        await createDeliveryOrder(editingOrder!);
      }
      setIsOrderModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save order.");
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await deleteDeliveryOrder(id);
      fetchData();
    } catch (err) {
      setError("Failed to delete order.");
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingSlot?.id) {
        await updateDeliverySlot(editingSlot.id, editingSlot);
      } else {
        await createDeliverySlot(editingSlot!);
      }
      setIsSlotModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save slot.");
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await deleteDeliverySlot(id);
      fetchData();
    } catch (err) {
      setError("Failed to delete slot.");
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
          <p className="text-sm text-gray-500">Manage orders, slots, and run optimization.</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('optimize')}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${activeTab === 'optimize' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Optimization & Results
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${activeTab === 'orders' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Manage Orders
        </button>
        <button
          onClick={() => setActiveTab('slots')}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${activeTab === 'slots' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Manage Slots
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <button onClick={() => { setEditingOrder({ priority: 1 }); setIsOrderModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> Add Order
          </button>
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lat, Lng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{o.destinationLat.toFixed(4)}, {o.destinationLng.toFixed(4)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(o.deadline).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{o.weightKg}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{o.priority}</td>
                    <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                      <button onClick={() => { setEditingOrder(o); setIsOrderModalOpen(true); }} className="text-emerald-600 hover:text-emerald-900"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteOrder(o.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'slots' && (
        <div className="space-y-4">
          <button onClick={() => { setEditingSlot({}); setIsSlotModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> Add Slot
          </button>
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Window</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Capacity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {slots.map(s => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.vehicleId}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.maxCapacityKg} kg</td>
                    <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                      <button onClick={() => { setEditingSlot(s); setIsSlotModalOpen(true); }} className="text-emerald-600 hover:text-emerald-900"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteSlot(s.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'optimize' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleOptimize}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Optimization
            </button>
          </div>

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
      )}

      {/* Order Modal */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title={editingOrder?.id ? "Edit Order" : "Add Order"}>
        <form onSubmit={handleSaveOrder} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Destination Lat</label>
              <input required type="number" step="0.000001" value={editingOrder?.destinationLat || ''} onChange={e => setEditingOrder({...editingOrder, destinationLat: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Destination Lng</label>
              <input required type="number" step="0.000001" value={editingOrder?.destinationLng || ''} onChange={e => setEditingOrder({...editingOrder, destinationLng: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Deadline</label>
            <input required type="datetime-local" step="1" value={editingOrder?.deadline || ''} onChange={e => setEditingOrder({...editingOrder, deadline: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input required type="number" step="0.1" min="0.1" value={editingOrder?.weightKg || ''} onChange={e => setEditingOrder({...editingOrder, weightKg: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <input required type="number" min="1" value={editingOrder?.priority || ''} onChange={e => setEditingOrder({...editingOrder, priority: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white rounded-md py-2 font-medium hover:bg-emerald-700">Save Order</button>
        </form>
      </Modal>

      {/* Slot Modal */}
      <Modal isOpen={isSlotModalOpen} onClose={() => setIsSlotModalOpen(false)} title={editingSlot?.id ? "Edit Slot" : "Add Slot"}>
        <form onSubmit={handleSaveSlot} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Vehicle ID</label>
            <input required type="text" value={editingSlot?.vehicleId || ''} onChange={e => setEditingSlot({...editingSlot, vehicleId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input required type="datetime-local" step="1" value={editingSlot?.startTime || ''} onChange={e => setEditingSlot({...editingSlot, startTime: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input required type="datetime-local" step="1" value={editingSlot?.endTime || ''} onChange={e => setEditingSlot({...editingSlot, endTime: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Capacity (kg)</label>
            <input required type="number" step="0.1" min="0.1" value={editingSlot?.maxCapacityKg || ''} onChange={e => setEditingSlot({...editingSlot, maxCapacityKg: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white rounded-md py-2 font-medium hover:bg-emerald-700">Save Slot</button>
        </form>
      </Modal>

    </div>
  );
};
