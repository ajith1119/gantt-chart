import React from 'react';
import { formatDate, getDaysBetween } from '../../utils/dateUtils';
import { ChevronRight, ChevronDown } from 'lucide-react';

export const TaskList = ({
  tasks,
  expandedTasks,
  onToggleExpand,
  onTaskUpdate
}) => {
  const getTaskLevel = (task) => {
    if (!task.parentId) return 0;
    const levels = task.parentId.split('.').length;
    return levels;
  };

  const hasChildren = (taskId) => {
    return tasks.some(task => task.parentId === taskId);
  };

  const isTaskVisible = (task) => {
    if (!task.parentId) return true;
    
    const parentIds = task.parentId.split('.');
    let currentParentId = '';
    
    for (const id of parentIds) {
      currentParentId = currentParentId ? `${currentParentId}.${id}` : id;
      if (!expandedTasks.has(currentParentId)) {
        return false;
      }
    }
    
    return true;
  };

  // Helper to sort tasks: parents before children, and only visible
  const getSortedVisibleTasks = () => {
    const result = [];
    const addTaskAndChildren = (parentId) => {
      tasks
        .filter(task => (task.parentId ?? null) === parentId)
        .forEach(task => {
          if (isTaskVisible(task)) {
            result.push(task);
            addTaskAndChildren(task.id);
          }
        });
    };
    addTaskAndChildren(null);
    return result;
  };

  const visibleTasks = getSortedVisibleTasks();

  return (
    <div className="w-96 border-r border-gray-200 bg-white">
      <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-4">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          <div className="col-span-5">Task Name</div>
          <div className="col-span-3">Start Date</div>
          <div className="col-span-3">End Date</div>
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-96">
        {visibleTasks.map((task) => {
          const level = getTaskLevel(task);
          const duration = getDaysBetween(task.startDate, task.endDate) + 1;
          const hasChildTasks = hasChildren(task.id);
          const isExpanded = expandedTasks.has(task.id);
          
          return (
            <div
              key={task.id}
              className={`
                border-b border-gray-100 p-3 hover:bg-gray-50 transition-colors
                ${level > 0 ? 'bg-gray-25' : 'bg-white'}
              `}
              style={{ paddingLeft: `${12 + level * 20}px` }}
            >
              <div className="grid grid-cols-12 gap-2 items-center text-sm">
                <div className="col-span-5 flex items-center">
                  {hasChildTasks && (
                    <button
                      onClick={() => onToggleExpand(task.id)}
                      className="mr-2 p-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                  )}
                  <span
                    className={`
                      font-medium truncate
                      ${level === 0 ? 'text-gray-900' : level === 1 ? 'text-gray-700' : 'text-gray-600'}
                    `}
                  >
                    {task.name}
                  </span>
                </div>
                
                <div className="col-span-3">
                  <input
                    type="date"
                    value={task.startDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newStartDate = new Date(e.target.value);
                      const duration = getDaysBetween(task.startDate, task.endDate);
                      const newEndDate = new Date(newStartDate);
                      newEndDate.setDate(newEndDate.getDate() + duration);
                      
                      onTaskUpdate({
                        ...task,
                        startDate: newStartDate,
                        endDate: newEndDate
                      });
                    }}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="col-span-3">
                  <input
                    type="date"
                    value={task.endDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newEndDate = new Date(e.target.value);
                      onTaskUpdate({
                        ...task,
                        endDate: newEndDate
                      });
                    }}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="col-span-1 text-gray-600 text-xs">
                  {duration} days
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
