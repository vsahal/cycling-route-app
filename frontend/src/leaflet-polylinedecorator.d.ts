import L from "leaflet";

declare module "leaflet" {
  interface PatternSymbol {
    pixelSize?: number;
    pathOptions?: L.PathOptions;
  }

  interface PatternDef {
    offset?: string | number;
    repeat?: string | number;
    symbol: unknown;
  }

  namespace Symbol {
    function arrowHead(options: PatternSymbol): unknown;
  }

  function polylineDecorator(
    polyline: L.Polyline,
    options: { patterns: PatternDef[] },
  ): L.Layer;
}
