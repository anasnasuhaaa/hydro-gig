"""Unsigned fixture evidence previews. No claims are issued or persisted."""

import hashlib
import json
from datetime import datetime, timezone
from typing import Literal

from pydantic import AwareDatetime

from app.schemas.contracts import Contract
from app.schemas.experimental import Sample, ScreenRequest, ScreenResponse
from app.services.experimental import load, screen


class EvidenceContent(Contract):
    schema_version: Literal["experimental-evidence-v1"] = "experimental-evidence-v1"
    scenario_version: Literal["1"] = "1"
    submission_status: Literal["not_submitted"] = "not_submitted"
    token: None = None
    signature: None = None
    source_hashes: dict[str, str]
    calculation: ScreenResponse
    route_samples: dict[str, Sample]
    affected_route_edge_ids: list[str]
    limitations: list[str] = [
        "Simulated / Unverified Data; no incident is established.",
        "Not Submitted to Any Platform; no exemption, payment or approval.",
        "SHA-256 identifies content only; it authenticates neither author nor occurrence.",
    ]


class EvidencePreview(Contract):
    created_at: AwareDatetime
    canonicalization: Literal["python-json-sorted-utf8-v1"] = "python-json-sorted-utf8-v1"
    digest_scope: Literal["content_only_excludes_created_at"] = "content_only_excludes_created_at"
    content: EvidenceContent
    canonical_content: str
    sha256: str


def canonicalize(content: EvidenceContent) -> str:
    return json.dumps(
        content.model_dump(mode="json"),
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
        allow_nan=False,
    )


def preview(request: ScreenRequest) -> EvidencePreview:
    result = screen(request)
    edges = sorted(
        {
            edge
            for leg in (result.origin_to_pickup, result.pickup_to_destination)
            for path in (leg.baseline, leg.weighted)
            for edge in path.edge_ids
        }
    )
    content = EvidenceContent(
        source_hashes=load().source_hashes,
        calculation=result,
        route_samples={edge: result.frame.samples[edge] for edge in edges},
        affected_route_edge_ids=sorted(set(edges) & set(result.frame.changed_edge_ids)),
    )
    canonical = canonicalize(content)
    return EvidencePreview(
        created_at=datetime.now(timezone.utc),
        content=content,
        canonical_content=canonical,
        sha256=hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
    )
