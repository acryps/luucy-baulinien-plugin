import { API_BASE_URL, WMS_LAYER_NAME } from 'constants';
import { ConstructionLineHandler } from './handler/construction-line-handler';
import { Service } from './service';

const app = ui.createProjectPanelSection();
app.add(new ui.Paragraph(
    'Click on the map to view information about the selected construction line.'
    .translate.german('Klicken Sie auf die Karte, um Informationen über die ausgewählte Baulinie anzuzeigen.')
));

const separator = new ui.Separator();
app.add(separator);

const constructionLineHandler = new ConstructionLineHandler(app, separator);

const wmsLayer = new map.layer.WMSLayer('Baulinien', API_BASE_URL, WMS_LAYER_NAME, {
    format: 'image/png',
    transparent: true
});

wmsLayer.hide();
wmsLayer.onPositionSelect.subscribe(globalPositions => constructionLineHandler.select(globalPositions));

app.onOpen.subscribe(() => {
    wmsLayer.show();
    constructionLineHandler.showAll();
});

app.onClose.subscribe(() => {
    wmsLayer.hide();
    constructionLineHandler.hideAll();
});
