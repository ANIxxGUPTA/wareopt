import { useEffect, useState } from 'react';
import { Users, Calendar, Truck, Box } from 'lucide-react';
import { getWorkers, getShifts, getDeliveryOrders, getDeliverySlots } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const DashboardHome = () => {
  const [counts, setCounts] = useState({ workers: 0, shifts: 0, orders: 0, slots: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getWorkers(), getShifts(), getDeliveryOrders(), getDeliverySlots()]).then(
      ([resWorkers, resShifts, resOrders, resSlots]) => {
        setCounts({
          workers: resWorkers.data.length,
          shifts: resShifts.data.length,
          orders: resOrders.data.length,
          slots: resSlots.data.length,
        });
      }
    ).catch(console.error);
  }, []);

  const stats = [
    { label: 'Total Workers', value: counts.workers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Shifts', value: counts.shifts, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Delivery Orders', value: counts.orders, icon: Box, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Delivery Slots', value: counts.slots, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/shifts')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Manage Shift Optimization
          </button>
          <button
            onClick={() => navigate('/deliveries')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Manage Delivery Routing
          </button>
        </div>
      </div>
    </div>
  );
};
