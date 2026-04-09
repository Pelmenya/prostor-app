export { EquipmentCard } from './ui/equipment-card/equipment-card';
export { ArchivedEquipmentRow } from './ui/archived-equipment-row/archived-equipment-row';
export { getResourcePercent, getProgressColor, getDaysLeft } from './lib/get-resource-percent';
export { hasMaintenanceComponents } from './lib/has-maintenance-components';
export { MOCK_INSTALLED_EQUIPMENT } from './lib/mock-equipment';
export {
    installedEquipmentKeys,
    useInstalledEquipmentByRealEstate,
    useCreateInstalledEquipment,
    useUpdateInstalledEquipment,
    useReplaceComponent,
} from './api/installed-equipment.api';
