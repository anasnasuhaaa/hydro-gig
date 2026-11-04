"""Future claim envelope only. No signing API or token generation is enabled."""

from typing import Annotated, Literal

from pydantic import AwareDatetime, Field

from app.schemas.contracts import Contract, Identifier, Provenance


class EvidenceReference(Contract):
    evidence_id: Identifier
    edge_id: Identifier
    captured_at: AwareDatetime
    provenance: Provenance
    source_dataset_id: Identifier
    source_version: Identifier
    sha256: Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]


class ClaimRequest(Contract):
    trip_id: Identifier
    network_id: Identifier
    scenario_id: Identifier
    step: Identifier
    occurred_at: AwareDatetime
    route_edge_ids: Annotated[list[Identifier], Field(min_length=1)]
    evidence: Annotated[list[EvidenceReference], Field(min_length=1)]
    parameter_version: Identifier
    consent_reference: Identifier


class ClaimResponse(Contract):
    status: Literal["unavailable"] = "unavailable"
    reason: str = "Evidence persistence, authorization and signing are not integrated."
    token: None = None
