export { MAIN_CATALOG_ID } from './catalog';
export { API_URL, SLOVO_API_URL, S3_PUBLIC_URL } from './api';
export { PRIVATE_PATHS } from './private-paths';
export { MAP_STYLE } from './maps';
export const APP_NAME = 'PROSTOR';
export const COMMISSION_PERCENTS = Number(process.env.NEXT_PUBLIC_COMMISSION_PERCENTS ?? 35);
export { MASTER_PATH, MASTER_SETTINGS_PATH, MASTER_ORDERS_PATH, masterOrderPath } from './routes';
export {
    CURATOR_PATH,
    CURATOR_CLIENTS_PATH,
    curatorClientPath,
    CURATOR_MASTERS_PATH,
    curatorMasterPath,
    curatorMasterEditPath,
    CURATOR_ORDERS_PATH,
    curatorOrderPath,
    CURATOR_ZONES_PATH,
    CURATOR_SETTINGS_PATH,
    CURATOR_CHATS_PATH,
    masterOrderChatPath,
    curatorOrderChatPath,
} from './routes';
