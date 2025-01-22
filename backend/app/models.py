from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    BigInteger,
    DateTime,
    Date,
    create_engine,
    UniqueConstraint,
    ForeignKeyConstraint
)
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()

class Filing(Base):
    __tablename__ = 'filings'

    filing_id = Column(String(36), primary_key=True, nullable=False)
    cik = Column(String(60), nullable=False)
    filer_name = Column(String(100), nullable=False)
    period_of_report = Column(Date, nullable=False)
    filed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    holdings = relationship("Holding", back_populates="filing", cascade="all, delete")

    @property
    def year(self):
        return self.period_of_report.year if self.period_of_report else None

    @property
    def quarter(self):
        if self.period_of_report:
            month = self.period_of_report.month
            return f"Q{(month - 1) // 3 + 1}"
        return None

class Holding(Base):
    __tablename__ = 'holdings'

    holding_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cik = Column(String(60), nullable=False)
    cusip = Column(String(100), nullable=False)
    filing_id = Column(String(36), ForeignKey('filings.filing_id'), nullable=False)
    name_of_issuer = Column(String(100), nullable=False)
    value = Column(BigInteger, nullable=False)
    shares = Column(BigInteger, nullable=False, default=0)

    # Relationships
    filing = relationship("Filing", back_populates="holdings")
    holding_info = relationship("HoldingInfo", back_populates="holding", uselist=False)

    __table_args__ = (
        UniqueConstraint('filing_id', 'cusip', name='uix_filing_cusip'),
    )

class HoldingInfo(Base):
    __tablename__ = 'holding_infos'

    holding_id = Column(String(36), ForeignKey('holdings.holding_id'), primary_key=True)
    ticker = Column(String(20))
    security_name = Column(String(100))
    exchange_code = Column(String(10))
    security_type = Column(String(50))

    # Relationship
    holding = relationship("Holding", back_populates="holding_info")