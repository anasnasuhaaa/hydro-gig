# Deterministic demonstration — Phase 1.7 driver flow

**SIMULATED DATA — NOT REAL-TIME FLOOD MONITORING**

This demonstrates application interaction only. It contains no real Bogor road measurements, flood observations, hydrodynamic parameters, validated risk values, model predictions or safety recommendations. Demo fixtures never seed production tables.

## Run

Ikuti setup pada README; FastAPI dan frontend dapat berjalan tanpa PostgreSQL. Dari `/dashboard`, tekan **Periksa rute** → **Coba contoh perjalanan** → **Periksa rute**. Contoh manifest mengisi A (lokasi awal), C (penjemputan), F (tujuan), skenario pertama dan snapshot awal yang valid. **Ubah lokasi** membuka pemilih tiga titik tervalidasi; **Pengaturan simulasi** membuka skenario/bingkai. Setelah API merespons, bandingkan dua bagian perjalanan dan **Rute terpendek / Rute alternatif (simulasi)**, lalu **Lanjut ke navigasi**.

| API step (tetap) | Label Indonesia | English label |
| --- | --- | --- |
| `t0` | Kondisi awal | Initial condition |
| `t1` | 5 menit kemudian | 5 minutes later |
| `t2` | 10 menit kemudian | 10 minutes later |

`/navigation` menampilkan skema sintetis, linimasa, **Sebelumnya**, **Berikutnya**, dan **Atur ulang demo**. Ringkasan perubahan menghitung selisih biaya serta jalur dari respons API snapshot sebelumnya, bukan hanya daftar ruas terpengaruh saat ini. Karena itu `t2` menjelaskan BC/CD yang menurun kembali serta DF yang meningkat. Melompat langsung ke `t2` tetap membandingkan dengan `t1`. Jika pembanding gagal, ringkasan menyatakan belum tersedia dan menawarkan coba lagi; rute saat ini tetap dapat diperiksa. Tidak ada timer, marker pengemudi bergerak, GPS, prediksi cuaca atau aliran data langsung. Kontrol perjalanan/skenario berada di **Mode simulasi / riset**. `/claims` tetap belum menerbitkan bukti.

Pilihan demo saja disimpan di `sessionStorage` per tab (`hydrogig-demo-v1`), divalidasi Zod dan dicocokkan dengan titik/skenario/bingkai dari API sebelum dipakai. Tidak ada hasil API, koordinat, identitas atau bukti yang dipersistenkan. Data rusak dan ID yang tidak tersedia diabaikan; penyimpanan diblokir memakai fallback memori. Muat ulang memulihkan pilihan, tetapi menghitung ulang rute melalui API. **Atur ulang demo** menghapus pilihan pemeriksaan terakhir dan kembali ke contoh manifest pada snapshot awal. Sesi browser dapat berakhir saat tab ditutup.

Mengubah form menghapus hasil sebelumnya. Respons pemeriksaan yang datang setelah pilihan berubah tidak boleh mengumumkan keberhasilan atau mengganti perjalanan navigasi. Query navigasi menggunakan seluruh trip/skenario/step sebagai key dan AbortSignal; hasil lama tidak ditampilkan saat memuat/gagal. **Rincian teknis** mempertahankan ID, provenance eksperimental/simulasi, timestamp fiktif (tampilan Asia/Jakarta), engine serta weighting version. Seluruh endpoint, payload, fixture dan algoritme backend tetap sama.

## Fixture manifest and graph

`backend/demo/fixtures.json` contains a metadata manifest, normalized network, scenario and all three frames. It is included as Python package data; the provider reads a fresh validated object per call. Values and fictional timestamps are fixed. The provider needs no database, external services, random generator or mutable user simulation state.

Dataset `hydrogig-synthetic-v1`, network `synthetic-network-v1`, scenario `synthetic-corridors-v1`, fixture version `1.0.0`, weighting `authored-costs-v1`.

| Edge | Directed traversal | Authored length (synthetic m) |
| --- | --- | --- |
| AB | A → B | 100 |
| BC | B → C | 100 |
| CD | C → D | 100 |
| DF | D → F | 100 |
| AG | A → G | 140 |
| GC | G → C | 140 |
| CE | C → E | 160 |
| EF | E → F | 160 |
| FH | F → H | 100 |

All eight nodes belong to one weakly connected graph. H is a directed sink: it cannot originate a return journey. Nodes have unitless `LOCAL:SCHEMATIC` drawing positions; coordinates do not determine the authored lengths. The isolated SVG schematic uses directional arrows, route styling, segment labels and text warnings. MapLibre remains available separately but unmounted until licensed styles and geographic geometry exist.

| Frame | Fictional valid time (UTC) | Changed authored costs | A → C weighted edges | C → F weighted edges |
| --- | --- | --- | --- | --- |
| t0 | 2026-01-01 00:00 | None | AB, BC (200 units; 200 m) | CD, DF (200 units; 200 m) |
| t1 | 2026-01-01 00:05 | BC = 900; CD = 900 | AG, GC (280 units; 280 m) | CE, EF (320 units; 320 m) |
| t2 | 2026-01-01 00:10 | DF = 900; BC/CD reset | AB, BC (200 units; 200 m) | CE, EF (320 units; 320 m) |

