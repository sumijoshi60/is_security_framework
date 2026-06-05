import { useState } from 'react';
import { useCreateTemplate } from '@/hooks/useApi';
import { TemplateList } from '@/components/admin/TemplateList';
import { TemplateEditor } from '@/components/admin/TemplateEditor';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function AdminPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const createMutation = useCreateTemplate();

  const handleCreate = async () => {
    const template = await createMutation.mutateAsync({ name: 'New Template' });
    setEditingId(template.id);
  };

  if (editingId) {
    return (
      <div className="space-y-6">
        <TemplateEditor templateId={editingId} onClose={() => setEditingId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Checklist Templates</h1>
        <Button onClick={handleCreate} disabled={createMutation.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          {createMutation.isPending ? 'Creating...' : 'New Template'}
        </Button>
      </div>

      <TemplateList
        onEdit={(id) => setEditingId(id)}
        onCreate={handleCreate}
      />
    </div>
  );
}
