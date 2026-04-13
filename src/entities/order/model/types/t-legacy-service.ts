/**
 * Старые заказы (созданные через Telegram Mini App) хранят снэпшот услуги
 * в поле `service`, а не `serviceInfo` (формат нового Zustand-стора).
 */
export type TLegacyServiceEntry = {
    service?: {
        id?: string;
        name?: string;
        category?: string;
    };
};