Unchanged demo costs numerically equal synthetic lengths by fixture authorship only. These arbitrary units do not implement the research risk formula. The distance baseline stays AB/BC then CD/DF in all frames. At t0, no authored changes does **not** mean dry conditions or safe roads. Every edge's depth, velocity and risk are null/unavailable in every frame.

## Experimental API

All endpoints are under `/api/v1/demo`, are tagged experimental in OpenAPI, include the simulation envelope, and are independent of database settings.

| Method / path | Response |
| --- | --- |
| GET `/manifest` | Dataset identity/version, origin, limitations, default trip |
| GET `/scenarios` | Scenario list and ordered timestamped frames |
| GET `/network` | Normalized nodes, directed segments, CRS and provenance |
| GET `/scenarios/{scenario_id}/frames/{step}` | Explicit snapshot, authored costs and affected segments; missing physical values |
| POST `/screen` | Both trip legs, each with baseline and weighted route |

Example:

```bash
curl http://localhost:8000/api/v1/demo/manifest
curl http://localhost:8000/api/v1/demo/scenarios/synthetic-corridors-v1/frames/t1
curl -X POST http://localhost:8000/api/v1/demo/screen \
  -H 'Content-Type: application/json' \
  -d '{"origin":"A","pickup":"C","destination":"F","scenario_id":"synthetic-corridors-v1","step":"t1"}'
```

Representative fragment of the actual screen response (remaining envelope, frame, warnings, baseline and second-leg fields omitted here):

```json
{
  "experimental": true,
  "provenance": "simulated",
  "label": "SIMULATED DATA — NOT REAL-TIME FLOOD MONITORING",
  "origin_to_pickup": {
    "demonstration_weighted": {
      "status": "found",
      "mode": "demo_weighted",
      "node_ids": ["A", "G", "C"],
      "edge_ids": ["AG", "GC"],
      "total_length_m": 280.0,
      "total_weighted_cost": 280.0,
      "network_id": "synthetic-network-v1",
      "scenario_id": "synthetic-corridors-v1",
      "step": "t1",
      "provenance": "simulated",
      "calculation": {
        "algorithm": "heap-dijkstra",
        "engine_version": "demo-dijkstra-v1",
        "weighting_version": "authored-costs-v1",
        "cost_unit": "demo_cost_units",
        "warnings": [
          "SIMULATED DATA — NOT REAL-TIME FLOOD MONITORING",
          "Fixed-frame calculation; no travel-time forecast or safety guarantee."
        ]
      }
    }
  }
}
```

Unknown nodes, duplicate trip stops, missing/extra fields and invalid screen steps return 422. Unknown scenario/frame lookup returns 404. Unreachable directed journeys return 200 with per-leg `status: unreachable`, empty IDs and null totals, so a reachable second leg is still inspectable. Physical unknowns are never filled with zeros. OpenAPI provides complete request/response definitions.

## Replace the demo foundation

1. Implement `NetworkAdapter` for a specific GraphML/GeoJSON source and explicit attribute/CRS/unit mapping. Verify license, connectivity, parallel-edge identity and direction. Return a validated RoadNetwork, preserving source-ID mapping. There is no production importer in this phase.
2. Implement a provider for versioned scenarios/frames with traceable timestamps and provenance. Retain the synthetic provider and tests as a separate demonstration path; add separate observed/model-predicted endpoints and labels rather than disguising real data behind `/demo`.
3. Implement `WeightingProvider.costs` around the research team's Python risk module. Require empirical parameter sources/version, units, missing-data policy, temporal semantics, uncertainty and finite nonnegative costs. Missing values must not default to zero. Physical risk output stays separate from routing costs.
4. Implement `RoutingEngine.route` around the team's Modified Dijkstra module, translating its output to ordered IDs, lengths, cost, status and calculation metadata. The HTTP controller remains unchanged for the demo path; inject through `demo_service` or FastAPI dependency overrides for integration tests. Do not call an external Python module directly from the controller.
5. Test trusted reference graphs, directed/unreachable cases, temporal changes, CRS/ID joins and scientific reference cases before exposing real recommendations. Replace SVG with a GeoJSON-powered MapLibre layer only after geographic/attribution checks.

The temporary heap-based Dijkstra supports nonnegative costs (including zero), parallel edges, directed/two-way traversal, deterministic tie behavior, reconstruction and unreachable routes. Missing, negative or nonfinite costs fail closed. It makes one fixed-frame calculation for each leg/mode, not a time-dependent travel forecast. There is no calibrated risk engine, live navigation, real positioning, trained model, HMAC token issuer, claim persistence or platform penalty integration.

## Before the November 6 MVP

Obtain and normalize the team's licensed road graph and t0/t1/t2 scenario data; agree on CRS, edge mapping and timestamp semantics. Integrate versioned risk parameters and Modified Dijkstra through the existing boundaries, validate against research reference cases, and assess missing/stale-data behavior. Agree on evidence/token specifications, consent, persistence, canonicalization, signing/verification and key management before implementing claims. Validate Neon migrations in disposable infrastructure when provided; prepare and review Vercel configuration without automatic deployment. Complete a research-team walkthrough and clearly retain experimental provenance/limitations in the MVP.
