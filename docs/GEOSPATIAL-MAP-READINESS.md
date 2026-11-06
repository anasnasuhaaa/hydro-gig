# Geospatial map readiness

Assessment: 2026-11-06. No geographic overlay, satellite toggle or traffic layer is enabled by this refinement.

## What exists

The public experimental API exposes 12 nodes with source `x/y` coordinates and 20 directed edges with IDs, endpoints and supplied `length_m`. The SVG linearly scales degree-like coordinates; it does not interpret a CRS or derive lengths. The legacy graph uses local schematic coordinates. Neither is a verified Bogor road extract.

Local, untracked inputs include `03_hydrogig_network_time_series.geojson` (20 LineStrings and 12 Points) and `03_hydrogig_master_spatial_temporal.geojson` (2,400 line features). The local dataset audit describes these as duplicated representations, not independent observations. They are not runtime map sources. File naming, plausible coordinates and matching hashes do not prove acquisition, OSM origin, ownership, or CRS. The larger family must not be substituted for the small network.

## Gates before a geographic route layer

1. Obtain the acquisition/generation manifest, source version, redistribution permission, authoritative CRS and coordinate order. RFC 7946 defines WGS84 decimal-degree GeoJSON; a `.geojson` extension does not prove the supplied values comply. See [the GeoJSON specification](https://www.rfc-editor.org/rfc/rfc7946).
2. Independently verify road geometry, topology, direction, motorcycle traversal rules, lengths and intersections. A future OSM extraction needs a reproducible query, extraction date, stable way/segment identity, license and attribution review.
3. Normalize LineStrings with exact versioned edge correspondence. Preserve reciprocal and parallel edge IDs; prove ordered route concatenation and frame joins. A new graph needs a validated spatial/temporal crosswalk before assigning any existing inundation samples. Similar names or nearest geometry are insufficient.
4. Keep road, hazard and computed-route provenance separate. Verified roads cannot turn simulated hazards into observations. Retain issue/valid times, missing fields and uncertainty.
5. Supply a licensed basemap style, tiles, attribution, credentials policy, allowed origins, quotas and offline/error behavior. The installed MapLibre adapter is a rendering boundary, not a data license or importer. MapLibre supports GeoJSON line sources and layers ([official example](https://maplibre.org/maplibre-gl-js/docs/examples/add-a-geojson-line/)); rendering capability does not validate source roads.

## Satellite and traffic requirements

Satellite needs a provider agreement permitting the intended application, a documented raster tile endpoint and zoom/coverage limits, acquisition dates, attribution, caching/export rights and cost limits. Consumer-map screenshots or arbitrary tile scraping are not an acceptable source. No provider or account has been selected or validated in this task.

Traffic needs an independent licensed provider with motorcycle-relevant coverage, direction-aware road correspondence, observation/prediction distinction, timestamp/freshness and outage semantics, units, attribution and display rights. Stored experimental flood weights are neither speed nor live congestion. No traffic observations, provider integration or traffic coverage are available here.

## Safe demonstration today

Use the directed schematic, actual backend route alternatives, historical t0–t4 replay and raw source samples labeled simulated/unverified. Keep weather as separate model-derived context. Show physical supplied distance separately from experimental objective cost. Evidence exports prove content consistency through SHA-256, not incident authenticity, legal validity or flood safety.
