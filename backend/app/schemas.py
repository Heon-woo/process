from typing import Any

from pydantic import BaseModel, Field


class PasCreate(BaseModel):
    product: str
    tech: str
    process: str = "미지정"
    device: str = "미지정"
    title: str = "신규 공정 변경"
    requester: str = "현재 사용자"
    owner_team: str = "미지정"
    status: str = "작성중"
    priority: str = "보통"
    target_date: str
    change_type: str = "Recipe"
    equipment: str = ""
    recipe: str = ""
    comment: str = ""


class PasUpdate(BaseModel):
    process: str | None = None
    device: str | None = None
    title: str | None = None
    requester: str | None = None
    owner_team: str | None = None
    status: str | None = None
    priority: str | None = None
    target_date: str | None = None
    change_type: str | None = None
    equipment: str | None = None
    recipe: str | None = None
    comment: str | None = None


class CpmsUpdate(BaseModel):
    discriminator: str = Field(min_length=1, max_length=100)


class ColumnConfigUpdate(BaseModel):
    columns: list[dict[str, Any]]
    updated_by: str = "현재 사용자"


class BatchSettingUpdate(BaseModel):
    schedule: str


class AutomaticUploadCreate(BaseModel):
    product: str
    tech: str
    original_name: str
    stored_name: str
    size: int = Field(ge=0)
    uploaded_by: str = "System"
