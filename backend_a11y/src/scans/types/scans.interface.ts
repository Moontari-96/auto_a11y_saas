export interface WorkerScanResult {
  ruleId: string;
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  selector?: string | null;
  source: 'axe' | 'lighthouse' | 'ai';
  helpUrl?: string | null;
  htmlSnippet?: string | null;
  failureSummary?: string | null;
  rawDetail?: Record<string, unknown> | null;
}

export interface WorkerScanResponse {
  success: boolean;
  results: WorkerScanResult[];
}

export interface RawHistoryResult {
  scan_id: string;
  project_id: string;
  project_name: string;
  target_url: string;
  overall_score: string | number;
  finished_at: Date;
  status: string;
  total_issues: string | number;
  critical_issues: string | number;
}
