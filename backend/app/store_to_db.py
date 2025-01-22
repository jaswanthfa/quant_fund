from sec_api import QueryApi
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from database import SessionLocal
from models import Filing, Holding, HoldingInfo
import logging

# Set up logging
logging.basicConfig(
    filename='filings_log.txt',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

queryApi = QueryApi(api_key="a5b85fb6bed33a7a1ec24fe6f17b982c51a382807a4fd797da380a3f1ea7f321")


def fetch_13f_filings(start_date, end_date):
    """Fetch all 13F filings within a date range."""
    start = 0
    batch_size = 200
    all_filings = []

    while True:
        query = {
            "query": {
                "query_string": {
                    "query": f'formType:"13F-HR" AND NOT formType:"13F-HR/A" AND filedAt:[{start_date} TO {end_date}]'
                }
            },
            "from": start,
            "size": batch_size,
            "sort": [{"filedAt": {"order": "desc"}}],
        }

        response = queryApi.get_filings(query)
        filings = response.get("filings", [])
        if not filings:
            break

        all_filings.extend(filings)
        start += batch_size

    return all_filings


def save_to_db(session: Session, filings):
    """Save filings and their holdings to the database."""
    for idx, filing in enumerate(filings, start=1):
        logging.info(f"Processing filing {idx}/{len(filings)}: {filing['id']}")

        if len(filing.get("holdings", [])) == 0:
            logging.warning(f"Skipping empty filing: {filing['id']}")
            continue

        filing_id = filing["id"]

        if session.query(Filing).filter_by(filing_id=filing_id).first():
            logging.info(f"Filing already exists: {filing_id}")
            continue

        try:
            # Save Filing
            filing_record = Filing(
                filing_id=filing_id,
                cik=filing["cik"],
                filer_name=filing["companyName"].upper(),
                period_of_report=filing["periodOfReport"],
                filed_at=filing["filedAt"],
            )
            session.add(filing_record)
            session.flush()

            # Save Holdings and HoldingInfo
            for holding in filing["holdings"]:
                value = holding.get("value", 0)
                shares = holding["shrsOrPrnAmt"]["sshPrnamt"]

                if value > 9223372036854775807 or shares > 9223372036854775807:
                    logging.warning(f"Skipping oversized holding: value={value}, shares={shares}")
                    continue

                holding_record = Holding(
                    filing_id=filing_id,
                    cik=filing["cik"],
                    cusip=holding["cusip"],
                    name_of_issuer=holding["nameOfIssuer"].upper(),
                    value=value,
                    shares=shares,
                )
                session.add(holding_record)
                session.flush()

                if holding.get("holdingInfos"):
                    holding_info = holding["holdingInfos"][0]
                    holding_info_record = HoldingInfo(
                        holding_id=holding_record.holding_id,
                        ticker=holding_info.get("ticker", ""),
                        security_name=holding_info.get("securityName", ""),
                        exchange_code=holding_info.get("exchangeCode", ""),
                        security_type=holding_info.get("securityType", ""),
                    )
                    session.add(holding_info_record)

            session.commit()
            logging.info(f"Successfully saved filing: {filing_id}")

        except SQLAlchemyError as e:
            logging.error(f"Error saving filing {filing_id}: {e}")
            session.rollback()


def fill_database():
    """Fetch and save filings from the past 10 years."""
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=182)  # Start 6 months ago
    no_of_time_periods = 20  # Each time period = 6 months (182 days)

    with SessionLocal() as session:
        for _ in range(no_of_time_periods):
            start_date_str = start_date.strftime("%Y-%m-%d")
            end_date_str = end_date.strftime("%Y-%m-%d")

            logging.info(f"Fetching filings for {start_date_str} to {end_date_str}")
            filings = fetch_13f_filings(start_date_str, end_date_str)
            logging.info(f"Fetched {len(filings)} filings for {start_date_str} to {end_date_str}")

            if filings:
                save_to_db(session, filings)

            end_date = start_date
            start_date = end_date - timedelta(days=182)

    logging.info("Completed fetching and saving all filings.")


if __name__ == "__main__":
    fill_database()