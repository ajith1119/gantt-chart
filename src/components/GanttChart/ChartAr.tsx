import React, { useState, useCallback } from 'react';
import { Task, GanttConfig } from '../../types/gantt';
import { generateDateRange, getDaysBetween } from '../../utils/dateUtils';

interface ChartAreaProps {
  tasks: Task[];
  config: GanttConfig;
  startDate: Date;
  endDate: Date;
  expandedTasks: Set<string>;
  onTaskUpdate: (task: Task) => void;
}

export const ChartArea: React.FC<ChartAreaProps> = ({
  tasks,
  config,
  startDate,
  endDate,
  expandedTasks,
  onTaskUpdate
}) => {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    taskId: string | null;
    dragType: 'move' | 'resize-left' | 'resize-right' | null;
    startX: number;
    originalStartDate: Date | null;
    originalEndDate: Date | null;
  }>({
    isDragging: false,
    taskId: null,
    dragType: null,
    startX: 0,
    originalStartDate: null,
    originalEndDate: null
  });

  const dateRange = generateDateRange(startDate, endDate, config.viewMode);
  
  const getTaskLevel = (task: Task): number => {
    if (!task.parentId) return 0;
    return task.parentId.split('.').length;
  };

  const isTaskVisible = (task: Task): boolean => {
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

  const visibleTasks = tasks.filter(isTaskVisible);

  const getDatePosition = (date: Date): number => {
    const daysDiff = getDaysBetween(startDate, date);
    return daysDiff * config.columnWidth;
  };

  const getTaskWidth = (task: Task): number => {
    const duration = getDaysBetween(task.startDate, task.endDate) + 1;
    return duration * config.columnWidth;
  };

  const handleMouseDown = (e: React.MouseEvent, task: Task, dragType: 'move' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    setDragState({
      isDragging: true,
      taskId: task.id,
      dragType,
      startX: e.clientX,
      originalStartDate: new Date(task.startDate),
      originalEndDate: new Date(task.endDate)
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.taskId || !dragState.originalStartDate || !dragState.originalEndDate) return;

    const deltaX = e.clientX - dragState.startX;
    const daysDelta = Math.round(deltaX / config.columnWidth);

    const task = tasks.find(t => t.id === dragState.taskId);
    if (!task) return;

    let newStartDate = new Date(dragState.originalStartDate);
    let newEndDate = new Date(dragState.originalEndDate);

    if (dragState.dragType === 'move') {
      newStartDate.setDate(newStartDate.getDate() + daysDelta);
      newEndDate.setDate(newEndDate.getDate() + daysDelta);
    } else if (dragState.dragType === 'resize-left') {
      newStartDate.setDate(newStartDate.getDate() + daysDelta);
      if (newStartDate >= newEndDate) {
        newStartDate = new Date(newEndDate);
        newStartDate.setDate(newStartDate.getDate() - 1);
      }
    } else if (dragState.dragType === 'resize-right') {
      newEndDate.setDate(newEndDate.getDate() + daysDelta);
      if (newEndDate <= newStartDate) {
        newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + 1);
      }
    }

    onTaskUpdate({
      ...task,
      startDate: newStartDate,
      endDate: newEndDate
    });
  }, [dragState, tasks, config.columnWidth, onTaskUpdate]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      taskId: null,
      dragType: null,
      startX: 0,
      originalStartDate: null,
      originalEndDate: null
    });
  }, []);

  React.useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const formatHeaderDate = (date: Date): string => {
    if (config.viewMode === 'day') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (config.viewMode === 'week') {
      return `Week ${Math.ceil(date.getDate() / 7)}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
        <div className="flex" style={{ minWidth: `${dateRange.length * config.columnWidth}px` }}>
          {dateRange.map((date, index) => (
            <div
              key={index}
              className="border-r border-gray-200 p-2 text-center text-xs font-medium text-gray-700"
              style={{ width: config.columnWidth, minWidth: config.columnWidth }}
            >
              {formatHeaderDate(date)}
            </div>
          ))}
        </div>
      </div>

      {/* Chart Body */}
      <div className="relative" style={{ minWidth: `${dateRange.length * config.columnWidth}px` }}>
        {/* Grid Background */}
        <div className="absolute inset-0 pointer-events-none">
          {dateRange.map((_, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0 border-r border-gray-100"
              style={{
                left: index * config.columnWidth,
                width: config.columnWidth
              }}
            />
          ))}
        </div>

        {/* Task Bars */}
        {visibleTasks.map((task, index) => {
          const level = getTaskLevel(task);
          const left = getDatePosition(task.startDate);
          const width = getTaskWidth(task);
          const top = index * config.rowHeight + 8;

          return (
            <div key={task.id} className="relative">
              {/* Task Bar */}
              <div
                className={`
                  absolute rounded-md shadow-sm cursor-move transition-all duration-200
                  hover:shadow-md group
                  ${dragState.taskId === task.id ? 'z-20' : 'z-10'}
                `}
                style={{
                  left,
                  width,
                  top,
                  height: config.rowHeight - 16,
                  backgroundColor: task.color,
                  opacity: level > 0 ? 0.8 : 1
                }}
                onMouseDown={(e) => handleMouseDown(e, task, 'move')}
              >
                {/* Progress Bar */}
                <div
                  className="h-full rounded-md bg-black bg-opacity-20"
                  style={{ width: `${task.progress}%` }}
                />
                
                {/* Task Name */}
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-white text-xs font-medium truncate">
                    {task.name}
                  </span>
                </div>

                {/* Resize Handles */}
                <div
                  className="absolute left-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black bg-opacity-30 rounded-l-md transition-opacity"
                  onMouseDown={(e) => handleMouseDown(e, task, 'resize-left')}
                />
                <div
                  className="absolute right-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black bg-opacity-30 rounded-r-md transition-opacity"
                  onMouseDown={(e) => handleMouseDown(e, task, 'resize-right')}
                />
              </div>

              {/* Row Background */}
              <div
                className={`
                  absolute left-0 right-0 border-b border-gray-50
                  ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}
                `}
                style={{
                  top: index * config.rowHeight,
                  height: config.rowHeight
                }}
              />
            </div>
          );
        })}



{/*<svg
  className="absolute top-0 left-0 pointer-events-none"
  width="100%"
  height={visibleTasks.length * config.rowHeight}
  style={{ zIndex: 5 }}
>
  {visibleTasks.map((task, index) => {
    if (!task.parentId) return null;
    const parent = visibleTasks.find(t => t.id === task.parentId);
    if (!parent) return null;

    const parentIndex = visibleTasks.indexOf(parent);
    const parentLeft = getDatePosition(parent.endDate);
    const parentTop = parentIndex * config.rowHeight + config.rowHeight / 2;
    const childLeft = getDatePosition(task.startDate);
    const childTop = index * config.rowHeight + config.rowHeight / 2;

    const midX = parentLeft + (childLeft - parentLeft) * 0.3; // horizontal mid segment
    const turnX = midX + 20; // extra offset for smoother turn
    const path = `
      M ${parentLeft} ${parentTop}
      H ${turnX}
      V ${childTop}
      H ${childLeft}
    `;

    return (
      <path
        key={task.id}
        d={path}
        fill="none"
        stroke="#4B5563"
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
        opacity={0.8}
        strokeLinecap="round"
      />
    );
  })}
  <defs>
    <marker
      id="arrowhead"
      markerWidth="6"
      markerHeight="6"
      refX="5"
      refY="3"
      orient="auto"
    >
      <polygon points="0 0, 6 3, 0 6" fill="#4B5563" />
    </marker>
  </defs>
</svg>
*/}




<svg
  className="absolute top-0 left-0 pointer-events-none"
  width="100%"
  height={visibleTasks.length * config.rowHeight}
  style={{ zIndex: 5 }}
>
  <defs>
    <marker
      id="arrowhead"
      markerWidth="6"
      markerHeight="6"
      refX="5"
      refY="3"
      orient="auto"
    >
      <polygon points="0 0, 6 3, 0 6" fill="#4B5563" />
    </marker>
  </defs>

  {visibleTasks.map((task, index) => {
    if (!task.parentId) return null;
    const parent = visibleTasks.find(t => t.id === task.parentId);
    if (!parent) return null;

    const parentIndex = visibleTasks.indexOf(parent);
    const parentLeft = getDatePosition(parent.endDate);
    const parentTop = parentIndex * config.rowHeight + config.rowHeight / 2;
    const childLeft = getDatePosition(task.startDate);
    const childTop = index * config.rowHeight + config.rowHeight / 2;

    const path = `
      M ${parentLeft} ${parentTop}
      C ${parentLeft + 60} ${parentTop},
        ${childLeft - 60} ${childTop},
        ${childLeft} ${childTop}
    `;

    return (
      <path
        key={task.id}
        d={path}
        fill="none"
        stroke="#4B5563"
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
        opacity={0.8}
        strokeLinecap="round"
      />
    );
  })}
</svg>



      </div>
    </div>
  );
};

