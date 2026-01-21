export interface AxeNode {
    html: string
    target: string[]
    failureSummary?: string
}

export interface AxeViolation {
    id: string
    impact: 'minor' | 'moderate' | 'serious' | 'critical' | null
    description: string
    help: string
    helpUrl: string
    nodes: AxeNode[]
}

export interface AxeResults {
    violations: AxeViolation[]
    passes: unknown[]
    incomplete: unknown[]
    inapplicable: unknown[]
}
