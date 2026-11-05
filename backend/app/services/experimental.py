from functools import lru_cache
from pathlib import Path

from app.schemas.experimental import Fixture, Frame, Network, Scenarios

DATA = Path(__file__).resolve().parents[2] / "experimental/processed/small-v1.json"


@lru_cache(maxsize=1)
def _load() -> Fixture:
    return Fixture.model_validate_json(DATA.read_text())


def load() -> Fixture:
    # Never expose cached mutable dictionaries to request code.
    return _load().model_copy(deep=True)


def network() -> Network:
    data = load()
    return Network(nodes=data.nodes, edges=data.edges, source_hashes=data.source_hashes)


def scenarios() -> Scenarios:
    return Scenarios(
        frames=[{"step": f.step, "timestamp": f.timestamp.isoformat()} for f in load().frames]
    )


def frame(scenario_id: str, step: str) -> Frame:
    data = load()
    if scenario_id == data.scenario_id:
        for item in data.frames:
            if item.step == step:
                return item
    raise LookupError("Unknown experimental scenario or frame")
