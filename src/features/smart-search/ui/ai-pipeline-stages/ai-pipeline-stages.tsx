'use client';

import { useEffect, useState } from 'react';
import { useSmartSearchStore } from '../../model/smart-search.store';

/**
 * Loading state — 3-stage AI pipeline visible (НЕ black-box spinner).
 * Slovo backend не streams progress events; стейджи симулируются клиентскими
 * timers. Цель — показать юзеру что AI _делает_ (фото → vision → vector),
 * не «крутилка ждите».
 *
 * Stages timing подобрано под slovo Phase 1 averages:
 *   - photo upload: 0..300ms (если без image — этот стейдж пропускается)
 *   - vision: 300..900ms (Haiku 4.5 ~600ms median)
 *   - pgvector: 900..1400ms (Flowise queryVectorStore)
 *
 * Mutation резолвится примерно в 1400ms — финальный стейдж завершается
 * синхронно с onSuccess.
 */

type TStage = { id: 'photo' | 'vision' | 'vector'; icon: string; label: string; startMs: number };

const STAGES_WITH_PHOTO: TStage[] = [
    { id: 'photo', icon: '📷', label: 'Фото', startMs: 0 },
    { id: 'vision', icon: '👁', label: 'Vision (zrit)', startMs: 300 },
    { id: 'vector', icon: '🔒', label: 'pgvector', startMs: 900 },
];

const STAGES_TEXT_ONLY: TStage[] = [
    { id: 'vision', icon: '✍', label: 'Текст → эмбеддинг', startMs: 0 },
    { id: 'vector', icon: '🔒', label: 'pgvector', startMs: 350 },
];

export function AiPipelineStages() {
    const image = useSmartSearchStore((s) => s.image);
    const query = useSmartSearchStore((s) => s.query);
    const stages = image ? STAGES_WITH_PHOTO : STAGES_TEXT_ONLY;

    const [elapsedMs, setElapsedMs] = useState(0);

    useEffect(() => {
        const start = performance.now();
        const interval = setInterval(() => {
            setElapsedMs(performance.now() - start);
        }, 80);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                {query && (
                    <p className="text-xs text-base-content/60">
                        Запрос: <span className="text-base-content/90">«{query}»</span>
                    </p>
                )}
                {image && (
                    <p className="text-xs text-base-content/60">
                        Фото:{' '}
                        <span className="text-base-content/90">
                            {(image.sizeBytes / 1024 / 1024).toFixed(1)} MB · {image.mime}
                        </span>
                    </p>
                )}
            </div>

            <ol className="flex flex-col gap-2">
                {stages.map((stage, idx) => {
                    const next = stages[idx + 1];
                    const active =
                        elapsedMs >= stage.startMs && (!next || elapsedMs < next.startMs);
                    const done = next && elapsedMs >= next.startMs;
                    return (
                        <li
                            key={stage.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition ${
                                done
                                    ? 'border-success/30 bg-success/5 text-base-content/70'
                                    : active
                                      ? 'border-primary/40 bg-primary/10 text-base-content'
                                      : 'border-base-content/10 bg-base-200/50 text-base-content/40'
                            }`}
                        >
                            <span aria-hidden="true" className="text-base">
                                {stage.icon}
                            </span>
                            <span className="text-sm font-medium flex-1">{stage.label}</span>
                            {done && <span className="text-xs text-success font-mono">✓</span>}
                            {active && (
                                <span className="loading loading-spinner loading-xs text-primary" />
                            )}
                        </li>
                    );
                })}
            </ol>

            <p className="text-xs text-base-content/50 text-center">
                <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse mr-1.5 align-middle" />
                подбираем товары · обычно ~1.4 секунды
            </p>
        </div>
    );
}
