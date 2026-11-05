import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.schemas.experimental import Fixture

PATH = Path(__file__).parents[1] / "experimental/processed/small-v1.json"


def fixture():
    return Fixture.model_validate_json(PATH.read_text())


def test_complete_fixture():
    data = fixture()
    assert (len(data.nodes), len(data.edges), len(data.frames)) == (12, 20, 5)
    assert all(len(f.samples) == 20 for f in data.frames)
    assert data.network_source == data.scenario_source == "unknown"


@pytest.mark.parametrize("mutation", ["endpoint", "weight", "missing_weight", "frame", "time"])
def test_reject_invalid_fixture(mutation):
    data = json.loads(PATH.read_text())
    if mutation == "endpoint":
        data["edges"][0]["target_node"] = "missing"
    elif mutation == "weight":
        data["frames"][0]["samples"]["E_01_02"]["weight"] = -1
    elif mutation == "missing_weight":
        del data["frames"][0]["samples"]["E_01_02"]
    elif mutation == "frame":
        data["frames"].pop()
    else:
        data["frames"][1]["timestamp"] = data["frames"][0]["timestamp"]
    with pytest.raises(ValidationError):
        Fixture.model_validate(data)
