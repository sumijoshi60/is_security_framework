import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAssessments, useGenerateReport } from '@/hooks/useApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Printer, Loader2 } from 'lucide-react';

export function ReportPage() {
  const { data: assessments, isLoading: loadingAssessments } = useAssessments();
  const [selectedId, setSelectedId] = useState<string>('');
  const generateReport = useGenerateReport();

  const assessmentId = selectedId || assessments?.[0]?.id || '';

  const handleGenerate = () => {
    if (!assessmentId) return;
    generateReport.mutate(assessmentId);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loadingAssessments) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  if (!assessments?.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No assessments found. Create or import one first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header — hidden when printing */}
      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-bold">Report</h1>
        <div className="flex items-center gap-3">
          <select
            value={assessmentId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              generateReport.reset();
            }}
            className="border border-border rounded-md px-3 py-2 text-sm bg-background"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
          <Button onClick={handleGenerate} disabled={generateReport.isPending || !assessmentId}>
            {generateReport.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
          {generateReport.data && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {generateReport.isError && (
        <Card className="no-print">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Failed to generate report: {(generateReport.error as Error)?.message || 'Unknown error'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Make sure ANTHROPIC_API_KEY is set in your .env file.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {generateReport.isPending && (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Generating report with AI...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!generateReport.data && !generateReport.isPending && !generateReport.isError && (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-30" />
            <p>Select an assessment and click "Generate Report" to create an AI-powered audit report.</p>
          </CardContent>
        </Card>
      )}

      {/* Report content */}
      {generateReport.data && (
        <>
          <Card className="shadow-sm">
            <CardContent className="px-10 py-8 report-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{generateReport.data.markdown}</ReactMarkdown>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center no-print">
            Generated at {new Date(generateReport.data.generatedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
