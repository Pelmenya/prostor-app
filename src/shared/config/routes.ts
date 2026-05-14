export const MASTER_PATH = '/master';
export const MASTER_SETTINGS_PATH = '/master/settings';
export const MASTER_ORDERS_PATH = '/master/orders';
export const masterOrderPath = (id: number | string) => `/master/orders/${id}`;

export const CURATOR_PATH = '/curator';
export const CURATOR_CLIENTS_PATH = '/curator/clients';
export const curatorClientPath = (id: number | string) => `/curator/clients/${id}`;
export const CURATOR_MASTERS_PATH = '/curator/masters';
export const curatorMasterPath = (id: number | string) => `/curator/masters/${id}`;
export const CURATOR_ORDERS_PATH = '/curator/orders';
export const curatorOrderPath = (id: number | string) => `/curator/orders/${id}`;
export const CURATOR_ZONES_PATH = '/curator/zones';
export const CURATOR_SETTINGS_PATH = '/curator/settings';
