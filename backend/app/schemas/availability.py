from pydantic import BaseModel, Field
from typing import Optional
from datetime import time, date


class AvailabilityBase(BaseModel):
    day_of_week: Optional[int] = None
    start_time: time
    end_time: time


class AvailabilityCreate(BaseModel):
    start_date: date
    end_date: date
    start_time: time
    end_time: time


class Availability(BaseModel):
    id: int
    item_id: int
    day_of_week: Optional[int] = None
    start_date: date
    end_date: date
    start_time: time
    end_time: time

    class Config:
        from_attributes = True



