from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.session import get_db
from app.models.models import User, Policy, PolicyAcknowledgement, Audit, ComplianceIssue, Risk, Department
from app.schemas.schemas import (
    PolicyCreate, PolicyOut, PolicyUserOut, PolicyAcknowledgementOut,
    AuditCreate, AuditOut,
    ComplianceIssueCreate, ComplianceIssueUpdate, ComplianceIssueOut,
    RiskCreate, RiskUpdate, RiskOut
)
from app.api.routers.auth import get_current_user

router = APIRouter(prefix="/api/governance", tags=["governance"])

# Helper dependencies to restrict access
def check_esg_manager_or_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Super Admin", "ESG Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Super Admins and ESG Managers can perform this action."
        )
    return current_user

# ----------------- POLICIES -----------------

@router.get("/policies", response_model=List[PolicyUserOut])
def get_policies(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    policies = db.query(Policy).all()
    # Map current user's acknowledgements
    acks = {ack.policy_id: ack for ack in current_user.acknowledgements}
    
    result = []
    for policy in policies:
        ack = acks.get(policy.id)
        result.append({
            "policy": policy,
            "acknowledged": ack is not None,
            "acknowledged_at": ack.acknowledged_at if ack else None
        })
    return result

@router.post("/policies", response_model=PolicyOut, status_code=status.HTTP_201_CREATED)
def create_policy(
    policy_in: PolicyCreate,
    current_user: User = Depends(check_esg_manager_or_admin),
    db: Session = Depends(get_db)
):
    policy = Policy(
        title=policy_in.title,
        content=policy_in.content,
        version=policy_in.version,
        created_by_id=current_user.id
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy

@router.post("/policies/{policy_id}/acknowledge", response_model=PolicyAcknowledgementOut)
def acknowledge_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify policy exists
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")

    # Check if already acknowledged
    existing_ack = db.query(PolicyAcknowledgement).filter(
        PolicyAcknowledgement.policy_id == policy_id,
        PolicyAcknowledgement.user_id == current_user.id
    ).first()
    if existing_ack:
        return existing_ack

    # Create acknowledgement
    ack = PolicyAcknowledgement(policy_id=policy_id, user_id=current_user.id)
    db.add(ack)
    db.commit()
    db.refresh(ack)
    return ack

# ----------------- AUDITS -----------------

@router.get("/audits", response_model=List[AuditOut])
def get_audits(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Audit).order_by(Audit.scheduled_date.asc()).all()

@router.post("/audits", response_model=AuditOut, status_code=status.HTTP_201_CREATED)
def create_audit(
    audit_in: AuditCreate,
    current_user: User = Depends(check_esg_manager_or_admin),
    db: Session = Depends(get_db)
):
    audit = Audit(
        title=audit_in.title,
        description=audit_in.description,
        scheduled_date=audit_in.scheduled_date,
        auditor_name=audit_in.auditor_name,
        scope=audit_in.scope,
        status="Scheduled"
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit

# ----------------- COMPLIANCE ISSUES -----------------

@router.get("/compliance", response_model=List[ComplianceIssueOut])
def get_compliance_issues(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issues = db.query(ComplianceIssue).order_by(ComplianceIssue.created_at.desc()).all()
    
    # Enrich names
    result = []
    for issue in issues:
        reported_by = db.query(User).filter(User.id == issue.reported_by_id).first()
        assigned_to = db.query(User).filter(User.id == issue.assigned_to_id).first() if issue.assigned_to_id else None
        
        issue_out = ComplianceIssueOut.model_validate(issue)
        issue_out.reported_by_name = reported_by.full_name if reported_by else "System"
        issue_out.assigned_to_name = assigned_to.full_name if assigned_to else None
        result.append(issue_out)
        
    return result

@router.post("/compliance", response_model=ComplianceIssueOut, status_code=status.HTTP_201_CREATED)
def report_compliance_issue(
    issue_in: ComplianceIssueCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify policy if provided
    if issue_in.policy_id:
        policy = db.query(Policy).filter(Policy.id == issue_in.policy_id).first()
        if not policy:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referenced policy not found")

    issue = ComplianceIssue(
        title=issue_in.title,
        description=issue_in.description,
        severity=issue_in.severity,
        status="Open",
        policy_id=issue_in.policy_id,
        reported_by_id=current_user.id
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    
    issue_out = ComplianceIssueOut.model_validate(issue)
    issue_out.reported_by_name = current_user.full_name
    return issue_out

@router.patch("/compliance/{issue_id}", response_model=ComplianceIssueOut)
def update_compliance_issue(
    issue_id: int,
    issue_update: ComplianceIssueUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get issue
    issue = db.query(ComplianceIssue).filter(ComplianceIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compliance issue not found")

    # Authorize: Only Admin, ESG Manager, or Assignee can update
    # If updating status to Resolved/Closed, restrict to Admin, ESG Manager, or Department Manager
    if issue_update.status in ["Resolved", "Closed"] and current_user.role not in ["Super Admin", "ESG Manager", "Department Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers or Admins can resolve or close compliance issues."
        )

    # Perform updates
    if issue_update.severity is not None:
        issue.severity = issue_update.severity
    if issue_update.status is not None:
        old_status = issue.status
        issue.status = issue_update.status
        if issue_update.status in ["Resolved", "Closed"] and old_status not in ["Resolved", "Closed"]:
            issue.resolved_at = datetime.utcnow()
        elif issue_update.status not in ["Resolved", "Closed"]:
            issue.resolved_at = None
    if issue_update.assigned_to_id is not None:
        # Verify user exists
        assigned_user = db.query(User).filter(User.id == issue_update.assigned_to_id).first()
        if not assigned_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned user not found")
        issue.assigned_to_id = issue_update.assigned_to_id

    db.commit()
    db.refresh(issue)

    reported_by = db.query(User).filter(User.id == issue.reported_by_id).first()
    assigned_to = db.query(User).filter(User.id == issue.assigned_to_id).first() if issue.assigned_to_id else None

    issue_out = ComplianceIssueOut.model_validate(issue)
    issue_out.reported_by_name = reported_by.full_name if reported_by else "System"
    issue_out.assigned_to_name = assigned_to.full_name if assigned_to else None
    return issue_out

# ----------------- RISK REGISTER -----------------

@router.get("/risks", response_model=List[RiskOut])
def get_risks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Risk).order_by(Risk.created_at.desc()).all()

@router.post("/risks", response_model=RiskOut, status_code=status.HTTP_201_CREATED)
def create_risk(
    risk_in: RiskCreate,
    current_user: User = Depends(check_esg_manager_or_admin),
    db: Session = Depends(get_db)
):
    # Verify department if provided
    if risk_in.department_id:
        dept = db.query(Department).filter(Department.id == risk_in.department_id).first()
        if not dept:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referenced department not found")

    risk = Risk(
        title=risk_in.title,
        description=risk_in.description,
        likelihood=risk_in.likelihood,
        impact=risk_in.impact,
        mitigation_strategy=risk_in.mitigation_strategy,
        department_id=risk_in.department_id,
        status="Identified"
    )
    db.add(risk)
    db.commit()
    db.refresh(risk)
    return risk

@router.patch("/risks/{risk_id}", response_model=RiskOut)
def update_risk(
    risk_id: int,
    risk_update: RiskUpdate,
    current_user: User = Depends(check_esg_manager_or_admin),
    db: Session = Depends(get_db)
):
    risk = db.query(Risk).filter(Risk.id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk item not found")

    if risk_update.title is not None:
        risk.title = risk_update.title
    if risk_update.description is not None:
        risk.description = risk_update.description
    if risk_update.likelihood is not None:
        risk.likelihood = risk_update.likelihood
    if risk_update.impact is not None:
        risk.impact = risk_update.impact
    if risk_update.mitigation_strategy is not None:
        risk.mitigation_strategy = risk_update.mitigation_strategy
    if risk_update.status is not None:
        risk.status = risk_update.status
    if risk_update.department_id is not None:
        if risk_update.department_id == 0:  # Allow unlinking department
            risk.department_id = None
        else:
            dept = db.query(Department).filter(Department.id == risk_update.department_id).first()
            if not dept:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referenced department not found")
            risk.department_id = risk_update.department_id

    db.commit()
    db.refresh(risk)
    return risk
