from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from typing import List
from app.database.session import get_db
from app.models.models import EnvironmentMetric, User
from app.schemas.schemas import EnvironmentMetricCreate, EnvironmentMetricOut
from app.api.routers.auth import get_current_user

router = APIRouter(prefix="/api/environment", tags=["Environment"])


@router.get("/metrics", response_model=List[EnvironmentMetricOut])
def list_metrics(
    category: str = None,
    period: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(EnvironmentMetric)
    if category:
        query = query.filter(EnvironmentMetric.category == category)
    if period:
        query = query.filter(EnvironmentMetric.period == period)
    return query.order_by(EnvironmentMetric.created_at.desc()).all()


@router.post("/metrics", response_model=EnvironmentMetricOut, status_code=201)
def create_metric(
    data: EnvironmentMetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    metric = EnvironmentMetric(
        **data.model_dump(),
        recorded_by_id=current_user.id,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric


@router.get("/summary")
def environment_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregate environmental KPIs for dashboard cards and charts."""
    categories = ["carbon", "energy", "water", "waste"]
    summary = {}
    for cat in categories:
        total = (
            db.query(sql_func.sum(EnvironmentMetric.value))
            .filter(EnvironmentMetric.category == cat)
            .scalar()
        ) or 0
        count = (
            db.query(sql_func.count(EnvironmentMetric.id))
            .filter(EnvironmentMetric.category == cat)
            .scalar()
        )
        summary[cat] = {"total": total, "entries": count}

    # Trend data – last 6 periods per category
    trends = {}
    for cat in categories:
        rows = (
            db.query(EnvironmentMetric.period, sql_func.sum(EnvironmentMetric.value))
            .filter(EnvironmentMetric.category == cat)
            .group_by(EnvironmentMetric.period)
            .order_by(EnvironmentMetric.period.desc())
            .limit(6)
            .all()
        )
        trends[cat] = [{"period": r[0], "value": r[1]} for r in reversed(rows)]

    return {"summary": summary, "trends": trends}


@router.delete("/metrics/{metric_id}", status_code=204)
def delete_metric(
    metric_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    metric = db.query(EnvironmentMetric).filter(EnvironmentMetric.id == metric_id).first()
    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")
    db.delete(metric)
    db.commit()
