import React, { useRef, useState, useCallback, useEffect } from 'react';
import { generateDateRange, getDaysBetween } from '../../utils/dateUtils';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { FaGripLines } from 'react-icons/fa';

export const ChartArea = ({
  tasks,
  config,
  startDate,
  endDate,
  expandedTasks,
  onTaskUpdate,
  onToggleExpand
}) => {
  const [dragState, setDragState] = useState({
    isDragging: false,
    taskId: null,
    dragType: null,
    startX: 0,
    originalStartDate: null,
    originalEndDate: null
  });

  const [isMobile, setIsMobile] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const [hoveredDateIndex, setHoveredDateIndex] = useState(null);
  const scrollRef = useRef(null);
  const didAutoScroll = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dateRange = generateDateRange(startDate, endDate, config.viewMode);

  const getTaskLevel = (task) => {
    if (!task.parentId) return 0;
    return task.parentId.split('.').length;
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

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.parentId === b.parentId) return 0;
    if (a.id === b.parentId) return -1;
    if (b.id === a.parentId) return 1;
    return 0;
  });

  const visibleTasks = sortedTasks.filter(isTaskVisible);

  const getDatePosition = (date) => {
    if (config.viewMode === 'day') {
      const daysDiff = getDaysBetween(startDate, date);
      return daysDiff * config.columnWidth;
    } else if (config.viewMode === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const firstMonday = new Date(startDate);
      firstMonday.setDate(firstMonday.getDate() - firstMonday.getDay() + 1);
      const weeksDiff = Math.floor((weekStart.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weeksDiff * config.columnWidth;
    } else if (config.viewMode === 'month') {
      const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
      return monthsDiff * config.columnWidth;
    }
    return 0;
  };

  const getTaskWidth = (task) => {
    if (config.viewMode === 'day') {
      const duration = getDaysBetween(task.startDate, task.endDate) + 1;
      return duration * config.columnWidth;
    } else if (config.viewMode === 'week') {
      const start = new Date(task.startDate);
      start.setDate(start.getDate() - start.getDay() + 1);
      const end = new Date(task.endDate);
      end.setDate(end.getDate() - end.getDay() + 1);
      const weeks = Math.floor((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      return weeks * config.columnWidth;
    } else if (config.viewMode === 'month') {
      const months = (task.endDate.getFullYear() - task.startDate.getFullYear()) * 12 +
        (task.endDate.getMonth() - task.startDate.getMonth()) + 1;
      return months * config.columnWidth;
    }
    return config.columnWidth;
  };

  const handleMouseDown = (e, task, dragType) => {
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

  const handleMouseMove = useCallback((e) => {
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

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const formatHeaderDate = (date) => {
    if (config.viewMode === 'day') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (config.viewMode === 'week') {
      return `W${Math.ceil(date.getDate() / 7)}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
  };

  const getTaskColor = (task) => {
    if (task.color) return task.color;
    const hue = (parseInt(task.id.replace(/\D/g, '').slice(-3)) % 36) * 10;
    return `hsl(${hue}, 78%, 56%)`;
  };

  const renderExpandButton = (task) => {
    const hasChildTasks = tasks.some(t => t.parentId === task.id);
    if (!hasChildTasks) return null;

    const isExpanded = expandedTasks.has(task.id);

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand(task.id);
        }}
        className="mr-1 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-500/80"
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
      </button>
    );
  };

  const calculateRowPositions = () => {
    const positions = {};
    let currentRow = 0;

    const processTask = (taskId, level) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task || !isTaskVisible(task)) return;

      positions[taskId] = currentRow;
      currentRow++;

      if (expandedTasks.has(taskId)) {
        const children = tasks.filter(t => t.parentId === taskId);
        children.forEach(child => processTask(child.id, level + 1));
      }
    };

    tasks.filter(t => !t.parentId).forEach(rootTask => {
      processTask(rootTask.id, 0);
    });

    return positions;
  };

  const rowPositions = calculateRowPositions();

  useEffect(() => {
    if (!scrollRef.current || didAutoScroll.current) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIndex = dateRange.findIndex(
      d => d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate()
    );
    if (todayIndex !== -1) {
      const scrollTo = todayIndex * config.columnWidth - 100;
      scrollRef.current.scrollLeft = Math.max(scrollTo, 0);
      didAutoScroll.current = true;
    }
  }, [dateRange, config.columnWidth]);



  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto bg-gradient-to-b from-white/60 to-gray-50/80 p-4 rounded-lg"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-20 shadow-sm rounded-md">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">GANTT RANGE</span>
              <span className="text-sm font-semibold text-gray-800">{startDate.toLocaleDateString()} — {endDate.toLocaleDateString()}</span>
            </div>
            <div className="hidden sm:flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full shadow-inner">
              <span className="mr-2">View</span>
              <span className="font-medium">{config.viewMode.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">Today</div>
            <div className="w-3 h-3 rounded-full bg-red-500 shadow" />
          </div>
        </div>

        <div className="flex" style={{ minWidth: `${dateRange.length * config.columnWidth}px` }}>
          {dateRange.map((date, index) => {
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isNewMonth = index === 0 || date.getMonth() !== dateRange[index - 1].getMonth();

            return (
              <div
                key={index}
                className={`relative border-r ${isWeekend ? 'bg-gray-50' : 'bg-white'} p-1 text-center text-[0.8rem] font-medium`}
                style={{
                  width: config.columnWidth,
                  minWidth: config.columnWidth,
                  height: isMobile ? '2.2rem' : '3.2rem'
                }}
                onMouseEnter={() => setHoveredDateIndex(index)}
                onMouseLeave={() => setHoveredDateIndex(null)}
              >
                <div className="flex flex-col h-full justify-center items-center">
                  <span className="text-[0.65rem] font-semibold text-gray-400">
                    {date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                  </span>
                  <span className="text-sm text-gray-700">
                    {formatHeaderDate(date)}
                  </span>
                </div>

                {isNewMonth && (
                  <div className="absolute left-1 top-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold shadow-sm">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                )}

                {/* Tooltip will be rendered here */}
                {hoveredDateIndex === index && (
                  <DateTasksTooltip
                    date={date}
                    tasks={visibleTasks}
                    getTaskLevel={getTaskLevel}
                    config={config}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart Body */}
      <div className="relative mt-3" style={{ minWidth: `${dateRange.length * config.columnWidth}px` }}>
        {/* Grid Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {dateRange.map((date, index) => {
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            return (
              <div
                key={index}
                className={`absolute top-0 bottom-0 border-r ${isWeekend ? 'border-transparent bg-gray-50/60' : 'border-gray-100'}`}
                style={{
                  left: index * config.columnWidth,
                  width: config.columnWidth
                }}
              />
            );
          })}
        </div>

        {/* Row Backgrounds */}
        {visibleTasks.map((task) => (
          <div
            key={task.id + '-bg'}
            className={`absolute left-0 right-0 border-b ${rowPositions[task.id] % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            style={{
              top: rowPositions[task.id] * config.rowHeight,
              height: config.rowHeight,
              zIndex: 1
            }}
          />
        ))}

        {/* Task Bars */}
        {visibleTasks.map((task) => {
          const level = getTaskLevel(task);
          const left = getDatePosition(task.startDate);
          const width = getTaskWidth(task);
          const top = rowPositions[task.id] * config.rowHeight + 8;
          const hasChildTasks = tasks.some(t => t.parentId === task.id);
          const taskColor = getTaskColor(task);
          const darkerColor = taskColor.includes('hsl') ? taskColor.replace('56%)', '46%)').replace('60%)', '50%)') : taskColor;

          return (
            <div
              key={task.id}
              className="relative z-10"
              onMouseEnter={() => setHoveredTaskId(task.id)}
              onMouseLeave={() => setHoveredTaskId(null)}
            >
              {/* Task Bar */}
              <div
                className={`absolute rounded-xl cursor-move transition-all duration-200 group`}
                style={{
                  left,
                  width,
                  top,
                  height: config.rowHeight - 18,
                  background: `linear-gradient(90deg, ${taskColor}, ${darkerColor})`,
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: hoveredTaskId === task.id ? '0 8px 24px rgba(16,24,40,0.18)' : '0 4px 10px rgba(16,24,40,0.08)',
                  opacity: level > 0 ? 0.95 : 1,
                  paddingLeft: hasChildTasks ? '1.6rem' : '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'visible',
                  transform: hoveredTaskId === task.id ? 'translateY(-2px)' : 'none'
                }}
                onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                onClick={() => hasChildTasks && onToggleExpand(task.id)}
                role="button"
                aria-label={`${task.name} - ${getDaysBetween(task.startDate, task.endDate) + 1} days`}
              >
                {/* Left Grip / Expand area */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {hasChildTasks && (
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white/8 backdrop-blur-sm">
                      {renderExpandButton(task)}
                    </div>
                  )}
                  {!hasChildTasks && (
                    <div className="hidden sm:flex items-center justify-center w-6 h-6 rounded-md bg-white/6 hover:bg-white/10 p-1">
                      <FaGripLines size={12} className="text-white/80 opacity-90" />
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {task.progress > 0 && (
                  <div
                    className="h-full rounded-l-xl rounded-r-xl bg-white/20 transition-all"
                    style={{
                      width: `${task.progress}%`,
                      maxWidth: '100%',
                      backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0, rgba(255,255,255,0.18) 10px, transparent 10px, transparent 20px)'
                    }}
                  />
                )}

                {/* Task Name */}
                <div className="absolute inset-0 flex items-center px-6 pointer-events-none">
                  <span className="text-white text-sm font-semibold truncate drop-shadow-md">
                    {task.name}
                  </span>
                </div>

                {/* Resize Handles */}
                <div
                  className="absolute left-0 top-0 w-3 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 rounded-l-xl transition-opacity hover:brightness-110"
                  onMouseDown={(e) => handleMouseDown(e, task, 'resize-left')}
                  style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.06), transparent)' }}
                />
                <div
                  className="absolute right-0 top-0 w-3 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 rounded-r-xl transition-opacity hover:brightness-110"
                  onMouseDown={(e) => handleMouseDown(e, task, 'resize-right')}
                  style={{ background: 'linear-gradient(270deg, rgba(0,0,0,0.06), transparent)' }}
                />

                {/* Dates Tooltip */}
                <div
                  className="absolute left-[-13.5rem] top-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900/95 to-gray-800/95 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl"
                  style={{ minWidth: '12rem', maxWidth: '18rem' }}
                >
                  <div className="font-semibold">{task.name}</div>
                  <div className="text-gray-300 text-[0.82rem]">
                    {task.startDate.toLocaleDateString()} - {task.endDate.toLocaleDateString()}
                  </div>
                  <div className="text-gray-400 text-[0.78rem]">
                    {getDaysBetween(task.startDate, task.endDate) + 1} days
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Today Line */}
        {(() => {
          const today = new Date();
          // Remove time for accurate comparison
          today.setHours(0, 0, 0, 0);
          // Only show if today is in range
          if (today >= startDate && today <= endDate) {
            const left = getDatePosition(today) + config.columnWidth / 2;
            const chartHeight = visibleTasks.length * config.rowHeight;

            return (
              <div
                className="pointer-events-none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left,
                  width: '3px',
                  height: `${chartHeight}px`,
                  background: 'linear-gradient(180deg, rgba(244,63,94,1), rgba(249,115,22,0.9))',
                  boxShadow: '0 0 8px rgba(249,115,22,0.6)',
                  zIndex: 30,
                }}
              />
            );
          }
          return null;
        })()}

        {/* Dependency Arrows */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          width="100%"
          height={visibleTasks.length * config.rowHeight}
          style={{ zIndex: 5 }}
        >
          <defs>
            <linearGradient id="arrowGrad" x1="0" x2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 6 3, 0 6" fill="url(#arrowGrad)" />
            </marker>
          </defs>

          {visibleTasks.map((task, index) => {
            if (!task.parentId) return null;

            const parent = visibleTasks.find(t => t.id === task.parentId);
            if (!parent) return null;

            const parentIndex = visibleTasks.indexOf(parent);
            const childIndex = visibleTasks.indexOf(task);

            // Calculate positions
            const parentStartX = getDatePosition(parent.startDate);
            const childStartX = getDatePosition(task.startDate);

            const parentTop = parentIndex * config.rowHeight + config.rowHeight / 2;
            const childTop = childIndex * config.rowHeight + config.rowHeight / 2;

            // Path calculation (same as before)
            const lineGap = 18;
            const verticalGap = 12;
            const arrowOffset = 6;

            const startX = parentStartX + 8;
            let endX = childStartX - arrowOffset;

            const isChildBelow = childTop > parentTop;
            const verticalDirection = isChildBelow ? 1 : -1;

            const midX1 = startX + lineGap;
            const midY1 = parentTop;
            const midX2 = midX1;
            const midY2 = childTop - (verticalDirection * verticalGap);
            const midX3 = endX - lineGap;
            const midY3 = midY2;
            const midX4 = midX3;
            const midY4 = childTop;

            const path = `
              M ${startX} ${parentTop}
              L ${midX1} ${midY1}
              L ${midX2} ${midY2}
              L ${midX3} ${midY3}
              L ${midX4} ${midY4}
              L ${endX} ${childTop}
            `;

            // Determine dependency level for color
            const parentLevel = getTaskLevel(parent);
            const childLevel = getTaskLevel(task);

            let color = "url(#arrowGrad)"; // gradient
            if (parentLevel === 0 && childLevel === 1) color = "#3b82f6"; // blue for main->sub
            if (parentLevel === 1 && childLevel === 2) color = "#10b981"; // green for sub->subsub

            // Highlight if hovered
            const isHighlighted =
              hoveredTaskId === parent.id || hoveredTaskId === task.id;

            return (
              <path
                key={`dependency-${task.id}`}
                d={path}
                fill="none"
                stroke={typeof color === 'string' && color.startsWith('url') ? '#f59e0b' : color}
                strokeWidth={isHighlighted ? 3 : 1.8}
                markerEnd="url(#arrowhead)"
                opacity={isHighlighted ? 1 : 0.85}
                strokeLinejoin="round"
                style={{
                  filter: isHighlighted ? "drop-shadow(0 0 6px rgba(0,0,0,0.18))" : "none"
                }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const DateTasksTooltip = ({ date, tasks, getTaskLevel, config }) => {
  const activeTasks = tasks.filter(
    (task) =>
      !tasks.some(t => t.parentId === task.id) &&
      date >= new Date(new Date(task.startDate).setHours(0, 0, 0, 0)) &&
      date <= new Date(new Date(task.endDate).setHours(23, 59, 59, 999))
  );

  if (activeTasks.length === 0) return null;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-gradient-to-br from-gray-900/95 to-gray-800/95 text-white text-xs rounded-lg shadow-2xl px-4 py-3 z-50 min-w-[12rem] max-w-[20rem]"
      style={{ pointerEvents: 'none' }}
    >
      <div className="font-semibold mb-1 text-[0.9rem]">
        {date.toLocaleDateString()} — {activeTasks.length} work{activeTasks.length > 1 ? 's' : ''}
      </div>
      <ul>
        {activeTasks.map((task) => (
          <li key={task.id} className="mb-2 flex items-start gap-3">
            <span
              className="inline-block w-3 h-3 rounded-full mt-1"
              style={{ background: task.color || '#3b82f6' }}
            />
            <div>
              <div className={`font-medium ${getTaskLevel(task) === 0 ? 'text-yellow-300' : getTaskLevel(task) === 1 ? 'text-rose-300' : 'text-green-300'}`}>
                {task.name}
              </div>
              <div className="text-gray-300 text-[0.78rem]">
                {task.startDate.toLocaleDateString()} — {task.endDate.toLocaleDateString()}
                <span className="ml-2 text-gray-400">• {getDaysBetween(task.startDate, task.endDate) + 1} days</span>
              </div>
              <div className="text-[0.72rem] text-gray-400 mt-0.5">
                {getTaskLevel(task) === 0 ? 'Category' : getTaskLevel(task) === 1 ? 'Subcategory' : 'Sub-subcategory'}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
