import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAssessment, useAssessments, useUpdateResponse } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth.store';
import { MaturitySelector } from '@/components/checklist/MaturitySelector';
import { TargetMaturitySelector } from '@/components/checklist/TargetMaturitySelector';
import { EvidencePanel } from '@/components/checklist/EvidencePanel';
import { ActionItemPanel } from '@/components/checklist/ActionItemPanel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Save } from 'lucide-react';
import { MATURITY_COLORS } from '@/types';
import type { ResponseItem } from '@/types';

interface DomainGroup {
  code: string;
  name: string;
  responses: ResponseItem[];
}

export function ChecklistPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id') || '';
  const { data: assessments } = useAssessments();
  const { data: assessment, isLoading } = useAssessment(selectedId);
  const updateResponse = useUpdateResponse();
  const { user } = useAuthStore();

  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingControls, setSavingControls] = useState<Set<string>>(new Set());

  const isEditable = assessment?.status === 'DRAFT' && (user?.role === 'ADMIN' || user?.role === 'AUDITOR');

  // Auto-expand all domains on load
  useEffect(() => {
    if (assessment?.responses) {
      const domains = new Set<string>();
      for (const r of assessment.responses) {
        domains.add(r.control.domain.code);
      }
      setExpandedDomains(domains);
    }
  }, [assessment?.id]);

  const toggleDomain = (code: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleMaturityChange = useCallback(
    async (controlId: string, maturityLevel: string) => {
      if (!selectedId) return;
      setSavingControls((prev) => new Set(prev).add(controlId));
      try {
        await updateResponse.mutateAsync({
          assessmentId: selectedId,
          controlId,
          maturityLevel,
          notes: editingNotes[controlId],
        });
      } finally {
        setSavingControls((prev) => {
          const next = new Set(prev);
          next.delete(controlId);
          return next;
        });
      }
    },
    [selectedId, updateResponse, editingNotes]
  );

  const handleNoteSave = useCallback(
    async (controlId: string, currentMaturity: string) => {
      if (!selectedId || editingNotes[controlId] === undefined) return;
      await updateResponse.mutateAsync({
        assessmentId: selectedId,
        controlId,
        maturityLevel: currentMaturity,
        notes: editingNotes[controlId] || '',
      });
    },
    [selectedId, editingNotes, updateResponse]
  );

  const handleTargetChange = useCallback(
    async (controlId: string, currentMaturity: string, targetLevel: string | null) => {
      if (!selectedId) return;
      setSavingControls((prev) => new Set(prev).add(controlId));
      try {
        await updateResponse.mutateAsync({
          assessmentId: selectedId,
          controlId,
          maturityLevel: currentMaturity,
          targetMaturityLevel: targetLevel,
        });
      } finally {
        setSavingControls((prev) => {
          const next = new Set(prev);
          next.delete(controlId);
          return next;
        });
      }
    },
    [selectedId, updateResponse]
  );

  // Group responses: Domain → Controls (flat, no question sub-level)
  const domainGroups: DomainGroup[] = (() => {
    if (!assessment?.responses) return [];

    const domainMap = new Map<string, DomainGroup>();

    for (const r of assessment.responses) {
      const domain = r.control.domain;

      if (!domainMap.has(domain.code)) {
        domainMap.set(domain.code, { code: domain.code, name: domain.name, responses: [] });
      }

      domainMap.get(domain.code)!.responses.push(r);
    }

    return Array.from(domainMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  })();

  if (!selectedId && assessments?.length) {
    setSearchParams({ id: assessments[0].id });
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Checklist</h1>
        <div className="flex items-center gap-3">
          {assessment && (
            <Badge variant={assessment.status === 'DRAFT' ? 'secondary' : 'success'}>
              {assessment.status}
            </Badge>
          )}
          <select
            value={selectedId}
            onChange={(e) => setSearchParams({ id: e.target.value })}
            className="border border-border rounded-md px-3 py-2 text-sm bg-background"
          >
            {assessments?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading checklist...</div>
      ) : !assessment ? (
        <div className="text-muted-foreground">Select an assessment to view.</div>
      ) : (
        <div className="space-y-3">
          {domainGroups.map((domain) => {
            const isExpanded = expandedDomains.has(domain.code);
            return (
              <Card key={domain.code}>
                <button
                  onClick={() => toggleDomain(domain.code)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-lg">{domain.code}</span>
                    <span className="text-muted-foreground">{domain.name}</span>
                    <Badge variant="outline">{domain.responses.length} controls</Badge>
                  </div>
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-2">
                    {domain.responses.map((r) => (
                      <div
                        key={r.id}
                        className="border border-border/50 rounded-md p-3 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: MATURITY_COLORS[r.maturityLevel] || '#6b7280' }}
                              />
                              <span className="font-mono text-sm font-medium text-primary">{r.control.controlId}</span>
                              <span className="text-sm">{r.control.name}</span>
                              {r.control.weight !== 1.0 && (
                                <Badge variant="outline" className="text-xs">w: {r.control.weight}</Badge>
                              )}
                            </div>

                            <MaturitySelector
                              value={r.maturityLevel}
                              onChange={(level) => handleMaturityChange(r.controlId, level)}
                              disabled={!isEditable}
                            />

                            <TargetMaturitySelector
                              value={r.targetMaturityLevel}
                              currentLevel={r.maturityLevel}
                              onChange={(level) => handleTargetChange(r.controlId, r.maturityLevel, level)}
                              disabled={!isEditable}
                            />

                            <div className="mt-3">
                              {isEditable ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Add notes..."
                                    className="flex-1 text-sm border border-border rounded-md px-3 py-1.5 bg-background placeholder:text-muted-foreground"
                                    defaultValue={r.notes}
                                    onChange={(e) =>
                                      setEditingNotes((prev) => ({
                                        ...prev,
                                        [r.controlId]: e.target.value,
                                      }))
                                    }
                                    onBlur={() => handleNoteSave(r.controlId, r.maturityLevel)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleNoteSave(r.controlId, r.maturityLevel);
                                    }}
                                  />
                                  {savingControls.has(r.controlId) && (
                                    <Save className="h-4 w-4 text-muted-foreground animate-pulse" />
                                  )}
                                </div>
                              ) : (
                                r.notes && (
                                  <p className="text-sm text-muted-foreground italic">{r.notes}</p>
                                )
                              )}
                            </div>

                            <EvidencePanel
                              assessmentId={selectedId}
                              controlId={r.controlId}
                              editable={isEditable}
                            />

                            <ActionItemPanel
                              assessmentId={selectedId}
                              controlId={r.controlId}
                              editable={isEditable}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
