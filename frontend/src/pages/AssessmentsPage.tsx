import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessments, useCreateAssessment, useImportAssessment, useUpdateAssessmentStatus, useDeleteAssessment, useTemplateOptions } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Upload, FileCheck, Trash2, Download } from 'lucide-react';
import api from '@/lib/api';

const STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; label: string }> = {
  DRAFT: { variant: 'secondary', label: 'Draft' },
  SUBMITTED: { variant: 'warning', label: 'Submitted' },
  APPROVED: { variant: 'success', label: 'Approved' },
  ARCHIVED: { variant: 'default', label: 'Archived' },
};

export function AssessmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: assessments, isLoading } = useAssessments();
  const { data: templateOptions } = useTemplateOptions();
  const createMutation = useCreateAssessment();
  const importMutation = useImportAssessment();
  const statusMutation = useUpdateAssessmentStatus();
  const deleteMutation = useDeleteAssessment();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'AUDITOR';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    const assessment = await createMutation.mutateAsync({ templateId: selectedTemplateId });
    setSelectedTemplateId('');
    setShowCreate(false);
    navigate(`/checklist?id=${assessment.id}`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', `Import: ${file.name}`);
    await importMutation.mutateAsync(formData);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = async (id: string) => {
    const response = await api.get(`/assessments/${id}/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `assessment-${id}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assessments</h1>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleImport}
              className="hidden"
            />
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </div>
        )}
      </div>

      {showCreate && (
        <Card>
          <CardContent className="pt-6">
            {!templateOptions?.length ? (
              <div className="text-sm text-muted-foreground">
                No templates available. <a href="/admin" className="text-primary underline">Create a checklist template</a> first.
              </div>
            ) : (
              <form onSubmit={handleCreate} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium block mb-1">Checklist Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                    autoFocus
                  >
                    <option value="">Select a template...</option>
                    {templateOptions.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" disabled={createMutation.isPending || !selectedTemplateId}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setSelectedTemplateId(''); }}>
                  Cancel
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {!assessments?.length ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            No assessments yet. Create a new one or import from Excel.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => {
            const badge = STATUS_BADGES[a.status] || STATUS_BADGES.DRAFT;
            return (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <FileCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                        <h3 className="font-medium truncate">{a.title}</h3>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        {a.template && (
                          <Badge variant="outline" className="text-xs">
                            {a.template.name}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 ml-8 text-sm text-muted-foreground">
                        Created by {a.user?.name} &middot;{' '}
                        {new Date(a.createdAt).toLocaleDateString()} &middot;{' '}
                        {a._count?.responses || 0} responses
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/checklist?id=${a.id}`)}
                      >
                        {a.status === 'DRAFT' && canEdit ? 'Edit' : 'View'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExport(a.id)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {canEdit && a.status === 'DRAFT' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => statusMutation.mutate({ id: a.id, status: 'SUBMITTED' })}
                        >
                          Submit
                        </Button>
                      )}
                      {user?.role === 'ADMIN' && a.status === 'SUBMITTED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => statusMutation.mutate({ id: a.id, status: 'APPROVED' })}
                        >
                          Approve
                        </Button>
                      )}
                      {user?.role === 'ADMIN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this assessment?')) {
                              deleteMutation.mutate(a.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
