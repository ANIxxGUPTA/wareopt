import React, { useEffect, useState } from 'react';
import { getShifts, optimizeShifts, getWorkers, createWorker, updateWorker, deleteWorker, createShift, updateShift, deleteShift } from '../services/api';
import type { Shift, ShiftAssignment, Worker } from '../services/api';
import { AlertCircle, Loader2, Play, Plus, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { Modal } from '../components/Modal';

export const ShiftAssignmentsView = () => {
  const location = useLocation();
  const initialTab = location.state?.tab || 'optimize';
  const [activeTab, setActiveTab] = useState<'optimize' | 'workers' | 'shifts'>(initialTab);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | string[] | null>(null);
  
  const [resultStats, setResultStats] = useState<{cost: number, time: number} | null>(null);

  // Modal states
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Partial<Worker> | null>(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [editingShift, setEditingShift] = useState<Partial<Shift> | null>(null);

  const [isSubmittingWorker, setIsSubmittingWorker] = useState(false);
  const [isSubmittingShift, setIsSubmittingShift] = useState(false);

  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    
    if (endMinutes === 0 || endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    return (endMinutes - startMinutes) / 60;
  };
  const duration = calculateDuration(editingShift?.startTime, editingShift?.endTime);

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (error && (isWorkerModalOpen || isShiftModalOpen)) setError(null);
  }, [editingWorker, editingShift, skillsInput]);

  const fetchData = async () => {
    try {
      const [shiftRes, workerRes] = await Promise.all([getShifts(), getWorkers()]);
      setShifts(shiftRes.data);
      setWorkers(workerRes.data);
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
      const res = await optimizeShifts();
      setAssignments(res.data.assignments);
      setResultStats({
        cost: res.data.totalCost,
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

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmittingWorker(true);
    try {
      const skillsArray = skillsInput ? skillsInput.split(',').map(s => s.trim()).filter(Boolean) : [];
      const payload = { ...editingWorker, skills: skillsArray };
      if (editingWorker?.id) {
        await updateWorker(editingWorker.id, payload);
      } else {
        await createWorker(payload as Worker);
      }
      setIsWorkerModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save worker.");
    } finally {
      setIsSubmittingWorker(false);
    }
  };

  const handleDeleteWorker = async (id: number) => {
    if (!window.confirm("Delete this worker?")) return;
    try {
      await deleteWorker(id);
      fetchData();
    } catch (err: any) {
      setError("Failed to delete worker.");
    }
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmittingShift(true);
    try {
      if (editingShift?.id) {
        await updateShift(editingShift.id, editingShift);
      } else {
        await createShift(editingShift as Shift);
      }
      setIsShiftModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save shift.");
    } finally {
      setIsSubmittingShift(false);
    }
  };

  const handleDeleteShift = async (id: number) => {
    if (!window.confirm("Delete this shift?")) return;
    try {
      await deleteShift(id);
      fetchData();
    } catch (err: any) {
      setError("Failed to delete shift.");
    }
  };

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
          <p className="text-sm text-gray-500">Manage workers, shifts, and run optimization.</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('optimize')}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${activeTab === 'optimize' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Optimization & Results
        </button>
        <button
          onClick={() => setActiveTab('workers')}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${activeTab === 'workers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Manage Workers
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${activeTab === 'shifts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Manage Shifts
        </button>
      </div>

      {error && !isWorkerModalOpen && !isShiftModalOpen && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="text-red-700 text-sm font-medium">
             {Array.isArray(error) ? (
                <ul className="list-disc pl-4 space-y-1">
                   {error.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
             ) : (
                <p>{error}</p>
             )}
          </div>
        </div>
      )}

      {activeTab === 'workers' && (
        <div className="space-y-4">
          <button onClick={() => { setEditingWorker({}); setSkillsInput(""); setIsWorkerModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Worker
          </button>
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost/Hr</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Hrs/Wk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skills</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workers.map(w => (
                  <tr key={w.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{w.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatINR(w.hourlyCost)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{w.maxHoursPerWeek}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{w.skills?.join(', ')}</td>
                    <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                      <button onClick={() => { setEditingWorker(w); setSkillsInput(w.skills?.join(', ') || ""); setIsWorkerModalOpen(true); }} className="text-blue-600 hover:text-blue-900"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteWorker(w.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <button onClick={() => { setEditingShift({ dayOfWeek: 1 }); setIsShiftModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Shift
          </button>
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day / Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Req. Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shifts.map(s => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">Day {s.dayOfWeek} • {s.startTime} - {s.endTime}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.requiredWorkerCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.requiredSkill}</td>
                    <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                      <button onClick={() => { setEditingShift(s); setIsShiftModalOpen(true); }} className="text-blue-600 hover:text-blue-900"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteShift(s.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4"/></button>
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Optimization
            </button>
          </div>

          {resultStats && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 flex gap-8">
              <div>
                <p className="text-sm font-medium text-gray-500">TOTAL LABOR COST</p>
                <p className="text-2xl font-bold text-emerald-600">{formatINR(resultStats.cost)}</p>
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
                              <span key={a.id} className="text-gray-900 font-medium">
                                {a.worker.name} ({formatINR(a.worker.hourlyCost)}/hr)
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
      )}

      {/* Worker Modal */}
      <Modal isOpen={isWorkerModalOpen} onClose={() => { setIsWorkerModalOpen(false); setError(null); }} title={editingWorker?.id ? "Edit Worker" : "Add Worker"}>
        <form onSubmit={handleSaveWorker} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div className="text-red-700 text-sm font-medium">
                 {Array.isArray(error) ? (
                    <ul className="list-disc pl-4 space-y-1">
                       {error.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                 ) : (
                    <p>{error}</p>
                 )}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input required type="text" value={editingWorker?.name || ''} onChange={e => setEditingWorker({...editingWorker, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Priya Sharma" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hourly Cost (₹)</label>
              <input required type="number" step="0.01" value={editingWorker?.hourlyCost || ''} onChange={e => setEditingWorker({...editingWorker, hourlyCost: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. 200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Hours/Week</label>
              <input required type="number" min="1" value={editingWorker?.maxHoursPerWeek || ''} onChange={e => setEditingWorker({...editingWorker, maxHoursPerWeek: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. 40" />
              <p className="mt-1 text-xs text-gray-500">Must be enough to realistically cover assigned shifts</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
            <input required type="text" value={skillsInput} onChange={e => setSkillsInput(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. picking, packing" />
            <p className="mt-1 text-xs text-gray-500">Must exactly match the skill name used in Manage Shifts (lowercase, comma-separated)</p>
          </div>
          <button type="submit" disabled={isSubmittingWorker} className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50">
            {isSubmittingWorker ? "Saving..." : "Save Worker"}
          </button>
        </form>
      </Modal>

      {/* Shift Modal */}
      <Modal isOpen={isShiftModalOpen} onClose={() => { setIsShiftModalOpen(false); setError(null); }} title={editingShift?.id ? "Edit Shift" : "Add Shift"}>
        <form onSubmit={handleSaveShift} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div className="text-red-700 text-sm font-medium">
                 {Array.isArray(error) ? (
                    <ul className="list-disc pl-4 space-y-1">
                       {error.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                 ) : (
                    <p>{error}</p>
                 )}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Day of Week (1-7)</label>
            <input required type="number" min="1" max="7" value={editingShift?.dayOfWeek || ''} onChange={e => setEditingShift({...editingShift, dayOfWeek: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="1-7 (1 = Monday)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input required type="time" step="1" value={editingShift?.startTime || ''} onChange={e => setEditingShift({...editingShift, startTime: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
              <p className="mt-1 text-xs text-gray-500">End time must be later than start time on the same day</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input required type="time" step="1" value={editingShift?.endTime || ''} onChange={e => setEditingShift({...editingShift, endTime: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
              <p className="mt-1 text-xs text-gray-500">For overnight shifts ending at midnight, use 00:00:00 — this is interpreted as end of the current day.</p>
            </div>
          </div>
          {duration !== null && (
            <div className="bg-blue-50 text-blue-700 p-2 rounded-md text-sm font-medium">
              Duration: {duration.toFixed(1)} hours
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Required Workers</label>
              <input required type="number" min="1" value={editingShift?.requiredWorkerCount || ''} onChange={e => setEditingShift({...editingShift, requiredWorkerCount: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. 2" />
              <p className="mt-1 text-xs text-gray-500">Must not exceed the number of workers who have this skill</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Required Skill</label>
              <input required type="text" value={editingShift?.requiredSkill || ''} onChange={e => setEditingShift({...editingShift, requiredSkill: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. picking" />
              <p className="mt-1 text-xs text-gray-500">Must exactly match a skill entered for at least one worker</p>
            </div>
          </div>
          <button type="submit" disabled={isSubmittingShift} className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50">
            {isSubmittingShift ? "Saving..." : "Save Shift"}
          </button>
        </form>
      </Modal>

    </div>
  );
};
