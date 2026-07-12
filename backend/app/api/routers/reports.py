import csv
import io
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from typing import List

from app.database.session import get_db
from app.models.models import (
    Report, User, EnvironmentMetric, SocialInitiative, Policy,
    ComplianceIssue, Risk, Challenge, Audit,
)
from app.schemas.schemas import ReportRequest, ReportOut, DashboardStats
from app.api.routers.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "generated_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


# ── Dashboard ────────────────────────────────────────────────────────

@router.get("/dashboard-stats", response_model=DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    def total_for(category: str) -> int:
        return (
            db.query(sql_func.sum(EnvironmentMetric.value))
            .filter(EnvironmentMetric.category == category)
            .scalar()
        ) or 0

    return DashboardStats(
        total_carbon=total_for("carbon"),
        total_energy=total_for("energy"),
        total_water=total_for("water"),
        total_waste=total_for("waste"),
        active_initiatives=db.query(SocialInitiative).filter(SocialInitiative.status == "Active").count(),
        total_policies=db.query(Policy).count(),
        open_issues=db.query(ComplianceIssue).filter(ComplianceIssue.status.in_(["Open", "Under Review"])).count(),
        active_challenges=db.query(Challenge).filter(Challenge.is_active == True).count(),
        total_users=db.query(User).filter(User.is_active == True).count(),
    )


# ── Report generation ───────────────────────────────────────────────

def _gather_report_data(db: Session, report_type: str):
    data = {}
    if report_type in ("environmental", "comprehensive"):
        data["Environment Metrics"] = [
            ["Category", "Metric", "Value", "Unit", "Period"]
        ] + [
            [m.category, m.metric_name, m.value, m.unit, m.period]
            for m in db.query(EnvironmentMetric).order_by(EnvironmentMetric.created_at.desc()).limit(200).all()
        ]
    if report_type in ("social", "comprehensive"):
        data["Social Initiatives"] = [
            ["Title", "Category", "Status", "Target", "Actual"]
        ] + [
            [s.title, s.category, s.status, s.target_participants, s.actual_participants]
            for s in db.query(SocialInitiative).order_by(SocialInitiative.created_at.desc()).limit(200).all()
        ]
    if report_type in ("governance", "comprehensive"):
        data["Policies"] = [["Title", "Version", "Created At"]] + [
            [p.title, p.version, p.created_at.strftime("%Y-%m-%d") if p.created_at else ""]
            for p in db.query(Policy).order_by(Policy.created_at.desc()).limit(100).all()
        ]
        data["Compliance Issues"] = [["Title", "Severity", "Status"]] + [
            [c.title, c.severity, c.status]
            for c in db.query(ComplianceIssue).order_by(ComplianceIssue.created_at.desc()).limit(100).all()
        ]
        data["Risks"] = [["Title", "Likelihood", "Impact", "Status"]] + [
            [r.title, r.likelihood, r.impact, r.status]
            for r in db.query(Risk).order_by(Risk.created_at.desc()).limit(100).all()
        ]
        data["Audits"] = [["Title", "Status", "Scheduled Date"]] + [
            [a.title, a.status, a.scheduled_date.strftime("%Y-%m-%d") if a.scheduled_date else ""]
            for a in db.query(Audit).order_by(Audit.created_at.desc()).limit(100).all()
        ]
    return data


def _build_csv(title: str, data: dict) -> str:
    filename = f"{title.replace(' ', '_')}_{int(datetime.now(timezone.utc).timestamp())}.csv"
    path = os.path.join(REPORTS_DIR, filename)
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([title])
        writer.writerow([f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}"])
        writer.writerow([])
        for section, rows in data.items():
            writer.writerow([section])
            for row in rows:
                writer.writerow(row)
            writer.writerow([])
    return path


def _build_pdf(title: str, data: dict) -> str:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    filename = f"{title.replace(' ', '_')}_{int(datetime.now(timezone.utc).timestamp())}.pdf"
    path = os.path.join(REPORTS_DIR, filename)
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(path, pagesize=A4)
    elements = [
        Paragraph(f"<b>EcoSphere ESG Report — {title}</b>", styles["Title"]),
        Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]),
        Spacer(1, 0.5 * cm),
    ]

    if not data:
        elements.append(Paragraph("No data available for this report type.", styles["Normal"]))

    for section, rows in data.items():
        elements.append(Paragraph(section, styles["Heading2"]))
        if len(rows) > 1:
            table = Table(rows, hAlign="LEFT")
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E7D32")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F9FC")]),
            ]))
            elements.append(table)
        else:
            elements.append(Paragraph("No records found.", styles["Normal"]))
        elements.append(Spacer(1, 0.5 * cm))

    doc.build(elements)
    return path


@router.post("/generate", response_model=ReportOut, status_code=201)
def generate_report(
    data: ReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.report_type not in ("environmental", "social", "governance", "comprehensive"):
        raise HTTPException(status_code=400, detail="Invalid report_type")
    if data.format not in ("pdf", "csv"):
        raise HTTPException(status_code=400, detail="Invalid format")

    report_data = _gather_report_data(db, data.report_type)

    if data.format == "csv":
        path = _build_csv(data.title, report_data)
    else:
        path = _build_pdf(data.title, report_data)

    report = Report(
        title=data.title,
        report_type=data.report_type,
        format=data.format,
        generated_by_id=current_user.id,
        file_path=path,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/", response_model=List[ReportOut])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Report).order_by(Report.created_at.desc()).limit(50).all()


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report or not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")

    media_type = "application/pdf" if report.format == "pdf" else "text/csv"
    filename = os.path.basename(report.file_path)
    return FileResponse(report.file_path, media_type=media_type, filename=filename)


@router.delete("/{report_id}", status_code=204)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.file_path and os.path.exists(report.file_path):
        try:
            os.remove(report.file_path)
        except OSError:
            pass
    db.delete(report)
    db.commit()
