import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableTaskItem({ task, toggleTaskStatus, handleDeleteTask, getDaysUntil, priorityColor }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
    cursor: 'grab',
  };

  const tDue = getDaysUntil(task.dueDate);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="proj-detail-task-row">
      <button 
        className={`proj-task-dot task-status-${task.status}`} 
        onClick={e => { e.stopPropagation(); toggleTaskStatus(task.id, e); }} 
        title="Cycle status"
      />
      <div className="proj-detail-task-info">
        <span className="proj-detail-task-title">{task.title}</span>
        {task.category && <span className="proj-detail-task-cat">{task.category}</span>}
      </div>
      <div className="proj-task-meta">
        {task.assignee && (
          <div className="proj-task-avatar" style={{background:task.assignee.color}} title={`Assigned to: ${task.assignee.name}`}>
            {task.assignee.avatar}
          </div>
        )}
        <span className={`proj-task-due due-${tDue.cls}`}>{tDue.label}</span>
        <span className="proj-task-priority" style={{color:priorityColor[task.priority]||'#94a3b8',fontSize:'.78rem',fontWeight:600}}>{task.priority}</span>
        <button className="proj-task-delete" onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); handleDeleteTask(task.id, e); }}>✕</button>
      </div>
    </div>
  );
}
