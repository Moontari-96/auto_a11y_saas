import type { LucideIcon } from 'lucide-react'
import type { ScanStatus } from '@/components/StatusIndicator'

// Common
export interface Organization {
    org_id: string
    org_name: string
    base_url?: string
    business_number?: string
}

// For scans page
export interface Project {
    project_id: string
    project_name: string
    target_url: string
    status: ScanStatus
    last_scan_id?: string
    last_scan_date?: string
    last_score?: number
}

export interface FetchedProjectRaw {
    project_id: string
    project_name: string
    target_url: string
    status?: ScanStatus
    last_scan_id?: string
    scan_id?: string
    last_scan_date?: string
    finished_at?: string
    last_score?: number
    overall_score?: number
}

// For projects detail page
export interface ProjectItem {
    project_id?: string
    temp_id?: string
    org_id?: string
    project_name: string
    target_url: string
    display_yn: string
    delete_yn: string
    organization?: Organization
}

// For reports page
export interface ProjectFilter {
    project_id: string
    project_name: string
}

export interface ScanHistory {
    scan_id: string
    project_id: string
    project_name: string
    target_url: string
    overall_score: number
    finished_at: string
    status: ScanStatus
    critical_issues?: number
    total_issues?: number
}

// For reports detail page
export type Severity = 'critical' | 'serious' | 'moderate' | 'minor'

export interface A11yIssue {
    issueId: string
    rule_id: string
    severity: Severity
    description: string
    element_selector?: string
    html_snippet?: string
    help_url?: string
}

export interface ScanDetail {
    scan_id: string
    project_name: string
    target_url: string
    overall_score: number
    finished_at: string
    issues: A11yIssue[]
}

export interface SeverityConfigProps {
    label: string
    color: string
    icon: LucideIcon
}

export interface OrgData {
    stats: {
        totalProjects: number
        averageScore: number
        criticalIssues: number
        issueSeverityCounts: { [key: string]: number }
    }
    scoreHistory: { x: string; y: number }[]
    scans: ScanHistory[]
}

export interface AllOrgsData {
    totalOrgs: number
    totalProjects: number
    totalScans: number
    overallAverageScore: number
    totalCriticalIssues: number
    orgScores: { name: string; score: number }[]
}