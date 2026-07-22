import { useEffect, useState } from 'react';
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../services/api';
import type { InventoryItem } from '../services/api';
import { AlertCircle, Edit2, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import axios from 'axios';

export const InventoryView = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getInventory();
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    // Front-end validation before hitting API
    if (editingItem.quantityOnHand === undefined || editingItem.quantityOnHand < 0) {
      setError("Quantity cannot be negative.");
      setIsSubmitting(false);
      return;
    }
    if (!editingItem.sku || editingItem.sku.trim() === '') {
      setError("SKU is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingItem.id) {
        await updateInventoryItem(editingItem.id, editingItem);
      } else {
        await createInventoryItem(editingItem);
      }
      setIsModalOpen(false);
      fetchData();
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
    } catch (err: any) {
      setError("Failed to delete item.");
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-sm text-gray-500">Manage warehouse stock, locations, and reorder levels.</p>
        </div>
      </div>

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
              {items.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.quantityOnHand} {item.unit}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.warehouseLocation || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.reorderThreshold !== undefined ? item.reorderThreshold : '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(item.costPerUnit)}</td>
                  <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                    <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-900">
                      <Edit2 className="w-4 h-4"/>
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </td>
                </tr>
              ))}
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
              <input required type="text" value={editingItem?.sku || ''} onChange={e => setEditingItem({...editingItem, sku: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. WH-101" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input required type="text" value={editingItem?.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="Item Name" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={editingItem?.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity On Hand</label>
              <input required type="number" min="0" value={editingItem?.quantityOnHand ?? ''} onChange={e => setEditingItem({...editingItem, quantityOnHand: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit (e.g. kg, units)</label>
              <input type="text" value={editingItem?.unit || ''} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input type="text" value={editingItem?.warehouseLocation || ''} onChange={e => setEditingItem({...editingItem, warehouseLocation: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="Aisle 4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reorder Thresh.</label>
              <input type="number" min="0" value={editingItem?.reorderThreshold ?? ''} onChange={e => setEditingItem({...editingItem, reorderThreshold: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cost/Unit (₹)</label>
              <input type="number" step="0.01" min="0" value={editingItem?.costPerUnit ?? ''} onChange={e => setEditingItem({...editingItem, costPerUnit: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50 mt-4">
            {isSubmitting ? "Saving..." : "Save Item"}
          </button>
        </form>
      </Modal>
    </div>
  );
};
