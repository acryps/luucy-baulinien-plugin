import { API_BASE_URL, FIND_BOX_THRESHOLD, SELECT_BOX_THRESHOLD, WMS_LAYER_NAME } from "./constants";
import { FeatureInfo } from "./models/feature-info";

export class Service {
    static async select(position: GlobalPosition): Promise<FeatureInfo> {
        const parameters = {
            service: 'WMS',
            version: '1.1.1',
            request: 'GetFeatureInfo',
            layers: WMS_LAYER_NAME,
            width: 1,
            height: 1,
            srs: 'EPSG:4326',
            query_layers: WMS_LAYER_NAME,
            info_format: 'application/json',
            x: 0,
            y: 0,
            bbox: [
                position.longitude - SELECT_BOX_THRESHOLD,
                position.latitude - SELECT_BOX_THRESHOLD,
                position.longitude + SELECT_BOX_THRESHOLD,
                position.latitude + SELECT_BOX_THRESHOLD
            ]
        }

        return await new web.Request(this.buildUrl(parameters)).get().then(res => res.json());
    }

    private static buildUrl(parameters) {
        let url = `${API_BASE_URL}?`;
    
        for (const key in parameters) {
            url += `${key}=${parameters[key]}&`;
        }
        
        url = url.slice(0, -1);
    
        return url;
    }
}