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
export const getWorkers = () => api.get<Worker[]>('/workers');
export const getShiftAssignments = (shiftId: number) => api.get<ShiftAssignment[]>(`/shifts/${shiftId}/assignments`);
export const optimizeShifts = () => api.post<ShiftOptimizationResponse>('/optimize/shifts');

export const getDeliveryOrders = () => api.get<DeliveryOrder[]>('/delivery-orders');
export const getDeliverySlots = () => api.get<DeliverySlot[]>('/delivery-slots');
export const getSlotAssignments = (slotId: number) => api.get<SlotAssignment[]>(`/delivery-slots/${slotId}/assignments`);
export const optimizeDelivery = () => api.post<DeliveryOptimizationResponse>('/optimize/delivery');

export default api;
