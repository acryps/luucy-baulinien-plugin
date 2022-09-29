import { Highlight } from '../models/highlight';
import { FeatureInfo } from '../models/feature-info';
import { API_BASE_URL, WMS_LAYER_NAME, SELECT_BOX_THRESHOLD } from '../constants';

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

    select(position: GlobalPosition) {
        new web.Request(this.buildFeatureInfoUrl(position)).get()
            .then(res => res.json())
            .then((data: FeatureInfo) => this.addHighlight(data));
    }

    showAll() {
        for (const highlight of this.highlights) {
            highlight.line = new map.Line(highlight.globalPositions, this.lineColor, this.lineThickness);

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

        const globalPositions = featureInfo.features[0].geometry.coordinates.map(c =>
            new GlobalPosition(c[1], c[0]));

        const line = new map.Line(globalPositions, this.lineColor, this.lineThickness);
        const section = new ui.Section(props.ogc_fid.toString());
        
        const markers = globalPositions.map(p => {
            const marker = new map.Marker(p, this.markerColor);
            marker.overlayBuildings = true;
            marker.hide();

            return marker;
        });

        const highlight: Highlight = { line, section, globalPositions, markers, showMarkers: false }
        this.highlights.push(highlight);

        //#region add ui section elements
        section.createAction(ui.icons.remove, 'Remove', () => this.removeHighlight(highlight));

        section.add(
            new ui.LabeledValue('Canton'.translate.german('Kanton'), props.kanton)
        );
        section.add(
            new ui.LabeledValue('Main Usage'.translate.german('Hauptnutzung'), props.hauptnut_1)
        );
        section.add(
            new ui.LabeledValue('Published at'.translate.german('Publiziert am'), 
                new Date(props.publiziert).getFullYear().toString())
        );
        section.add(
            new ui.Label('Coordinates'.translate.german('Koordinaten'))
        );
        section.add(
            new ui.Paragraph(globalPositions.map(p => `${p.latitude} | ${p.longitude}`).join('\n'), 2)
        );

        const showMarkersCheckbox = new ui.Checkbox(
            'Show Point Markers'.translate.german('Punktemarkierungen anzeigen'), false);
        showMarkersCheckbox.onValueChange.subscribe(checked => this.togglePointMarkers(checked, highlight));
        section.add(showMarkersCheckbox);

        section.add(
            new ui.Button(
                'Focus'.translate.german('Fokussieren'), 
                () => this.focusHighlight(highlight)
            )
        );
        section.add(
            new ui.Button(
                'Download GeoJSON'.translate.german('GeoJSON herunterladen'), 
                () => ui.download(this.buildGeoJSONFile(props.ogc_fid.toString(), 'LineString', featureInfo.features[0].geometry.coordinates))
            )
        );

        this.app.insertAfter(section, this.separator);
        //#endregion
    }

    private removeHighlight(highlight: Highlight) {
        highlight.section.parent.remove(highlight.section);
        highlight.line.remove();

        for (const marker of highlight.markers) {
            marker.remove();
        }

        this.highlights.splice(
            this.highlights.length - 1, 1 // remove at index of last element (the current one)
        );
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

    private buildFeatureInfoUrl(position: GlobalPosition) {
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
            bbox: [
                position.longitude - SELECT_BOX_THRESHOLD,
                position.latitude - SELECT_BOX_THRESHOLD,
                position.longitude + SELECT_BOX_THRESHOLD,
                position.latitude + SELECT_BOX_THRESHOLD
            ]
        }
    
        let url = `${API_BASE_URL}?`;
    
        for (const key in params) {
            url += `${key}=${params[key]}&`;
        }
        
        url = url.slice(0, -1);
    
        return url;
    }
}
