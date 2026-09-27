import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Flag,
  Award,
  Package,
  User,
  Search,
  Filter,
  X,
  Plus
} from 'lucide-react';

const EVENT_COLORS = {
  TASK: 'bg-blue-100 text-blue-700 border-blue-200',
  FEATURE: 'bg-teal-100 text-teal-700 border-teal-200',
  BUG: 'bg-orange-100 text-orange-700 border-orange-200',
  MILESTONE: 'bg-amber-100 text-amber-700 border-amber-200',
  REVIEW: 'bg-purple-100 text-purple-700 border-purple-200',
  RELEASE: 'bg-orange-900 text-orange-100 border-orange-800' // Brown-ish
};

const EVENT_ICONS = {
  TASK: <CheckCircle2 className="w-3 h-3 mr-1" />,
  FEATURE: <CheckCircle2 className="w-3 h-3 mr-1" />,
  BUG: <AlertCircle className="w-3 h-3 mr-1" />,
  MILESTONE: <Flag className="w-3 h-3 mr-1" />,
  REVIEW: <Award className="w-3 h-3 mr-1" />,
  RELEASE: <Package className="w-3 h-3 mr-1" />
};

export const CommonCalendarPage = ({ facultyMode = false, coordinatorMode = false, specificProjectId = null }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    TASK: true, FEATURE: true, BUG: true, MILESTONE: true, REVIEW: true, RELEASE: true
  });
  const [selectedDayInfo, setSelectedDayInfo] = useState(null); // { dateStr, events }
  
  // Quick Add Task State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', startDate: '', dueDate: '', showInKanban: true });

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-events', specificProjectId],
    queryFn: async () => {
      const url = specificProjectId ? `/calendar/events?projectId=${specificProjectId}` : '/calendar/events';
      const res = await API.get(url);
      return res.data;
    }
  });

  const events = data?.events || [];

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const payload = { ...taskData, isCalendarEventOnly: !taskData.showInKanban };
      const res = await API.post('/agile/tasks', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-events']);
      setIsTaskModalOpen(false);
      setNewTask({ title: '', description: '', startDate: '', dueDate: '', showInKanban: true });
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to create task');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, taskData }) => {
      const payload = { ...taskData, isCalendarEventOnly: !taskData.showInKanban };
      const res = await API.put(`/agile/tasks/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-events']);
      setIsTaskModalOpen(false);
      setEditingEventId(null);
      setNewTask({ title: '', description: '', startDate: '', dueDate: '', showInKanban: true });
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update task');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.delete(`/agile/tasks/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-events']);
      setIsTaskModalOpen(false);
      setEditingEventId(null);
    }
  });

  if (isLoading) return <LoadingSpinner text="Synchronizing Project Calendar..." />;

  const handleCreateTaskSubmit = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    if (editingEventId) {
       updateTaskMutation.mutate({ id: editingEventId, taskData: newTask });
    } else {
       createTaskMutation.mutate(newTask);
    }
  };

  // Filter events
  const filteredEvents = events.filter(ev => {
    if (!activeFilters[ev.type]) return false;
    if (searchTerm) {
       const term = searchTerm.toLowerCase();
       return ev.title.toLowerCase().includes(term) || ev.responsible.toLowerCase().includes(term);
    }
    return true;
  });

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const isToday = (d) => {
    const t = new Date();
    return d === t.getDate() && month === t.getMonth() && year === t.getFullYear();
  };

  const getEventsForDay = (d) => {
    const currentCellDate = new Date(year, month, d);
    currentCellDate.setHours(0, 0, 0, 0);

    return filteredEvents.filter(ev => {
       if (!ev.start) return false;
       const startDate = new Date(ev.start);
       startDate.setHours(0, 0, 0, 0);
       
       const endDate = new Date(ev.end || ev.start);
       endDate.setHours(0, 0, 0, 0);

       return currentCellDate >= startDate && currentCellDate <= endDate;
    });
  };

  const getEventColor = (ev) => {
    let isDone = false;
    
    if (ev.type === 'TASK') isDone = ev.details?.status === 'DONE';
    if (ev.type === 'FEATURE') {
       const checklist = ev.details?.checklistItems || [];
       const progress = checklist.length > 0 ? Math.round((checklist.filter(c => c.isCompleted).length / checklist.length) * 100) : 0;
       isDone = progress === 100 || (ev.details?.status === 'DONE' && checklist.length === 0);
    }
    if (ev.type === 'BUG') isDone = ev.details?.status === 'FIXED' || ev.details?.status === 'CLOSED' || ev.details?.status === 'RESOLVED';
    if (ev.type === 'MILESTONE') isDone = ev.details?.status === 'COMPLETED';
    if (ev.type === 'REVIEW') isDone = ev.details?.status === 'COMPLETED' || ev.details?.status === 'PUBLISHED';
    if (ev.type === 'RELEASE') isDone = ev.details?.status === 'RELEASED';

    const isOverdue = !isDone && ev.end && new Date(ev.end).setHours(23,59,59,999) < new Date().getTime();
    
    // Check if it was completed AFTER the deadline
    const isCompletedLate = isDone && ev.end && ev.details?.updatedAt && new Date(ev.end).setHours(23,59,59,999) < new Date(ev.details.updatedAt).getTime();

    if (isCompletedLate) return 'bg-pink-100 text-pink-800 border-pink-300 opacity-80 line-through';
    if (isDone) return 'bg-slate-100 text-slate-500 border-slate-200 opacity-60 line-through';
    if (isOverdue) return 'bg-red-100 text-red-800 border-red-300 font-bold shadow-sm'; 

    return EVENT_COLORS[ev.type];
  };

  const handleEventClick = (ev, e) => {
    if (e) e.stopPropagation();
    
    // If it's a calendar-only event, open the modal for edit/delete
    if (ev.type === 'TASK' && ev.details?.isCalendarEventOnly) {
       setEditingEventId(ev.details._id);
       setNewTask({
          title: ev.details.title || '',
          description: ev.details.description || '',
          startDate: ev.details.startDate ? new Date(ev.details.startDate).toISOString().split('T')[0] : '',
          dueDate: ev.details.dueDate ? new Date(ev.details.dueDate).toISOString().split('T')[0] : '',
          showInKanban: false
       });
       setIsTaskModalOpen(true);
       return;
    }

    if (coordinatorMode) {
      navigate('/coordinator/reviews');
      return;
    }

    if (ev.type === 'TASK') navigate('/student/kanban');
    if (ev.type === 'FEATURE') navigate('/student/features');
    if (ev.type === 'BUG') navigate('/student/bugs');
    if (ev.type === 'MILESTONE') navigate('/student/milestones');
    if (ev.type === 'REVIEW') navigate('/student/marks');
    if (ev.type === 'RELEASE') navigate('/student/releases');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition"><ChevronLeft className="w-5 h-5 text-slate-600"/></button>
          <h2 className="text-2xl font-bold text-slate-800 w-48 text-center">{monthNames[month]} {year}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition"><ChevronRight className="w-5 h-5 text-slate-600"/></button>
          <button onClick={today} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition">Today</button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search events, people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          {coordinatorMode ? (
            <button 
              onClick={() => navigate('/coordinator/reviews')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Schedule Review
            </button>
          ) : !facultyMode && (
            <button 
              onClick={() => {
                setEditingEventId(null);
                setNewTask({ title: '', description: '', startDate: '', dueDate: '', showInKanban: true });
                setIsTaskModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Quick Add Task
            </button>
          )}
        </div>
      </div>

      {/* Filters & Legend */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-2">
           {coordinatorMode ? (
             <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center shadow-xs">
               <Award className="w-3.5 h-3.5 mr-1.5" /> DEPARTMENT REVIEWS & ACADEMIC SCHEDULE
             </span>
           ) : (
             Object.keys(activeFilters).map(type => (
               <button 
                 key={type}
                 onClick={() => setActiveFilters(prev => ({...prev, [type]: !prev[type]}))}
                 className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center border ${
                   activeFilters[type] ? EVENT_COLORS[type] : 'bg-white text-slate-400 border-slate-200'
                 }`}
               >
                 {EVENT_ICONS[type]} {type}
               </button>
             ))
           )}
        </div>

        {/* Status Legend */}
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Completed
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-400"></span> Completed Late
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_4px_rgba(244,63,94,0.6)]"></span> Overdue
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
          {/* Empty cells before start of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="border-r border-b border-slate-100 bg-slate-50/50 p-2"></div>
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            return (
              <div key={day} className="border-r border-b border-slate-100 p-2 hover:bg-slate-50 transition-colors group relative min-h-[120px]">
                <div className={`text-sm font-semibold mb-2 w-7 h-7 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                  {day}
                </div>
                
                <div className="space-y-1.5 mt-1 relative z-10">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div 
                      key={ev.id} 
                      onClick={(e) => handleEventClick(ev, e)}
                      className={`px-2 py-1.5 rounded text-[10px] font-medium border truncate flex flex-col cursor-pointer hover:shadow-md transition-shadow ${getEventColor(ev)}`} 
                      title={ev.title}
                    >
                      <div className="flex items-center font-bold">
                        {EVENT_ICONS[ev.type]} <span className="truncate">{ev.title}</span>
                      </div>
                      <span className="text-[9px] opacity-80 mt-0.5 flex items-center gap-1"><User className="w-2.5 h-2.5"/> {ev.responsible}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div 
                      onClick={() => setSelectedDayInfo({ dateStr: `${day} ${monthNames[month]} ${year}`, events: dayEvents })}
                      className="text-[10px] font-bold text-slate-400 pl-1 cursor-pointer hover:text-indigo-600"
                    >
                      + {dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MORE EVENTS MODAL */}
      {selectedDayInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedDayInfo(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" /> Events for {selectedDayInfo.dateStr}
              </h2>
              <button onClick={() => setSelectedDayInfo(null)} className="text-slate-400 hover:text-slate-600"><span className="text-xl leading-none">&times;</span></button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {selectedDayInfo.events.map(ev => (
                <div 
                  key={ev.id} 
                  onClick={(e) => handleEventClick(ev, e)}
                  className={`p-3 rounded-lg border flex flex-col gap-1 cursor-pointer hover:shadow-md transition-all ${getEventColor(ev)}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center font-bold text-sm">
                      {EVENT_ICONS[ev.type]} <span>{ev.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs opacity-80 mt-1 font-semibold">
                    <span className="flex items-center gap-1"><User className="w-3 h-3"/> {ev.responsible}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {ev.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                {editingEventId ? 'Edit Event' : 'Quick Add Task'}
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTaskSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  placeholder="e.g., Team Meeting"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea 
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow min-h-[80px]"
                  placeholder="Brief details..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                 <input 
                   type="checkbox" 
                   id="showInKanban"
                   checked={newTask.showInKanban}
                   onChange={(e) => setNewTask({...newTask, showInKanban: e.target.checked})}
                   className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                 />
                 <label htmlFor="showInKanban" className="text-sm font-medium text-slate-700">
                   Show in Kanban Board
                 </label>
              </div>

              <div className="pt-4 flex justify-between gap-3 border-t border-slate-100">
                {editingEventId ? (
                   <button 
                     type="button" 
                     onClick={() => {
                        if (confirm('Are you sure you want to delete this event?')) {
                           deleteTaskMutation.mutate(editingEventId);
                        }
                     }}
                     className="px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium text-sm rounded-lg transition-colors"
                   >
                     Delete
                   </button>
                ) : <div/>}

                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending || !newTask.title.trim()}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    {(createTaskMutation.isPending || updateTaskMutation.isPending) ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonCalendarPage;
