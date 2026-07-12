from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# Organization Schemas
class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationOut(OrganizationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Department Schemas
class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class DepartmentCreate(DepartmentBase):
    organization_id: int

class DepartmentOut(DepartmentBase):
    id: int
    organization_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    role: str = Field("Employee", description="Super Admin, ESG Manager, Department Manager, Employee")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    organization_name: Optional[str] = None  # To allow creating/joining an organization during sign-up
    department_name: Optional[str] = None    # To allow creating/joining a department during sign-up

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    organization_id: Optional[int] = None
    department_id: Optional[int] = None

class UserOut(UserBase):
    id: int
    xp: int
    is_active: bool
    organization_id: Optional[int] = None
    department_id: Optional[int] = None
    organization: Optional[OrganizationOut] = None
    department: Optional[DepartmentOut] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None

class TokenRefreshRequest(BaseModel):
    refresh_token: str
