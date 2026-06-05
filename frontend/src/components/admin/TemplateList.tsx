import { useTemplates, useDuplicateTemplate, useDeleteTemplate } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Trash2, Edit, FileText } from 'lucide-react';

interface Props {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function TemplateList({ onEdit, onCreate }: Props) {
  const { data: templates, isLoading } = useTemplates();
  const duplicateMutation = useDuplicateTemplate();
  const deleteMutation = useDeleteTemplate();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? Assessments created from it will not be affected.`)) return;
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading templates...</div>;
  }

  if (!templates?.length) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12 space-y-4">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No checklist templates yet.</p>
          <p className="text-sm text-muted-foreground">
            Create a template to define which domains, controls, and weights to include in assessments.
          </p>
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <Card key={t.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <h3 className="font-medium truncate">{t.name}</h3>
                  <Badge variant="outline">{t._count?.domains ?? 0} domains</Badge>
                  {'controls' in (t._count || {}) && (
                    <Badge variant="outline">{(t._count as any).controls} controls</Badge>
                  )}
                </div>
                {t.description && (
                  <p className="mt-1 ml-8 text-sm text-muted-foreground truncate">{t.description}</p>
                )}
                <p className="mt-1 ml-8 text-xs text-muted-foreground">
                  Created {new Date(t.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button variant="outline" size="sm" onClick={() => onEdit(t.id)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => duplicateMutation.mutate(t.id)}
                  disabled={duplicateMutation.isPending}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(t.id, t.name)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
