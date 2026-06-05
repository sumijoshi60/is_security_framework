import { useState, useRef } from 'react';
import { useEvidence, useUploadEvidence, useDeleteEvidence } from '@/hooks/useApi';
import { ChevronDown, ChevronRight, Upload, Download, Trash2, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface Props {
  assessmentId: string;
  controlId: string;
  editable: boolean;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidencePanel({ assessmentId, controlId, editable }: Props) {
  const { data: evidence = [], isLoading } = useEvidence(assessmentId, controlId);
  const uploadEvidence = useUploadEvidence();
  const deleteEvidence = useDeleteEvidence();
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description.trim()) formData.append('description', description.trim());
    await uploadEvidence.mutateAsync({ assessmentId, controlId, formData });
    setDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async (evidenceId: string, fileName: string) => {
    const response = await api.get(`/assessments/${assessmentId}/evidence/${evidenceId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Paperclip className="h-3 w-3" />
        <span>Evidence</span>
        {evidence.length > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {evidence.length}
          </Badge>
        )}
      </button>

      {expanded && (
        <div className="mt-2 ml-5 space-y-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : evidence.length === 0 && !editable ? (
            <p className="text-xs text-muted-foreground italic">No evidence attached</p>
          ) : (
            <>
              {evidence.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-2 text-xs bg-muted/30 rounded px-2 py-1.5"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{e.fileName}</span>
                    <span className="text-muted-foreground">
                      {formatFileSize(e.fileSize)}
                      {e.description && ` — ${e.description}`}
                      {e.user?.name && ` (${e.user.name})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownload(e.id, e.fileName)}
                      className="p-1 hover:bg-muted rounded"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    {editable && (
                      <button
                        type="button"
                        onClick={() =>
                          deleteEvidence.mutate({ assessmentId, evidenceId: e.id, controlId })
                        }
                        className="p-1 hover:bg-destructive/10 rounded text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {editable && (
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx,.txt,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex-1 text-xs border border-border rounded px-2 py-1 bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadEvidence.isPending}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Upload className="h-3 w-3" />
                    {uploadEvidence.isPending ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
