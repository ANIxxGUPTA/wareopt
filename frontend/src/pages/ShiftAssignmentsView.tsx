import { useEffect, useState } from 'react';
import { getShifts, optimizeShifts } from '../services/api';
import type { Shift, ShiftAssignment } from '../services/api';
import { AlertCircle, Loader2, Play } from 'lucide-react';
import axios from 'axios';

export const ShiftAssignmentsView = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [resultStats, setResultStats] = useState<{cost: number, time: number} | null>(null);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const res = await getShifts();
      setShifts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    setResultStats(null);
    
    try {
      const res = await optimizeShifts();
      setAssignments(res.data.assignments);
      setResultStats({
        cost: res.data.totalCost,
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

  // Group assignments by shift
  const assignmentsByShift = assignments.reduce((acc, curr) => {
    if (!acc[curr.shift.id]) acc[curr.shift.id] = [];
    acc[curr.shift.id].push(curr);
    return acc;
  }, {} as Record<number, ShiftAssignment[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shift Assignments</h2>
          <p className="text-sm text-gray-500">Run CP-SAT solver to assign workers to shifts minimizing cost.</p>
        </div>
        <button
          onClick={handleOptimize}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
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
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Labor Cost</p>
            <p className="text-2xl font-bold text-emerald-600">${resultStats.cost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Solve Time</p>
            <p className="text-2xl font-bold text-emerald-600">{resultStats.time} ms</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day / Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Req. Workers</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Roster</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shifts.map((shift) => {
              const assigned = assignmentsByShift[shift.id] || [];
              return (
                <tr key={shift.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    Day {shift.dayOfWeek} • {shift.startTime} - {shift.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shift.requiredWorkerCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shift.requiredSkill || 'Any'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {assigned.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assigned.map(a => (
                          <span key={a.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {a.worker.name} (${a.worker.hourlyCost}/hr)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No assignments yet</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
