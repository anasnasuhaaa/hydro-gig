"""Run from backend: python -m experimental.normalize. Raw files are read only."""

import csv
import hashlib
import json
from pathlib import Path

from app.schemas.experimental import Edge, Fixture, Frame, Node, Sample

RAW = Path(__file__).resolve().parents[2] / "data/raw"
OUTPUT = Path(__file__).parent / "processed/small-v1.json"
FILES = (
    "02_road_network_nodes.csv",
    "02_road_network_edges.csv",
    "04_inundation_scenarios_t0_t1_t2.json",
)


def normalize(raw: Path = RAW) -> Fixture:
    payloads = {name: (raw / name).read_bytes() for name in FILES}
    nodes = [
        Node(node_id=r["node_id"], x=float(r["lon"]), y=float(r["lat"]))
        for r in csv.DictReader(payloads[FILES[0]].decode().splitlines())
    ]
    edges = []
    for r in csv.DictReader(payloads[FILES[1]].decode().splitlines()):
        if r["direction"] != "ONE_WAY":
            raise ValueError("Ambiguous direction")
        edges.append(
            Edge(
                edge_id=r["edge_id"],
                source_node=r["from_node"],
                target_node=r["to_node"],
                length_m=float(r["length_m"]),
            )
        )
    frames = []
    source = json.loads(payloads[FILES[2]])
    for step, frame in source.items():
        if step != frame["time_step"]:
            raise ValueError("Frame identity mismatch")
        samples = {}
        by_id = {e.edge_id: e for e in edges}
        for edge_id, row in frame["edges"].items():
            edge = by_id[edge_id]
            if (
                row["edge_id"],
                row["time_step"],
                row["timestamp"],
                row["from_node"],
                row["to_node"],
                row["length_m"],
            ) != (
                edge_id,
                step,
                frame["timestamp"],
                edge.source_node,
                edge.target_node,
                edge.length_m,
            ):
                raise ValueError("Invalid edge/frame join")
            samples[edge_id] = Sample(
                weight=row["dijkstra_weight_W"],
                h_m=row.get("h_m"),
                u_ms=row.get("u_ms"),
                v_ms=row.get("v_ms"),
            )
        frames.append(Frame(step=step, timestamp=frame["timestamp"], samples=samples))
    return Fixture(
        source_hashes={name: hashlib.sha256(data).hexdigest() for name, data in payloads.items()},
        nodes=nodes,
        edges=edges,
        frames=frames,
    )


if __name__ == "__main__":
    content = normalize().model_dump_json(indent=2) + "\n"
    if OUTPUT.exists() and OUTPUT.read_text() != content:
        raise SystemExit("Immutable version differs: create a new version instead")
    OUTPUT.write_text(content)
