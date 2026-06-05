import { useState } from 'react';
import { useAssessments, useAssessmentScoring, useGapAnalysis, useAllActionItems } from '@/hooks/useApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MaturityDonutChart } from '@/components/dashboard/MaturityDonutChart';
import { DomainBarChart } from '@/components/dashboard/DomainBarChart';
import { DomainGapChart } from '@/components/dashboard/DomainGapChart';
import { GapAnalysisTable } from '@/components/dashboard/GapAnalysisTable';
import { ScoreCard } from '@/components/dashboard/ScoreCard';
import { Shield, Target, BarChart3, CheckCircle, AlertTriangle, Crosshair, ListTodo, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';

export function DashboardPage() {
  const { data: assessments, isLoading: loadingAssessments } = useAssessments();
  const [selectedId, setSelectedId] = useState<string>('');
  const [gapTableOpen, setGapTableOpen] = useState(false);

  const assessmentId = selectedId || assessments?.[0]?.id || '';
  const { data: scoring, isLoading: loadingScoring } = useAssessmentScoring(assessmentId);
  const { data: gapAnalysis } = useGapAnalysis(assessmentId);
  const { data: allActions } = useAllActionItems(assessmentId);

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

  const displayScore = scoring?.overallScore ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <select
            value={assessmentId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-background"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingScoring ? (
        <div className="text-muted-foreground">Loading scoring data...</div>
      ) : scoring ? (
        <>
          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreCard
              title="Overall Score"
              value={`${displayScore} / ${scoring.maxPossibleScore}`}
              subtitle={`${((displayScore / scoring.maxPossibleScore) * 100).toFixed(0)}% maturity`}
              icon={<Shield className="h-8 w-8" />}
            />
            <ScoreCard
              title="Total Controls"
              value={scoring.totalControls}
              subtitle={`${scoring.scoredControls} scored`}
              icon={<Target className="h-8 w-8" />}
            />
            <ScoreCard
              title="Domains"
              value={scoring.domainScores.length}
              subtitle="ISO 27001 Annex A"
              icon={<BarChart3 className="h-8 w-8" />}
            />
            <ScoreCard
              title="Completion"
              value={`${scoring.totalControls > 0 ? ((scoring.scoredControls / scoring.totalControls) * 100).toFixed(0) : 0}%`}
              subtitle={`${scoring.totalControls - scoring.scoredControls} remaining`}
              icon={<CheckCircle className="h-8 w-8" />}
            />
          </div>

          {/* Gap Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreCard
              title="Targets Set"
              value={`${scoring.domainScores.reduce((acc, d) => acc + d.controls.filter((c) => c.targetScore !== null).length, 0)} / ${scoring.totalControls}`}
              subtitle="Controls with targets"
              icon={<Crosshair className="h-8 w-8" />}
            />
            <ScoreCard
              title="Gaps Found"
              value={scoring.totalGaps}
              subtitle="Controls below target"
              icon={<TrendingDown className="h-8 w-8" />}
            />
            <ScoreCard
              title="Critical Gaps"
              value={scoring.criticalGaps}
              subtitle="Gap of 2+ levels"
              icon={<AlertTriangle className="h-8 w-8" />}
            />
            <ScoreCard
              title="Open Actions"
              value={allActions?.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS').length ?? 0}
              subtitle="Remediation items"
              icon={<ListTodo className="h-8 w-8" />}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maturity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <MaturityDonutChart distribution={scoring.distribution} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Domain Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <DomainBarChart domainScores={scoring.domainScores} />
              </CardContent>
            </Card>
          </div>

          {/* Domain Gap Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current vs Target by Domain</CardTitle>
            </CardHeader>
            <CardContent>
              <DomainGapChart domainScores={scoring.domainScores} />
            </CardContent>
          </Card>

          {/* Gap Analysis Table — collapsible */}
          {gapAnalysis && (
            <Card>
              <button
                onClick={() => setGapTableOpen(!gapTableOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors rounded-t-lg"
              >
                <div className="flex items-center gap-2">
                  {gapTableOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-lg font-semibold">Gap Analysis</span>
                  {gapAnalysis.totalGaps > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {gapAnalysis.totalGaps} gaps, {gapAnalysis.criticalGaps} critical
                    </span>
                  )}
                </div>
              </button>
              {gapTableOpen && (
                <CardContent className="pt-0">
                  <GapAnalysisTable gaps={gapAnalysis.gaps} />
                </CardContent>
              )}
            </Card>
          )}

          {/* Domain Detail Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Domain Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Domain</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Weight</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Controls</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Avg Score</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoring.domainScores.map((d) => {
                      const score = d.averageScore;
                      return (
                        <tr key={d.domainId} className="border-b border-border last:border-0">
                          <td className="py-3 px-4">
                            <span className="font-medium">{d.domainCode}</span>{' '}
                            <span className="text-muted-foreground">{d.domainName}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-muted-foreground">
                            {d.domainWeight}
                          </td>
                          <td className="py-3 px-4 text-center">{d.controlCount}</td>
                          <td className="py-3 px-4 text-center font-medium">{score.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${(score / d.maxScore) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {((score / d.maxScore) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
