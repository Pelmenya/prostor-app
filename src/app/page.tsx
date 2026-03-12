export default function Home() {
    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="card bg-base-100 shadow-xl max-w-md w-full">
                <div className="card-body">
                    <h1 className="card-title text-2xl gradient-text">
                        PROSTOR App
                    </h1>
                    <p className="text-base-content/70">
                        Мультиплатформенный фронтенд для CRM водоочистки
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className="badge badge-primary">Next.js 16</span>
                        <span className="badge badge-secondary">React 19</span>
                        <span className="badge badge-accent">Tailwind 4</span>
                        <span className="badge badge-info">DaisyUI 5</span>
                    </div>
                    <div className="card-actions justify-end mt-4">
                        <button className="btn btn-primary">Каталог</button>
                        <button className="btn btn-outline">Войти</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
