import hashlib
import json

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.experimental import ScreenRequest
from app.services.evidence import EvidenceContent, canonicalize, preview

REQUEST = dict(
    origin="N01", pickup="N03", destination="N12", scenario_id="small-inundation-v1", step="t4"
)


def test_deterministic_content_and_exact_references():
    first = preview(ScreenRequest(**REQUEST))
    second = preview(ScreenRequest(**REQUEST))
    assert first.sha256 == second.sha256
    assert first.created_at != second.created_at
    assert first.sha256 == hashlib.sha256(first.canonical_content.encode()).hexdigest()
    raw = first.content.model_dump(mode="json")
    reversed_fields = dict(reversed(list(raw.items())))
    assert canonicalize(EvidenceContent.model_validate(reversed_fields)) == first.canonical_content
    assert json.loads(first.canonical_content) == raw
    result = first.content.calculation
    assert result.request.model_dump() == REQUEST
    assert result.frame.step == "t4"
    assert result.frame.timestamp < first.created_at
    selected = {
        e
        for leg in [result.origin_to_pickup, result.pickup_to_destination]
        for path in [leg.baseline, leg.weighted]
        for e in path.edge_ids
    }
    assert set(first.content.route_samples) == selected
    assert set(first.content.affected_route_edge_ids) == selected & set(
        result.frame.changed_edge_ids
    )
    for edge, value in first.content.route_samples.items():
        assert value == result.frame.samples[edge]
    assert first.content.token is first.content.signature is None
    assert first.content.submission_status == "not_submitted"
    assert result.network_source == result.scenario_source == "unknown"
    other = preview(ScreenRequest(**{**REQUEST, "step": "t0"}))
    assert other.sha256 != first.sha256


def test_preview_api_rejects_untrusted_payloads():
    with TestClient(app) as client:
        endpoint = "/api/v1/experimental/evidence/preview"
        assert client.post(endpoint, json=REQUEST).status_code == 200
        assert client.post(endpoint, json={**REQUEST, "token": "fake"}).status_code == 422
        assert client.post(endpoint, json={**REQUEST, "origin": "missing"}).status_code == 422
        assert client.post(endpoint, json={**REQUEST, "step": "t9"}).status_code == 404
