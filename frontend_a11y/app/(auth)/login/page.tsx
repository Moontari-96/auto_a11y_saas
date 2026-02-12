// src/app/login/page.tsx
export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-[360px] border p-6 rounded">
                <h2 className="text-xl font-semibold mb-4">로그인</h2>

                <input
                    className="w-full border p-2 mb-3"
                    placeholder="이메일"
                />
                <input
                    className="w-full border p-2 mb-4"
                    type="password"
                    placeholder="비밀번호"
                />

                <button className="w-full bg-black text-white py-2 rounded">
                    로그인
                </button>
            </div>
        </div>
    )
}
