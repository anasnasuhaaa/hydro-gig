from typing import Protocol

from app.schemas.claims import ClaimRequest, ClaimResponse


class ClaimIssuer(Protocol):
    """Future service: authorize/persist evidence before canonicalization and HMAC signing."""

    def issue(self, request: ClaimRequest) -> ClaimResponse: ...


class EvidenceSigner(Protocol):
    """Server-only boundary; canonical envelope bytes and managed key ID, never frontend keys."""

    def sign(self, canonical_envelope: bytes, *, key_id: str) -> str: ...
