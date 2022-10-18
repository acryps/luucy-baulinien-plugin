import { Highlight } from '../models/highlight';
import { FeatureInfo } from '../models/feature-info';
import { API_BASE_URL, WMS_LAYER_NAME, SELECT_BOX_THRESHOLD } from '../constants';
import { Service } from '../service';

export class ConstructionLineHandler {
    private readonly app: ui.AppSection;
    private readonly separator: ui.Separator;
    
    private readonly lineColor: Color;
    private readonly lineThickness: number;
    private readonly markerColor: Color;

    private highlights: Highlight[];

    constructor(app: ui.AppSection, separator: ui.Separator) {
        this.app = app;
        this.separator = separator;

        this.lineColor = Color.lightpink;
        this.lineThickness = 3;
        this.markerColor = Color.lightpink;

        this.highlights = [];
    }

    async select(position: GlobalPosition) {
        this.addHighlight(await Service.select(position));
    }

    showAll() {
        for (const highlight of this.highlights) {
            highlight.line = new map.Line(highlight.coordinates, this.lineColor, this.lineThickness);

            if (highlight.showMarkers) {
                for (const marker of highlight.markers) {
                    marker.show();
                }
            }
        }
    }

    hideAll() {
        for (const highlight of this.highlights) {
            highlight.line.remove();

            for (const marker of highlight.markers) {
                marker.hide();
            }
        }
    }
    
    private addHighlight(featureInfo: FeatureInfo) {
        const props = featureInfo.features[0]?.properties;

        if (!props) {
            return;
        }

        const coordinates = featureInfo.features[0].geometry.coordinates.map(c => new GlobalPosition(c[1], c[0]));

        const line = new map.Line(coordinates, this.lineColor, this.lineThickness);
        const section = new ui.Section(props.ogc_fid.toString());
        
        const markers = coordinates.map(p => {
            const marker = new map.Marker(p, this.markerColor);
            marker.overlayBuildings = true;
            marker.hide();

            return marker;
        });

        const highlight: Highlight = { line, section, coordinates, markers, showMarkers: false }
        this.highlights.push(highlight);

        section.createAction(ui.icons.remove, 'Remove', () => this.removeHighlight(highlight));

        section.add(new ui.LabeledValue('Canton'.translate.german('Kanton'), props.kanton));
        section.add(new ui.LabeledValue('Main Usage'.translate.german('Hauptnutzung'), props.hauptnut_1));
        section.add(new ui.LabeledValue('Published at'.translate.german('Publiziert am'), new Date(props.publiziert).toDateString()));

        const showMarkersCheckbox = new ui.Checkbox('Show Point Markers'.translate.german('Punktemarkierungen anzeigen'), false);
        showMarkersCheckbox.onValueChange.subscribe(checked => this.togglePointMarkers(checked, highlight));

        section.add(showMarkersCheckbox);

        section.add(new ui.Button(
            'Focus'.translate.german('Fokussieren'), 
            () => this.focusHighlight(highlight)
        ));

        section.add(new ui.Button(
            'Download GeoJSON'.translate.german('GeoJSON herunterladen'), 
            () => ui.download(this.buildGeoJSONFile(props.ogc_fid.toString(), 'LineString', featureInfo.features[0].geometry.coordinates))
        ));

        section.add(new ui.Button(
            'Add as Shape'.translate.german('Als Form hinzufügen'), 
            () => line.releaseToVariant(props.hauptnut_1)
        ));

        this.app.insertAfter(section, this.separator);
    }

    private removeHighlight(highlight: Highlight) {
        highlight.section.parent.remove(highlight.section);
        highlight.line.remove();

        for (const marker of highlight.markers) {
            marker.remove();
        }

        this.highlights.splice(this.highlights.indexOf(highlight), 1);
    }

    private togglePointMarkers(checked: boolean, highlight: Highlight) {
        highlight.showMarkers = checked;

        if (checked) {
            for (const marker of highlight.markers) {
                marker.show();
            }
        } else {
            for (const marker of highlight.markers) {
                marker.hide();
            }
        }
    }

    private focusHighlight(highlight: Highlight) {
        map.focus([highlight.line]);
    }

    private buildGeoJSONFile(id: string, type: string, coordinates: [longitude: number, latitude: number][]): File {
        let content = { type, coordinates };

        return File.fromString(`${id}-${Date.now()}.geojson`, JSON.stringify(content));
    }
}
