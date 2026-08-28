from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, Field


class Location(BaseModel):
    latitude: float
    longitude: float


class DeviceInfo(BaseModel):
    battery: Optional[float] = None
    status: str = "online"


class SensorData(BaseModel):
    node_id: str
    hazard: str
    timestamp: datetime
    location: Location

    measurements: Dict[str, float] = Field(default_factory=dict)

    device: Optional[DeviceInfo] = None