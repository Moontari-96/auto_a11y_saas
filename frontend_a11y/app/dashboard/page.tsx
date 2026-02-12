// src/app/dashboard/page.tsx
export default function DashboardPage() {
    return (
        <>
            <h2 className="text-2xl font-bold mb-4">대시보드</h2>

            <div className="grid grid-cols-3 gap-4">
                <div className="border p-4 rounded">
                    <p className="text-sm text-gray-500">총 프로젝트</p>
                    <p className="text-2xl font-bold">3</p>
                </div>

                <div className="border p-4 rounded">
                    <p className="text-sm text-gray-500">최근 검사</p>
                    <p className="text-2xl font-bold">12</p>
                </div>

                <div className="border p-4 rounded">
                    <p className="text-sm text-gray-500">오류</p>
                    <p className="text-2xl font-bold text-red-500">27</p>
                </div>
            </div>
        </>
    )
}
