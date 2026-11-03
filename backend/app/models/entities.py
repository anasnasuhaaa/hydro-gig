import uuid
from datetime import datetime

from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Record


class Driver(Record, Base):
    __tablename__ = "drivers"
    display_name: Mapped[str] = mapped_column(String(120))


class RoadSegment(Record, Base):
    __tablename__ = "road_segments"
    __table_args__ = (CheckConstraint("length_m > 0", name="positive_length"),)
    source_reference: Mapped[str] = mapped_column(String(255), unique=True)
    geometry: Mapped[WKBElement] = mapped_column(Geometry("LINESTRING", srid=4326))
    length_m: Mapped[float] = mapped_column(Float)


class FloodScenario(Record, Base):
    __tablename__ = "flood_scenarios"
    __table_args__ = (
        CheckConstraint(
            "provenance IN ('observed', 'simulated', 'model_predicted')", name="valid_provenance"
        ),
    )
    name: Mapped[str] = mapped_column(String(160))
    provenance: Mapped[str] = mapped_column(String(24))
    source_reference: Mapped[str] = mapped_column(Text)
    # Units, model versions, parameter sources and uncertainties belong in this manifest.
    manifest: Mapped[dict] = mapped_column(JSONB, default=dict)


class FloodObservation(Record, Base):
    __tablename__ = "flood_observations"
    __table_args__ = (
        CheckConstraint("depth_m IS NULL OR depth_m >= 0", name="nonnegative_depth"),
        CheckConstraint(
            "provenance IN ('observed', 'simulated', 'model_predicted')", name="valid_provenance"
        ),
        CheckConstraint(
            "provenance = 'observed' OR scenario_id IS NOT NULL", name="derived_requires_scenario"
        ),
    )
    scenario_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("flood_scenarios.id", ondelete="RESTRICT"), index=True
    )
    road_segment_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("road_segments.id", ondelete="RESTRICT"), index=True
    )
    driver_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("drivers.id", ondelete="RESTRICT"), index=True
    )
    location: Mapped[WKBElement] = mapped_column(Geometry("POINT", srid=4326))
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    provenance: Mapped[str] = mapped_column(String(24))
    source_reference: Mapped[str] = mapped_column(Text)
    depth_m: Mapped[float | None] = mapped_column(Float)


class Trip(Record, Base):
    __tablename__ = "trips"
    __table_args__ = (
        CheckConstraint(
            "status IN ('planned', 'active', 'completed', 'cancelled')", name="valid_status"
        ),
        CheckConstraint(
            "ended_at IS NULL OR (started_at IS NOT NULL AND ended_at >= started_at)",
            name="valid_trip_times",
        ),
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("drivers.id", ondelete="RESTRICT"), index=True
    )
    status: Mapped[str] = mapped_column(String(24), default="planned")
    origin: Mapped[WKBElement] = mapped_column(Geometry("POINT", srid=4326))
    destination: Mapped[WKBElement] = mapped_column(Geometry("POINT", srid=4326))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Claim(Record, Base):
    __tablename__ = "claims"
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'submitted', 'reviewed')", name="valid_status"),
    )
    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="RESTRICT"), index=True
    )
    observation_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("flood_observations.id", ondelete="RESTRICT"), index=True
    )
    status: Mapped[str] = mapped_column(String(24), default="draft")
    description: Mapped[str] = mapped_column(Text)
    # No token is generated in Phase 1; nullable until signing/verification is implemented.
    evidence_digest: Mapped[str | None] = mapped_column(String(64), unique=True)
