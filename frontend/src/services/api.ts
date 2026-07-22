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

export interface DeliveryOrder {
  id: number;
  destinationLat: number;
  destinationLng: number;
  deadline: string;
  weightKg: number;
  priority: number;
}

export interface DeliverySlot {
  id: number;
  startTime: string;
  endTime: string;
  maxCapacityKg: number;
  vehicleId: string;
}

export interface SlotAssignment {
  id: number;
  order: DeliveryOrder;
  slot: DeliverySlot;
  assignedAt: string;
  estimatedDistanceKm: number;
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

export interface ShiftOptimizationResponse {
  assignments: ShiftAssignment[];
  totalCost: number;
  solveTimeMs: number;
}

export interface DeliveryOptimizationResponse {
  assignments: SlotAssignment[];
  totalDistanceKm: number;
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

export const getDeliveryOrders = () => api.get<DeliveryOrder[]>('/delivery-orders');
export const createDeliveryOrder = (order: Partial<DeliveryOrder>) => api.post<DeliveryOrder>('/delivery-orders', order);
export const updateDeliveryOrder = (id: number, order: Partial<DeliveryOrder>) => api.put<DeliveryOrder>(`/delivery-orders/${id}`, order);
export const deleteDeliveryOrder = (id: number) => api.delete(`/delivery-orders/${id}`);

export const getDeliverySlots = () => api.get<DeliverySlot[]>('/delivery-slots');
export const createDeliverySlot = (slot: Partial<DeliverySlot>) => api.post<DeliverySlot>('/delivery-slots', slot);
export const updateDeliverySlot = (id: number, slot: Partial<DeliverySlot>) => api.put<DeliverySlot>(`/delivery-slots/${id}`, slot);
export const deleteDeliverySlot = (id: number) => api.delete(`/delivery-slots/${id}`);

export const getSlotAssignments = (slotId: number) => api.get<SlotAssignment[]>(`/delivery-slots/${slotId}/assignments`);
export const optimizeDelivery = () => api.post<DeliveryOptimizationResponse>('/optimize/delivery');

export const getInventory = () => api.get<InventoryItem[]>('/inventory');
export const createInventoryItem = (item: Partial<InventoryItem>) => api.post<InventoryItem>('/inventory', item);
export const updateInventoryItem = (id: number, item: Partial<InventoryItem>) => api.put<InventoryItem>(`/inventory/${id}`, item);
export const deleteInventoryItem = (id: number) => api.delete(`/inventory/${id}`);

export const resetDatabase = () => api.delete('/reset');

export default api;
