import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


export interface Worker {
  id: number;
  name: string;
  hourlyCost: number;
  maxHoursPerWeek: number;
  skills: string[];
}

export interface Shift {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  requiredWorkerCount: number;
  requiredSkill: string;
}

export interface ShiftAssignment {
  id: number;
  worker: Worker;
  shift: Shift;
  assignedAt: string;
}



export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  description?: string;
  quantityOnHand: number;
  unit?: string;
  warehouseLocation?: string;
  reorderThreshold?: number;
  costPerUnit?: number;
  createdAt?: string;
  lastUpdated?: string;
}

export interface StockMovement {
  id: number;
  inventoryItemId: number;
  changeAmount: number;
  reason: 'MANUAL_ADJUSTMENT' | 'ORDER_FULFILLMENT' | 'RESTOCK' | 'CORRECTION';
  timestamp: string;
  note?: string;
}

export interface ShiftOptimizationResponse {
  assignments: ShiftAssignment[];
  totalCost: number;
  solveTimeMs: number;
}



export const getShifts = () => api.get<Shift[]>('/shifts');
export const createShift = (shift: Partial<Shift>) => api.post<Shift>('/shifts', shift);
export const updateShift = (id: number, shift: Partial<Shift>) => api.put<Shift>(`/shifts/${id}`, shift);
export const deleteShift = (id: number) => api.delete(`/shifts/${id}`);

export const getWorkers = () => api.get<Worker[]>('/workers');
export const createWorker = (worker: Partial<Worker>) => api.post<Worker>('/workers', worker);
export const updateWorker = (id: number, worker: Partial<Worker>) => api.put<Worker>(`/workers/${id}`, worker);
export const deleteWorker = (id: number) => api.delete(`/workers/${id}`);

export const getShiftAssignments = (shiftId: number) => api.get<ShiftAssignment[]>(`/shifts/${shiftId}/assignments`);
export const optimizeShifts = () => api.post<ShiftOptimizationResponse>('/optimize/shifts');

export const getInventory = () => api.get<InventoryItem[]>('/inventory');
export const getLowStockInventory = () => api.get<InventoryItem[]>('/inventory/low-stock');
export const createInventoryItem = async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'lastUpdated'>) => {
  const response = await api.post<InventoryItem>('/inventory', item);
  return response.data;
};

export const updateInventoryItem = async (id: number, item: Partial<InventoryItem>) => {
  const response = await api.put<InventoryItem>(`/inventory/${id}`, item);
  return response.data;
};

export const deleteInventoryItem = async (id: number) => {
  await api.delete(`/inventory/${id}`);
};

export const exportCsv = async () => {
  const response = await api.get('/inventory/export', { responseType: 'blob' });
  return response.data;
};


export const getInventoryItemHistory = (id: number) => api.get<StockMovement[]>(`/inventory/${id}/history`);

export const resetDatabase = () => api.delete('/reset');

export default api;
