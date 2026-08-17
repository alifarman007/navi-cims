"""SQLAlchemy declarative base and shared mixins."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, MetaData, func
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    def to_dict(self) -> dict:
        """Shallow column dict (used by audit log)."""
        out = {}
        for col in self.__table__.columns:  # type: ignore[attr-defined]
            val = getattr(self, col.name)
            if isinstance(val, datetime):
                val = val.isoformat()
            elif hasattr(val, "value"):  # enums
                val = val.value
            elif val is not None and not isinstance(val, (str, int, float, bool)):
                val = str(val)
            out[col.name] = val
        return out


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class AuditMixin(TimestampMixin):
    """Timestamps + who created/updated (FK to users, nullable so seeding works)."""

    @declared_attr
    def created_by_id(cls) -> Mapped[int | None]:  # noqa: N805
        return mapped_column(
            BigInteger,
            ForeignKey(
                "users.id",
                ondelete="SET NULL",
                use_alter=True,
                name=f"fk_{cls.__tablename__}_created_by_users",
            ),
            nullable=True,
        )

    @declared_attr
    def updated_by_id(cls) -> Mapped[int | None]:  # noqa: N805
        return mapped_column(
            BigInteger,
            ForeignKey(
                "users.id",
                ondelete="SET NULL",
                use_alter=True,
                name=f"fk_{cls.__tablename__}_updated_by_users",
            ),
            nullable=True,
        )
