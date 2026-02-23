'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Globe, Play } from 'lucide-react'
import { StatusIndicator, ScanStatus } from './StatusIndicator'

interface Project {
    project_id: string
    project_name: string
    target_url: string
    status: ScanStatus
}

interface ProjectCardProps {
    project: Project
    isSelected: boolean
    onSelect: (checked: boolean) => void
    onExecute: () => void
}

export function ProjectCard({
    project,
    isSelected,
    onSelect,
    onExecute,
}: ProjectCardProps) {
    return (
        <Card
            className={`group relative border-none shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'bg-white'
            }`}
        >
            <CardHeader className="p-5 pb-3">
                <div className="flex justify-between items-start mb-3">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={checked => onSelect(!!checked)}
                        className={`transition-opacity ${
                            isSelected
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'
                        }`}
                    />
                    <StatusIndicator status={project.status} />
                </div>
                <CardTitle className="text-base font-bold text-slate-800 line-clamp-1">
                    {project.project_name}
                </CardTitle>
            </CardHeader>

            <CardContent className="px-5 pb-4">
                <div className="flex items-center text-xs text-slate-400 bg-slate-50 p-2 rounded-md truncate">
                    <Globe className="w-3 h-3 mr-1.5 shrink-0" />
                    <span className="truncate">{project.target_url}</span>
                </div>
            </CardContent>

            <div className="px-5 pb-5">
                <Button
                    variant={isSelected ? 'default' : 'outline'}
                    className={`w-full text-xs font-bold transition-colors ${
                        !isSelected &&
                        'text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={onExecute}
                >
                    <Play className="w-3 h-3 mr-2" /> 단독 검사 실행
                </Button>
            </div>
        </Card>
    )
}
