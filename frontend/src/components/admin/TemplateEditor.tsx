import { useState, useEffect } from 'react';
import { useTemplate, useSaveTemplate, usePrefillTemplateDefaults } from '@/hooks/useApi';
import { GuidedWeightInput } from './GuidedWeightInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Plus, Trash2, Download, Save } from 'lucide-react';
import type { TemplateDomain, TemplateControl } from '@/types';

interface Props {
  templateId: string;
  onClose: () => void;
}

export function TemplateEditor({ templateId, onClose }: Props) {
  const { data: template, isLoading } = useTemplate(templateId);
  const saveMutation = useSaveTemplate();
  const prefillMutation = usePrefillTemplateDefaults();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domains, setDomains] = useState<TemplateDomain[]>([]);
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description);
      setDomains(template.domains.map((d) => ({
        ...d,
        controls: d.controls.map((c) => ({ ...c })),
      })));
    }
  }, [template]);

  const toggleDomain = (index: number) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const addDomain = () => {
    const newDomain: TemplateDomain = {
      code: '',
      name: '',
      description: '',
      weight: 1.0,
      sortOrder: domains.length,
      controls: [],
    };
    setDomains([...domains, newDomain]);
    setExpandedDomains((prev) => new Set(prev).add(domains.length));
  };

  const updateDomain = (index: number, updates: Partial<TemplateDomain>) => {
    setDomains((prev) => prev.map((d, i) => (i === index ? { ...d, ...updates } : d)));
  };

  const removeDomain = (index: number) => {
    if (!confirm('Delete this domain and all its controls?')) return;
    setDomains((prev) => prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, sortOrder: i })));
    setExpandedDomains((prev) => {
      const next = new Set<number>();
      for (const v of prev) {
        if (v < index) next.add(v);
        else if (v > index) next.add(v - 1);
      }
      return next;
    });
  };

  const addControl = (domainIndex: number) => {
    const domain = domains[domainIndex];
    const newControl: TemplateControl = {
      controlId: '',
      name: '',
      description: '',
      weight: 1.0,
      sortOrder: domain.controls.length,
    };
    updateDomain(domainIndex, { controls: [...domain.controls, newControl] });
  };

  const updateControl = (domainIndex: number, controlIndex: number, updates: Partial<TemplateControl>) => {
    const domain = domains[domainIndex];
    const controls = domain.controls.map((c, i) => (i === controlIndex ? { ...c, ...updates } : c));
    updateDomain(domainIndex, { controls });
  };

  const removeControl = (domainIndex: number, controlIndex: number) => {
    const domain = domains[domainIndex];
    const controls = domain.controls.filter((_, i) => i !== controlIndex).map((c, i) => ({ ...c, sortOrder: i }));
    updateDomain(domainIndex, { controls });
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync({
      id: templateId,
      name,
      description,
      domains: domains.map((d, di) => ({
        code: d.code,
        name: d.name,
        description: d.description,
        weight: d.weight,
        sortOrder: di,
        controls: d.controls.map((c, ci) => ({
          controlId: c.controlId,
          name: c.name,
          description: c.description,
          weight: c.weight,
          sortOrder: ci,
        })),
      })),
    });
    onClose();
  };

  const handlePrefill = async () => {
    if (domains.length > 0 && !confirm('This will replace all current domains/controls with defaults. Continue?')) {
      return;
    }
    const result = await prefillMutation.mutateAsync(templateId);
    if (result) {
      setName(result.name);
      setDescription(result.description);
      setDomains(result.domains.map((d) => ({
        ...d,
        controls: d.controls.map((c) => ({ ...c })),
      })));
      // Expand all domains
      setExpandedDomains(new Set(result.domains.map((_, i) => i)));
    }
  };

  const totalControls = domains.reduce((sum, d) => sum + d.controls.length, 0);
  const domainWeightSum = domains.reduce((sum, d) => sum + d.weight, 0);

  if (isLoading) {
    return <div className="text-muted-foreground">Loading template...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Edit Template</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{domains.length} domains</Badge>
          <Badge variant="outline">{totalControls} controls</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Template Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ISO 27001 Full Audit" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." />
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={handlePrefill} disabled={prefillMutation.isPending}>
              <Download className="h-4 w-4 mr-2" />
              {prefillMutation.isPending ? 'Loading...' : 'Use Default Checklist'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {domains.map((domain, di) => {
          const isExpanded = expandedDomains.has(di);
          return (
            <Card key={di}>
              <button
                onClick={() => toggleDomain(di)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-mono text-sm font-medium">{domain.code || '(no code)'}</span>
                  <span className="text-sm">{domain.name || '(unnamed)'}</span>
                  <Badge variant="outline">{domain.controls.length} controls</Badge>
                  <Badge variant="secondary">w: {domain.weight}</Badge>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeDomain(di); }}
                  className="p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </button>

              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Code</label>
                      <Input
                        value={domain.code}
                        onChange={(e) => updateDomain(di, { code: e.target.value })}
                        placeholder="e.g. A.5"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Name</label>
                      <Input
                        value={domain.name}
                        onChange={(e) => updateDomain(di, { name: e.target.value })}
                        placeholder="Domain name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Description</label>
                    <Input
                      value={domain.description}
                      onChange={(e) => updateDomain(di, { description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Weight</label>
                    <GuidedWeightInput value={domain.weight} onChange={(w) => updateDomain(di, { weight: w })} />
                  </div>

                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Controls</h4>
                      <Button variant="outline" size="sm" onClick={() => addControl(di)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Control
                      </Button>
                    </div>

                    {domain.controls.map((control, ci) => (
                      <div key={ci} className="border border-border/50 rounded-md p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Control #{ci + 1}</span>
                          <button
                            onClick={() => removeControl(di, ci)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Control ID</label>
                            <Input
                              value={control.controlId}
                              onChange={(e) => updateControl(di, ci, { controlId: e.target.value })}
                              placeholder="e.g. A.5.1"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Name</label>
                            <Input
                              value={control.name}
                              onChange={(e) => updateControl(di, ci, { name: e.target.value })}
                              placeholder="Control name"
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Description</label>
                          <Input
                            value={control.description}
                            onChange={(e) => updateControl(di, ci, { description: e.target.value })}
                            placeholder="Optional description"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Weight</label>
                          <GuidedWeightInput value={control.weight} onChange={(w) => updateControl(di, ci, { weight: w })} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Button variant="outline" onClick={addDomain} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Domain
      </Button>

      {domains.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Domain weight sum: {domainWeightSum.toFixed(1)}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saveMutation.isPending || !name.trim()}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
}
