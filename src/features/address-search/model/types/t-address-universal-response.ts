export type TAddressUniversalResponse = {
    address: TAddressUniversal;
    query?: string;
    request_process_time: number;
    check_info?: TCheckInfo;
};

export type TAddressUniversal = {
    areas: TAreasUniversal;
    codes: TCodesUniversal;
    country: TCountryUniversal;
    cover?: TCoverUniversal[];
    fields: TFieldUniversal[];
    geo_data: TGeoDataUniversal;
    post_office: TPostOfficeUniversal;
    stations?: TStationUniversal[];
    time_zone: TTimeZoneUniversal;
    pretty: string;
    quality?: TQualityUniversal;
};

type TAreasUniversal = {
    admin_area?: TAdminAreaUniversal;
    admin_okrug?: TAdminOkrugUniversal;
    ring_road?: TRingRoadUniversal;
};

type TAdminAreaUniversal = {
    name: string;
    type: string;
};

type TAdminOkrugUniversal = {
    name: string;
    type: string;
};

type TRingRoadUniversal = {
    dist?: number;
    in_ring: boolean;
    name: string;
    short: string;
};

type TCodesUniversal = {
    abr_actual_code: string;
    abr_detected_code: string;
    fias_actual_code: string;
    kladr_actual_code: string;
    sign: string;
    fias_house?: string;
    fias_house_precise?: boolean;
    fias_object?: string;
    fias_object_level?: string;
    gar_Region?: string;
    gar_house?: string;
    gar_object?: string;
    ifns_fl?: string;
    ifns_ul?: string;
    okato?: string;
    oktmo?: string;
};

type TCountryUniversal = {
    code: string;
    name: string;
    sign: string;
};

type TCoverUniversal = {
    in?: string;
    out?: string;
};

type TFieldUniversal = {
    c?: string;
    cover?: string;
    level: string;
    name?: string;
    ns?: number;
    st?: string;
    ts?: number;
    type?: string;
};

type TGeoDataUniversal = {
    house_level: string;
    max: TCoordinatesUniversal;
    mid: TCoordinatesUniversal;
    min: TCoordinatesUniversal;
    object_level: string;
    rel: number;
};

type TCoordinatesUniversal = {
    lat: number;
    lon: number;
};

type TPostOfficeUniversal = {
    dist: number;
    lat: number;
    lon: number;
    pretty: string;
    sign: string;
};

type TStationUniversal = {
    dist: number;
    lat: number;
    line: string;
    lon: number;
    name: string;
    net: string;
    type: string;
};

type TTimeZoneUniversal = {
    msk_zone: string;
    name: string;
    utc_zone: string;
};

type TQualityUniversal = {
    canonic_fields: number;
    detected_fields: number;
    precision: number;
    recall: number;
    verified_numeric_fields: number;
};

type TCheckInfo = {
    alts: number;
    query: string;
    time: number;
};
