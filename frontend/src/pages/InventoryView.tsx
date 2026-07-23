import { useEffect, useState } from 'react';
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, getLowStockInventory, getInventoryItemHistory, exportCsv, logStockMovement } from '../services/api';
import type { InventoryItem, StockMovement } from '../services/api';
import { AlertCircle, Edit2, Plus, Trash2, AlertTriangle, History, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Modal } from '../components/Modal';
import axios from 'axios';

export const InventoryView = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<StockMovement[]>([]);
  const [historyItemName, setHistoryItemName] = useState<string>("");

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logAction, setLogAction] = useState<'in' | 'out'>('in');
  const [logItem, setLogItem] = useState<InventoryItem | null>(null);
  const [logForm, setLogForm] = useState({ quantity: '', date: new Date().toISOString().split('T')[0], note: '', reason: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [res, lowStockRes] = await Promise.all([
        getInventory(),
        getLowStockInventory()
      ]);
      setItems(res.data);
      setLowStockCount(lowStockRes.data.length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    // Front-end validation before hitting API
    if (!editingItem.sku || editingItem.sku.trim() === '') {
      setError("SKU is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingItem.id) {
        await updateInventoryItem(editingItem.id, editingItem);
      } else {
        const newItem = { quantityOnHand: 0, ...editingItem } as Omit<InventoryItem, 'id' | 'createdAt' | 'lastUpdated'>;
        await createInventoryItem(newItem);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to save inventory item.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this inventory item?")) return;
    try {
      await deleteInventoryItem(id);
      fetchData();
    } catch {
      setError("Failed to delete item.");
    }
  };

  const handleExport = async () => {
    try {
      const res = await exportCsv();
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError('Failed to export CSV');
    }
  };


  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  };

  const handleViewHistory = async (item: InventoryItem) => {
    try {
      const res = await getInventoryItemHistory(item.id);
      setHistoryItems(res.data);
      setHistoryItemName(item.name);
      setIsHistoryModalOpen(true);
    } catch {
      setError("Failed to fetch history.");
    }
  };

  const handleOpenLogModal = (item: InventoryItem, action: 'in' | 'out') => {
    setLogItem(item);
    setLogAction(action);
    setLogForm({ quantity: '', date: new Date().toISOString().split('T')[0], note: '', reason: action === 'in' ? 'RESTOCK' : 'ORDER_FULFILLMENT' });
    setIsLogModalOpen(true);
    setError(null);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logItem) return;
    setError(null);
    setIsSubmitting(true);

    const qty = parseInt(logForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be greater than 0");
      setIsSubmitting(false);
      return;
    }

    try {
      const changeAmount = logAction === 'in' ? qty : -qty;
      await logStockMovement(logItem.id, {
        changeAmount,
        reason: logForm.reason,
        date: logForm.date,
        note: logForm.note
      });
      setIsLogModalOpen(false);
      await fetchData();
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to log stock movement.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-sm text-gray-500">Manage warehouse stock, locations, and reorder levels.</p>
        </div>
        <div className="space-x-4">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
            onClick={handleExport}
          >
            Export CSV
          </button>
        </div>
      </div>

      {lowStockCount > 0 && !isModalOpen && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 flex gap-3 shadow-sm rounded-r-md">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-orange-800 text-sm font-semibold">Low Stock Alert</h3>
            <p className="text-orange-700 text-sm mt-1">
              {lowStockCount} item{lowStockCount === 1 ? ' is' : 's are'} at or below their reorder threshold.
            </p>
          </div>
        </div>
      )}

      {error && !isModalOpen && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <button 
          onClick={() => { setEditingItem({}); setIsModalOpen(true); }} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>

        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty / Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Thresh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map(item => {
                const isLowStock = item.reorderThreshold !== undefined && item.quantityOnHand <= item.reorderThreshold;
                return (
                  <tr key={item.id} className={isLowStock ? "bg-orange-50/50" : ""}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={isLowStock ? "font-semibold text-orange-600" : "text-gray-500"}>
                        {item.quantityOnHand} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.warehouseLocation || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.reorderThreshold !== undefined ? item.reorderThreshold : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(item.costPerUnit)}</td>
                    <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                      <button onClick={() => handleOpenLogModal(item, 'in')} title="Stock In" className="text-green-600 hover:text-green-900 bg-green-50 p-1 rounded">
                        <ArrowDownToLine className="w-4 h-4"/>
                      </button>
                      <button onClick={() => handleOpenLogModal(item, 'out')} title="Stock Out" className="text-orange-600 hover:text-orange-900 bg-orange-50 p-1 rounded">
                        <ArrowUpFromLine className="w-4 h-4"/>
                      </button>
                      <div className="w-px h-4 bg-gray-300 my-auto mx-1"></div>
                      <button onClick={() => handleViewHistory(item)} title="View Log" className="text-gray-600 hover:text-gray-900">
                        <History className="w-4 h-4"/>
                      </button>
                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} title="Edit Details" className="text-blue-600 hover:text-blue-900">
                        <Edit2 className="w-4 h-4"/>
                      </button>
                      <button onClick={() => handleDelete(item.id)} title="Delete" className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setError(null); }} title={editingItem?.id ? "Edit Item" : "Add Item"}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-red-800 text-sm font-semibold mb-1">Error</h3>
                  <div className="text-red-700 text-sm">{error}</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <input required type="text" value={editingItem?.sku || ''} onChange={e => setEditingItem({...editingItem, sku: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. SKU-001 (unique product code)" />
              <p className="mt-1 text-xs text-gray-500">A unique code to identify this item (letters/numbers).</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input required type="text" value={editingItem?.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="Item Name" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={editingItem?.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" rows={2} placeholder="Brief description of item..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit of Measure (e.g. kg, box)</label>
              <input type="text" value={editingItem?.unit || ''} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. kg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity on Hand</label>
              <input type="number" min="0" value={editingItem?.quantityOnHand ?? ''} onChange={e => setEditingItem({...editingItem, quantityOnHand: parseInt(e.target.value) || 0})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input type="text" value={editingItem?.warehouseLocation || ''} onChange={e => setEditingItem({...editingItem, warehouseLocation: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="Aisle 4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reorder Thresh.</label>
              <input type="number" min="0" value={editingItem?.reorderThreshold ?? ''} onChange={e => setEditingItem({...editingItem, reorderThreshold: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cost/Unit (₹)</label>
              <input type="number" step="0.01" min="0" value={editingItem?.costPerUnit ?? ''} onChange={e => setEditingItem({...editingItem, costPerUnit: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="2.50" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50 mt-4">
            {isSubmitting ? "Saving..." : "Save Item"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Stock Log: ${historyItemName}`}>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {historyItems.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-4">No history records found.</p>
          ) : (
            <div className="relative border-l border-gray-200 ml-3 space-y-6">
              {historyItems.map((record) => (
                <div key={record.id} className="relative pl-6">
                  <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white"></span>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {record.changeAmount > 0 ? '+' : ''}{record.changeAmount} ({record.reason})
                    </h4>
                    <time className="text-xs text-gray-500">{new Date(record.timestamp).toLocaleString()}</time>
                  </div>
                  {record.note && <p className="mt-1 text-sm text-gray-600">{record.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={isLogModalOpen} onClose={() => { setIsLogModalOpen(false); setError(null); }} title={`Log Stock ${logAction === 'in' ? 'In' : 'Out'} - ${logItem?.name}`}>
        <form onSubmit={handleLogSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-red-800 text-sm font-semibold mb-1">Error</h3>
                  <div className="text-red-700 text-sm">{error}</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity to Log {logAction === 'in' ? 'In' : 'Out'}</label>
              <input required type="number" min="1" value={logForm.quantity} onChange={e => setLogForm({...logForm, quantity: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. 50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input required type="date" value={logForm.date} onChange={e => setLogForm({...logForm, date: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <select value={logForm.reason} onChange={e => setLogForm({...logForm, reason: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500">
              {logAction === 'in' ? (
                <>
                  <option value="RESTOCK">Restock</option>
                  <option value="CORRECTION">Correction (+)</option>
                  <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                </>
              ) : (
                <>
                  <option value="ORDER_FULFILLMENT">Order Fulfillment</option>
                  <option value="CORRECTION">Correction (-)</option>
                  <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                </>
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Optional Note</label>
            <textarea value={logForm.note} onChange={e => setLogForm({...logForm, note: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" rows={2} placeholder="Any details..." />
          </div>

          <button type="submit" disabled={isSubmitting} className={`w-full text-white rounded-md py-2 font-medium transition disabled:opacity-50 mt-4 ${logAction === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
            {isSubmitting ? "Saving..." : `Confirm Stock ${logAction === 'in' ? 'In' : 'Out'}`}
          </button>
        </form>
      </Modal>
    </div>
  );
};
