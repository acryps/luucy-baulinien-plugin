export interface FeatureInfo {
    type: string,
    features: {
        type: string,
        id: string,
        geometry: {
            type: string,
            coordinates: [
                longitude: number,
                latitude: number
            ][]
        },
        geometry_name: string,
        properties: {
            ogc_fid: number,
            bemerkunge: string,
            rechtsstat: any,
            hauptnut_1: string,
            publiziert: string,
            kanton: string,
            provider: string
        }
    }[],
    totalFeatures: string,
    numberReturned: number,
    timeStamp: string,
    crs: {
        type: string,
        properties: {
            name: string
        }
    }
}
