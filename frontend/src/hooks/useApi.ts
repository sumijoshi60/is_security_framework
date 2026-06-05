import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type {
  AuthResponse,
  Domain,
  Assessment,
  AssessmentDetail,
  AssessmentScoring,
  ChecklistTemplate,
  ChecklistTemplateDetail,
  User,
  Evidence,
  ActionItem,
  GapAnalysis,
  AssessmentReport,
} from '../types';

// Auth
export function useLogin() {
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/login', data).then((r) => r.data),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: { email: string; password: string; name: string }) =>
      api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  });
}

// Domains
export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: () => api.get<Domain[]>('/domains').then((r) => r.data),
  });
}

// Assessments
export function useAssessments() {
  return useQuery({
    queryKey: ['assessments'],
    queryFn: () => api.get<Assessment[]>('/assessments').then((r) => r.data),
  });
}

export function useAssessment(id: string) {
  return useQuery({
    queryKey: ['assessment', id],
    queryFn: () => api.get<AssessmentDetail>(`/assessments/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useAssessmentScoring(id: string) {
  return useQuery({
    queryKey: ['assessment-scoring', id],
    queryFn: () => api.get<AssessmentScoring>(`/assessments/${id}/scoring`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { templateId: string }) =>
      api.post<Assessment>('/assessments', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments'] }),
  });
}

export function useImportAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/assessments/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments'] }),
  });
}

export function useUpdateAssessmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/assessments/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
}

export function useDeleteAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assessments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments'] }),
  });
}

// Responses (control-level)
export function useUpdateResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      controlId,
      maturityLevel,
      notes,
      targetMaturityLevel,
    }: {
      assessmentId: string;
      controlId: string;
      maturityLevel: string;
      notes?: string;
      targetMaturityLevel?: string | null;
    }) =>
      api
        .put(`/assessments/${assessmentId}/responses/${controlId}`, {
          maturityLevel,
          notes,
          targetMaturityLevel,
        })
        .then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['assessment', vars.assessmentId] });
      qc.invalidateQueries({ queryKey: ['assessment-scoring', vars.assessmentId] });
      qc.invalidateQueries({ queryKey: ['gap-analysis', vars.assessmentId] });
    },
  });
}

// Users (admin)
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () =>
      api.get<User[]>('/users').then((r) => r.data),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/users/${id}/role`, { role }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

// --- Template hooks ---

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get<ChecklistTemplate[]>('/admin/templates').then((r) => r.data),
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => api.get<ChecklistTemplateDetail>(`/admin/templates/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post<ChecklistTemplate>('/admin/templates', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; description?: string; domains: any[] }) =>
      api.put<ChecklistTemplateDetail>(`/admin/templates/${id}`, data).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      qc.invalidateQueries({ queryKey: ['template', vars.id] });
    },
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<ChecklistTemplate>(`/admin/templates/${id}/duplicate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function usePrefillTemplateDefaults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<ChecklistTemplateDetail>(`/admin/templates/${id}/prefill-defaults`).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['template', id] });
    },
  });
}

// Lightweight template list for assessment creation picker
export function useTemplateOptions() {
  return useQuery({
    queryKey: ['template-options'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/assessments/templates').then((r) => r.data),
  });
}

// --- Evidence hooks ---

export function useEvidence(assessmentId: string, controlId: string) {
  return useQuery({
    queryKey: ['evidence', assessmentId, controlId],
    queryFn: () =>
      api.get<Evidence[]>(`/assessments/${assessmentId}/responses/${controlId}/evidence`).then((r) => r.data),
    enabled: !!assessmentId && !!controlId,
  });
}

export function useUploadEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      controlId,
      formData,
    }: {
      assessmentId: string;
      controlId: string;
      formData: FormData;
    }) =>
      api
        .post<Evidence>(`/assessments/${assessmentId}/responses/${controlId}/evidence`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['evidence', vars.assessmentId, vars.controlId] });
    },
  });
}

export function useDeleteEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      evidenceId,
      controlId,
    }: {
      assessmentId: string;
      evidenceId: string;
      controlId: string;
    }) => api.delete(`/assessments/${assessmentId}/evidence/${evidenceId}`),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['evidence', vars.assessmentId, vars.controlId] });
    },
  });
}

// --- Action Item hooks ---

export function useActionItems(assessmentId: string, controlId: string) {
  return useQuery({
    queryKey: ['action-items', assessmentId, controlId],
    queryFn: () =>
      api.get<ActionItem[]>(`/assessments/${assessmentId}/responses/${controlId}/actions`).then((r) => r.data),
    enabled: !!assessmentId && !!controlId,
  });
}

export function useAllActionItems(assessmentId: string, filters?: { status?: string; priority?: string }) {
  return useQuery({
    queryKey: ['all-action-items', assessmentId, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.priority) params.set('priority', filters.priority);
      const qs = params.toString();
      return api.get<ActionItem[]>(`/assessments/${assessmentId}/actions${qs ? `?${qs}` : ''}`).then((r) => r.data);
    },
    enabled: !!assessmentId,
  });
}

export function useCreateActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      controlId,
      ...data
    }: {
      assessmentId: string;
      controlId: string;
      title: string;
      description?: string;
      priority?: string;
      assignedTo?: string | null;
      dueDate?: string | null;
    }) =>
      api
        .post<ActionItem>(`/assessments/${assessmentId}/responses/${controlId}/actions`, data)
        .then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['action-items', vars.assessmentId, vars.controlId] });
      qc.invalidateQueries({ queryKey: ['all-action-items', vars.assessmentId] });
      qc.invalidateQueries({ queryKey: ['gap-analysis', vars.assessmentId] });
    },
  });
}

export function useUpdateActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      actionId,
      ...data
    }: {
      assessmentId: string;
      actionId: string;
      controlId: string;
      title?: string;
      description?: string;
      priority?: string;
      status?: string;
      assignedTo?: string | null;
      dueDate?: string | null;
    }) =>
      api
        .put<ActionItem>(`/assessments/${assessmentId}/actions/${actionId}`, data)
        .then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['action-items', vars.assessmentId, vars.controlId] });
      qc.invalidateQueries({ queryKey: ['all-action-items', vars.assessmentId] });
    },
  });
}

export function useDeleteActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      actionId,
      controlId,
    }: {
      assessmentId: string;
      actionId: string;
      controlId: string;
    }) => api.delete(`/assessments/${assessmentId}/actions/${actionId}`),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['action-items', vars.assessmentId, vars.controlId] });
      qc.invalidateQueries({ queryKey: ['all-action-items', vars.assessmentId] });
      qc.invalidateQueries({ queryKey: ['gap-analysis', vars.assessmentId] });
    },
  });
}

// --- Gap Analysis ---

export function useGapAnalysis(assessmentId: string) {
  return useQuery({
    queryKey: ['gap-analysis', assessmentId],
    queryFn: () =>
      api.get<GapAnalysis>(`/assessments/${assessmentId}/gaps`).then((r) => r.data),
    enabled: !!assessmentId,
  });
}

// --- Report Generation ---

export function useGenerateReport() {
  return useMutation({
    mutationFn: (assessmentId: string) =>
      api.get<AssessmentReport>(`/assessments/${assessmentId}/report`).then((r) => r.data),
  });
}
