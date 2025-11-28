from sqlalchemy import Column, Integer, ForeignKey, Time, String, Date
from sqlalchemy.orm import relationship
from app.core.database import Base


class Availability(Base):
    __tablename__ = "availabilities"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    day_of_week = Column(Integer, nullable=True)
    date = Column(Date, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    item = relationship("Item", back_populates="availabilities")



