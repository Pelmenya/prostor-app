'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const DEV_USER_ID = process.env.NEXT_PUBLIC_DEV_USER_ID || '';

export default function Home() {
    const [userId, setUserId] = useState(DEV_USER_ID);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<Record<string, unknown> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleDevLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/auth/dev-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: Number(userId) }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || `HTTP ${res.status}`);
            }

            const data = await res.json();
            setToken(data.token);
            setUser(data.user);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="card bg-base-100 shadow-xl max-w-lg w-full">
                <div className="card-body">
                    <h1 className="card-title text-2xl gradient-text">PROSTOR App</h1>
                    <p className="text-base-content/70">Dev-авторизация для разработки</p>

                    <div className="flex flex-col gap-3 mt-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-sm">User ID из БД</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="input input-bordered input-sm flex-1"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="Telegram ID пользователя"
                                />
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleDevLogin}
                                    disabled={isLoading || !userId}
                                >
                                    {isLoading ? (
                                        <span className="loading loading-spinner loading-xs" />
                                    ) : (
                                        'Получить токен'
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && <div className="alert alert-error text-sm">{error}</div>}

                        {token && (
                            <div className="flex flex-col gap-2">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-sm">Dev-токен</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="input input-bordered input-sm flex-1 font-mono text-xs"
                                            value={token}
                                            readOnly
                                        />
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => navigator.clipboard.writeText(token)}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-sm">
                                            Header для запросов
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered input-sm font-mono text-xs"
                                        value={`Authorization: Bearer ${token}`}
                                        readOnly
                                    />
                                </div>
                            </div>
                        )}

                        {user && (
                            <div className="collapse collapse-arrow bg-base-200">
                                <input type="checkbox" defaultChecked />
                                <div className="collapse-title text-sm font-medium">
                                    {(user.first_name as string) || ''}{' '}
                                    {(user.last_name as string) || ''} —{' '}
                                    {(user.role as string) || ''}
                                </div>
                                <div className="collapse-content">
                                    <pre className="text-xs overflow-x-auto">
                                        {JSON.stringify(user, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className="badge badge-primary">Next.js 16</span>
                        <span className="badge badge-secondary">React 19</span>
                        <span className="badge badge-accent">Tailwind 4</span>
                        <span className="badge badge-info">DaisyUI 5</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
