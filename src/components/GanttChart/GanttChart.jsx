import React, { useState, useMemo } from 'react';
import { TaskList } from './TaskList';
import { ChartArea } from './ChartArea';
import { Calendar, ZoomIn, ZoomOut } from 'lucide-react';

export const GanttChart = ({ tasks, onTaskUpdate }) => {
  const [config, setConfig] = useState({
    viewMode: 'day',
    columnWidth: 40,
    rowHeight: 48
  });
  
  const [expandedTasks, setExpandedTasks] = useState(
    new Set(tasks.filter(task => !task.parentId).map(task => task.id))
  );

  const { startDate, endDate } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      };
    }

    const allDates = tasks.flatMap(task => [task.startDate, task.endDate]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Add some padding
    const startDate = new Date(minDate);
    startDate.setDate(startDate.getDate() - 7);
    
    const endDate = new Date(maxDate);
    endDate.setDate(endDate.getDate() + 14);
    
    return { startDate, endDate };
  }, [tasks]);

  const handleToggleExpand = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleViewModeChange = (viewMode) => {
    const columnWidths = { day: 40, week: 100, month: 120 };
    setConfig(prev => ({
      ...prev,
      viewMode,
      columnWidth: columnWidths[viewMode]
    }));
  };

  const handleZoom = (direction) => {
    setConfig(prev => ({
      ...prev,
      columnWidth: direction === 'in' 
        ? Math.min(prev.columnWidth * 1.2, 200)
        : Math.max(prev.columnWidth * 0.8, 20)
    }));
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Project Gantt Chart</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['day', 'week', 'month'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleViewModeChange(mode)}
                  className={`
                    px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize
                    ${config.viewMode === mode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleZoom('out')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom('in')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <TaskList
          tasks={tasks}
          expandedTasks={expandedTasks}
          onToggleExpand={handleToggleExpand}
          onTaskUpdate={onTaskUpdate}
        />
        
        <ChartArea
          tasks={tasks}
          config={config}
          startDate={startDate}
          endDate={endDate}
          expandedTasks={expandedTasks}
          onTaskUpdate={onTaskUpdate}
          onToggleExpand={handleToggleExpand}
        />
      </div>
    </div>
  );
};
