import { FeatureInfo } from './models/feature-info';

const API_BASE_URL = 'https://geoserver1001.luucy.ch/geoserver/Baulinien/wms';
const WMS_LAYER_NAME = 'Baulinien:baulinien_select';
const BBOX_THRESHOLD = 0.001;

const app = ui.createProjectPanelSection();

const nothingSelectedInfo = new ui.Label('Nothing selected'.translate.german('Nichts ausgewählt'));
app.add(nothingSelectedInfo);
const selectionContainer = new ui.Container();
selectionContainer.hide();
app.add(selectionContainer);

const ogcFidInfo = new ui.LabeledValue('ogc fid'.translate.german('ogc fid'));
selectionContainer.add(ogcFidInfo);

const cantonInfo = new ui.LabeledValue('Canton'.translate.german('Kanton'));
selectionContainer.add(cantonInfo);

const commentsInfo = new ui.LabeledValue('Comments'.translate.german('Bemerkungen'));
selectionContainer.add(commentsInfo);

const mainUsageInfo = new ui.LabeledValue('Main Usage'.translate.german('Hauptnutzung'));
selectionContainer.add(mainUsageInfo);

const publishedAtInfo = new ui.LabeledValue('Published at'.translate.german('Publiziert am'));
selectionContainer.add(publishedAtInfo);

const wmsLayer = new map.layer.WMSLayer('Baulinien', API_BASE_URL, WMS_LAYER_NAME, {
    format: 'image/png',
    transparent: true
});

map.location.onBoundingBoxChange.subscribe(boundary => {
    console.log(boundary.topLeft, boundary.bottomRight);
})

wmsLayer.onPositionSelect.subscribe((position: GlobalPosition) => {
    const bbox = `${position.longitude - BBOX_THRESHOLD},${position.latitude - BBOX_THRESHOLD},${position.longitude + BBOX_THRESHOLD},${position.latitude + BBOX_THRESHOLD}`;
    const url = getGetFeatureInfoUrl(bbox);

    new web.Request(url).get().then(res => res.json()).then((data: FeatureInfo) => {
        nothingSelectedInfo.hide();
        selectionContainer.show();

        const infos = data.features[0].properties;
        ogcFidInfo.value = infos.ogc_fid.toString();
        cantonInfo.value = infos.kanton;
        commentsInfo.value = infos.bemerkunge;
        mainUsageInfo.value = infos.hauptnut_1;
        publishedAtInfo.value = new Date(infos.publiziert).getFullYear().toString();
    });
});

app.onOpen.subscribe(() => wmsLayer.show());

app.onClose.subscribe(() => {
    wmsLayer.hide();
    nothingSelectedInfo.show();
    selectionContainer.hide();
});

const getGetFeatureInfoUrl = (bbox: string) => {
    const params = {
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
        bbox
    }

    let url = `${API_BASE_URL}?`;

    for (const key of Object.keys(params)) {
        url += `${key}=${params[key]}&`;
    }

    
    url = url.slice(0, -1);

    return url;
}
