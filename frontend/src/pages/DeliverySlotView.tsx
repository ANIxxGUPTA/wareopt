import React, { useEffect, useState } from 'react';
import { getDeliverySlots, getDeliveryOrders, optimizeDelivery, createDeliveryOrder, updateDeliveryOrder, deleteDeliveryOrder, createDeliverySlot, updateDeliverySlot, deleteDeliverySlot, getInventory, fulfillOrder } from '../services/api';
import type { DeliverySlot, SlotAssignment, DeliveryOrder, InventoryItem } from '../services/api';
import { AlertCircle, Loader2, Play, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Modal } from '../components/Modal';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DeliverySlotView = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'optimize' | 'orders' | 'slots'>('optimize');
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [assignments, setAssignments] = useState<SlotAssignment[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | string[] | null>(null);
  const [resultStats, setResultStats] = useState<{distance: number, time: number} | null>(null);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Partial<DeliveryOrder> | null>(null);
  const [editingSlot, setEditingSlot] = useState<Partial<DeliverySlot> | null>(null);
  
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (error && (isOrderModalOpen || isSlotModalOpen)) setError(null);
  }, [editingOrder, editingSlot]);

  const fetchData = async () => {
    try {
      const [slotRes, orderRes, invRes] = await Promise.all([getDeliverySlots(), getDeliveryOrders(), getInventory()]);
      setSlots(slotRes.data);
      setOrders(orderRes.data);
      setInventory(invRes.data);

      const state = (location as any).state as { tab?: string } | undefined;
      if (slotRes.data.length === 0 && orderRes.data.length === 0 && !state?.tab) {
        setActiveTab('orders');
      }
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
        if (err.response.data.details && err.response.data.details.length > 0) {
            setError(err.response.data.details);
        } else {
            setError(err.response.data.message || "Optimization failed: Constraints could not be satisfied.");
        }
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
    setIsSubmittingOrder(true);
    
    const payload: any = { ...editingOrder };
    payload.destinationLat = Number(payload.destinationLat);
    payload.destinationLng = Number(payload.destinationLng);
    payload.weightKg = Number(payload.weightKg);
    payload.priority = Number(payload.priority);

    if (isNaN(payload.destinationLat) || isNaN(payload.destinationLng) || payload.destinationLat === 0 || payload.destinationLng === 0) {
      setError("Destination Lat and Lng must be valid coordinates.");
      setIsSubmittingOrder(false);
      return;
    }

    try {
      if (editingOrder?.id) {
        await updateDeliveryOrder(editingOrder.id, payload);
      } else {
        await createDeliveryOrder(payload);
      }
      setIsOrderModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save order.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleFulfillOrder = async (id: number) => {
    if (!window.confirm("Fulfill this order? This will deduct inventory stock and cannot be undone.")) return;
    try {
      await fulfillOrder(id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to fulfill order.");
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await deleteDeliveryOrder(id);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete order.");
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmittingSlot(true);
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
    } finally {
      setIsSubmittingSlot(false);
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await deleteDeliverySlot(id);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete slot.");
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
        <button
          onClick={() => setActiveTab('optimize')}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${activeTab === 'optimize' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Optimization & Results
        </button>
      </div>

      {error && !isOrderModalOpen && !isSlotModalOpen && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-6 shadow-sm">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-red-800 text-sm font-semibold mb-2">
                Optimization could not be completed
              </h3>
              <div className="text-red-700 text-sm">
                 {Array.isArray(error) ? (
                    <ul className="list-disc pl-5 space-y-1.5 marker:text-red-400">
                       {error.map((err, i) => <li key={i} className="leading-relaxed">{err}</li>)}
                    </ul>
                 ) : (
                    <p>{error}</p>
                 )}
              </div>
            </div>
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
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
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {o.items && o.items.length > 0 ? o.items.map(i => `${i.quantity}x ${i.inventoryItem?.name}`).join(', ') : 'None'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {o.status === 'FULFILLED' ? (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs">FULFILLED</span>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs">PENDING</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                      {o.status === 'PENDING' && (
                        <button onClick={() => handleFulfillOrder(o.id)} title="Fulfill Order" className="text-blue-600 hover:text-blue-900 mr-2"><CheckCircle className="w-4 h-4"/></button>
                      )}
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
                    <XAxis type="number" dataKey="x" name="Longitude" domain={['auto', 'auto']} />
                    <YAxis type="number" dataKey="y" name="Latitude" domain={['auto', 'auto']} />
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
      <Modal isOpen={isOrderModalOpen} onClose={() => { setIsOrderModalOpen(false); setError(null); }} title={editingOrder?.id ? "Edit Order" : "Add Order"}>
        <form onSubmit={handleSaveOrder} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-red-800 text-sm font-semibold mb-1">
                    Please fix the following issues:
                  </h3>
                  <div className="text-red-700 text-sm">
                     {Array.isArray(error) ? (
                        <ul className="list-disc pl-5 space-y-1 marker:text-red-400">
                           {error.map((err, i) => <li key={i} className="leading-relaxed">{err}</li>)}
                        </ul>
                     ) : (
                        <p>{error}</p>
                     )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Destination Lat</label>
              <input required type="number" step="0.000001" value={editingOrder?.destinationLat ?? ''} onChange={e => setEditingOrder({...editingOrder, destinationLat: e.target.value as any})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" placeholder="e.g. 40.7100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Destination Lng</label>
              <input required type="number" step="0.000001" value={editingOrder?.destinationLng ?? ''} onChange={e => setEditingOrder({...editingOrder, destinationLng: e.target.value as any})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" placeholder="e.g. -74.0100" />
            </div>
            <p className="mt-1 text-xs text-gray-500 col-span-2 -mt-2">Use decimal coordinates within your delivery slots' service area</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Deadline</label>
            <DatePicker
              required
              selected={editingOrder?.deadline ? new Date(editingOrder.deadline) : null}
              onChange={(date: Date | null) => setEditingOrder({...editingOrder, deadline: date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : ''})}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500"
              placeholderText="Select deadline date and time"
              wrapperClassName="w-full"
            />
            <p className="mt-1 text-xs text-gray-500">Must be on or after a delivery slot's end time for this order to be assignable</p>
            <p className="mt-1 text-xs text-gray-500">Click outside the calendar or press Enter to confirm your selection</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input required type="number" step="0.1" min="0.1" value={editingOrder?.weightKg ?? ''} onChange={e => setEditingOrder({...editingOrder, weightKg: e.target.value as any})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" placeholder="e.g. 15" />
              <p className="mt-1 text-xs text-gray-500">Total order weight in this slot's time window must not exceed slot capacity</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <input required type="number" min="1" value={editingOrder?.priority ?? ''} onChange={e => setEditingOrder({...editingOrder, priority: e.target.value as any})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" placeholder="e.g. 1" />
              <p className="mt-1 text-xs text-gray-500">Lower number = higher priority</p>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Line Items</label>
              <button
                type="button"
                onClick={() => {
                  const currentItems = editingOrder?.items || [];
                  setEditingOrder({
                    ...editingOrder,
                    items: [...currentItems, { inventoryItem: { id: 0 } as any, quantity: 1 } as any]
                  });
                }}
                className="text-emerald-600 text-xs font-medium hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            {(!editingOrder?.items || editingOrder.items.length === 0) && (
              <p className="text-xs text-gray-500 italic">No line items added yet.</p>
            )}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {editingOrder?.items?.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    required
                    value={item.inventoryItem?.id || ''}
                    onChange={(e) => {
                      const newItems = [...(editingOrder.items || [])];
                      newItems[idx] = { ...newItems[idx], inventoryItem: { id: Number(e.target.value) } as any };
                      setEditingOrder({ ...editingOrder, items: newItems });
                    }}
                    className="flex-1 rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                  >
                    <option value="" disabled>Select Item...</option>
                    {inventory.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.name} (Stock: {inv.quantityOnHand})</option>
                    ))}
                  </select>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity || ''}
                    onChange={(e) => {
                      const newItems = [...(editingOrder.items || [])];
                      newItems[idx] = { ...newItems[idx], quantity: Number(e.target.value) };
                      setEditingOrder({ ...editingOrder, items: newItems });
                    }}
                    className="w-20 rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = editingOrder.items!.filter((_, i) => i !== idx);
                      setEditingOrder({ ...editingOrder, items: newItems });
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" disabled={isSubmittingOrder} className="w-full bg-emerald-600 text-white rounded-md py-2 font-medium hover:bg-emerald-700 disabled:opacity-50">
            {isSubmittingOrder ? "Saving..." : "Save Order"}
          </button>
        </form>
      </Modal>

      {/* Slot Modal */}
      <Modal isOpen={isSlotModalOpen} onClose={() => { setIsSlotModalOpen(false); setError(null); }} title={editingSlot?.id ? "Edit Slot" : "Add Slot"}>
        <form onSubmit={handleSaveSlot} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-red-800 text-sm font-semibold mb-1">
                    Please fix the following issues:
                  </h3>
                  <div className="text-red-700 text-sm">
                     {Array.isArray(error) ? (
                        <ul className="list-disc pl-5 space-y-1 marker:text-red-400">
                           {error.map((err, i) => <li key={i} className="leading-relaxed">{err}</li>)}
                        </ul>
                     ) : (
                        <p>{error}</p>
                     )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Vehicle ID</label>
            <input required type="text" value={editingSlot?.vehicleId || ''} onChange={e => setEditingSlot({...editingSlot, vehicleId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" placeholder="e.g. V-101" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <DatePicker
                required
                selected={editingSlot?.startTime ? new Date(editingSlot.startTime) : null}
                onChange={(date: Date | null) => setEditingSlot({...editingSlot, startTime: date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : ''})}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500"
                placeholderText="Select start time"
                wrapperClassName="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <DatePicker
                required
                selected={editingSlot?.endTime ? new Date(editingSlot.endTime) : null}
                onChange={(date: Date | null) => setEditingSlot({...editingSlot, endTime: date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : ''})}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500"
                placeholderText="Select end time"
                wrapperClassName="w-full"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 col-span-2 -mt-2">Orders with a deadline before this slot's end time can be assigned here</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Capacity (kg)</label>
            <input required type="number" step="0.1" min="0.1" value={editingSlot?.maxCapacityKg || ''} onChange={e => setEditingSlot({...editingSlot, maxCapacityKg: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500" placeholder="e.g. 100" />
          </div>
          <button type="submit" disabled={isSubmittingSlot} className="w-full bg-emerald-600 text-white rounded-md py-2 font-medium hover:bg-emerald-700 disabled:opacity-50">
            {isSubmittingSlot ? "Saving..." : "Save Slot"}
          </button>
        </form>
      </Modal>

    </div>
  );
};
