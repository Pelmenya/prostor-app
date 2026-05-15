'use client';

import { useEffect, useState } from 'react';
import { WaterDrop } from '@/shared/ui';

const SESSION_KEY = 'water-map:splash-shown';
const SPLASH_DURATION_MS = 2500;

function computeInitialShow(): boolean {
    if (typeof window === 'undefined') return false;
    const isDemoRoute = new URLSearchParams(window.location.search).get('demo') === '1';
    if (isDemoRoute) return true;
    try {
        return sessionStorage.getItem(SESSION_KEY) !== '1';
    } catch {
        // incognito / blocked — не повторяем splash
        return false;
    }
}

/**
 * Cold-load splash 2.5s сцена (P2.7 phase 2). Играется ТОЛЬКО:
 *  - первый mount в сессии (sessionStorage flag) — wow-эффект на первый
 *    заход юзера
 *  - `?demo=1` query param — для презентаций руководителю
 *
 * Pure CSS animations в splash-animations.css. JS только для unmount
 * через setTimeout после 2.5s. После unmount элемент полностью убран
 * из DOM (не overlay'ит карту).
 *
 * **Hydration:** lazy initializer возвращает `false` на SSR (window undef)
 * и computed value на client. Возможен hydration warning, но React 19
 * переключается на client value без crash'а. Без `setShow` в useEffect
 * direct body — соблюдаем `react-hooks/set-state-in-effect`.
 */
export function WaterMapSplash() {
    const [show, setShow] = useState(computeInitialShow);

    useEffect(() => {
        if (!show) return;
        try {
            sessionStorage.setItem(SESSION_KEY, '1');
        } catch {
            /* ignore — incognito */
        }
        const timer = setTimeout(() => setShow(false), SPLASH_DURATION_MS);
        return () => clearTimeout(timer);
    }, [show]);

    if (!show) return null;

    return (
        <div className="wm-splash" aria-hidden>
            <span className="wm-splash-drop">
                <WaterDrop size={72} />
            </span>
            <span className="wm-splash-logo">PROSTOR</span>
            <span className="wm-splash-subtitle">Карта качества воды</span>
        </div>
    );
}
