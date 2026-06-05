import { useState } from 'react';
import { useActionItems, useCreateActionItem, useUpdateActionItem, useDeleteActionItem, useUsers } from '@/hooks/useApi';
import { ChevronDown, ChevronRight, Plus, Trash2, ListTodo } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ActionItem } from '@/types';

interface Props {
  assessmentId: string;
  controlId: string;
  editable: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#6b7280',
  MEDIUM: '#3b82f6',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#ef4444',
  IN_PROGRESS: '#f97316',
  COMPLETED: '#22c55e',
  CANCELLED: '#6b7280',
};

function ActionRow({
  item,
  assessmentId,
  controlId,
  editable,
}: {
  item: ActionItem;
  assessmentId: string;
  controlId: string;
  editable: boolean;
}) {
  const updateAction = useUpdateActionItem();
  const deleteAction = useDeleteActionItem();

  return (
    <div className="flex items-start justify-between gap-2 text-xs bg-muted/30 rounded px-2 py-1.5">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium">{item.title}</span>
          <span
            className="px-1.5 py-0 rounded text-[10px] font-medium"
            style={{
              backgroundColor: PRIORITY_COLORS[item.priority] + '20',
              color: PRIORITY_COLORS[item.priority],
            }}
          >
            {item.priority}
          </span>
          {editable ? (
            <select
              value={item.status}
              onChange={(e) =>
                updateAction.mutate({
                  assessmentId,
                  actionId: item.id,
                  controlId,
                  status: e.target.value,
                })
              }
              className="text-[10px] border border-border rounded px-1 py-0 bg-background"
              style={{ color: STATUS_COLORS[item.status] }}
            >
              {Object.keys(STATUS_COLORS).map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          ) : (
            <span
              className="px-1.5 py-0 rounded text-[10px] font-medium"
              style={{
                backgroundColor: STATUS_COLORS[item.status] + '20',
                color: STATUS_COLORS[item.status],
              }}
            >
              {item.status.replace('_', ' ')}
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-muted-foreground">{item.description}</p>
        )}
        <div className="text-muted-foreground flex gap-3">
          {item.assignee && <span>Assigned: {item.assignee.name}</span>}
          {item.dueDate && (
            <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
          )}
        </div>
      </div>
      {editable && (
        <button
          type="button"
          onClick={() => deleteAction.mutate({ assessmentId, actionId: item.id, controlId })}
          className="p-1 hover:bg-destructive/10 rounded text-destructive shrink-0"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function ActionItemPanel({ assessmentId, controlId, editable }: Props) {
  const { data: actions = [], isLoading } = useActionItems(assessmentId, controlId);
  const { data: users = [] } = useUsers();
  const createAction = useCreateActionItem();
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedTo: '',
    dueDate: '',
  });

  const openCount = actions.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS').length;

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    await createAction.mutateAsync({
      assessmentId,
      controlId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      assignedTo: form.assignedTo || null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    });
    setForm({ title: '', description: '', priority: 'MEDIUM', assignedTo: '', dueDate: '' });
    setShowForm(false);
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <ListTodo className="h-3 w-3" />
        <span>Actions</span>
        {openCount > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-orange-600 border-orange-300">
            {openCount} open
          </Badge>
        )}
        {actions.length > 0 && openCount !== actions.length && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {actions.length} total
          </Badge>
        )}
      </button>

      {expanded && (
        <div className="mt-2 ml-5 space-y-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : (
            <>
              {actions.map((item) => (
                <ActionRow
                  key={item.id}
                  item={item}
                  assessmentId={assessmentId}
                  controlId={controlId}
                  editable={editable}
                />
              ))}

              {actions.length === 0 && !editable && (
                <p className="text-xs text-muted-foreground italic">No action items</p>
              )}

              {editable && !showForm && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add action item
                </button>
              )}

              {editable && showForm && (
                <div className="space-y-2 border border-border rounded p-2 bg-background">
                  <input
                    type="text"
                    placeholder="Action title *"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full text-xs border border-border rounded px-2 py-1 bg-background"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full text-xs border border-border rounded px-2 py-1 bg-background"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                      className="text-xs border border-border rounded px-2 py-1 bg-background"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                    <select
                      value={form.assignedTo}
                      onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
                      className="text-xs border border-border rounded px-2 py-1 bg-background"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                      className="text-xs border border-border rounded px-2 py-1 bg-background"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={!form.title.trim() || createAction.isPending}
                      className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {createAction.isPending ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-xs px-3 py-1 rounded border border-border hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
