export interface Highlight {
    line: map.Line,
    section: ui.Section,
    coordinates: GlobalPosition[],
    markers: map.Marker[],
    showMarkers: boolean
}
