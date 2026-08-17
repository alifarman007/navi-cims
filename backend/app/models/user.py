from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base
from app.models.enums import Status, UserType, db_enum

if TYPE_CHECKING:
    from app.models.config import Office
    from app.models.role import Role
    from app.models.ship_base import ShipBase


class User(AuditMixin, Base):
    __tablename__ = "users"

    user_type: Mapped[UserType] = mapped_column(db_enum(UserType, name="user_type"), nullable=False)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str | None] = mapped_column(String(150), unique=True, nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("roles.id", ondelete="SET NULL", use_alter=True, name="fk_users_role_id_roles")
    )
    office_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("offices.id", ondelete="SET NULL", use_alter=True, name="fk_users_office_id_offices"),
    )
    ship_base_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey(
            "ship_bases.id", ondelete="SET NULL", use_alter=True, name="fk_users_ship_base_id_ship_bases"
        ),
    )
    status: Mapped[Status] = mapped_column(
        db_enum(Status, name="status"), default=Status.ACTIVE, nullable=False
    )
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    avatar_url: Mapped[str | None] = mapped_column(String(500))

    role: Mapped[Role | None] = relationship("Role", lazy="selectin", foreign_keys=[role_id])
    office: Mapped[Office | None] = relationship("Office", lazy="selectin", foreign_keys=[office_id])
    ship_base: Mapped[ShipBase | None] = relationship(
        "ShipBase", lazy="selectin", foreign_keys=[ship_base_id]
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    user_agent: Mapped[str | None] = mapped_column(String(300))
    ip: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
