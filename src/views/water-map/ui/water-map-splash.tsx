'use client';

import { useEffect, useState } from 'react';
import { WaterDrop } from '@/shared/ui';

const SESSION_KEY = 'water-map:splash-shown';
const SPLASH_DURATION_MS = 2500;

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
 * **Hydration-safe:** initial state `false` на SSR + client first paint
 * (одинаково — нет mismatch). useEffect после mount проверяет URL +
 * sessionStorage, при необходимости setShow(true). Это даёт ~16ms flash
 * карты перед splash overlay'ем — splash z-100 моментально перекроет,
 * визуально не заметно.
 *
 * Lint exception: `react-hooks/set-state-in-effect` правило здесь нарушено
 * legitimately — это one-time mount-init для client-only state (URL +
 * sessionStorage недоступны на SSR), один из немногих допустимых случаев.
 */
export function WaterMapSplash() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const isDemoRoute = new URLSearchParams(window.location.search).get('demo') === '1';
        const splashShown = (() => {
            try {
                return sessionStorage.getItem(SESSION_KEY) === '1';
            } catch {
                return true; // incognito → не повторяем
            }
        })();
        const shouldShow = isDemoRoute || !splashShown;
        if (!shouldShow) return;

        try {
            sessionStorage.setItem(SESSION_KEY, '1');
        } catch {
            /* ignore — incognito */
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShow(true);
        const timer = setTimeout(() => setShow(false), SPLASH_DURATION_MS);
        return () => clearTimeout(timer);
    }, []);

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
