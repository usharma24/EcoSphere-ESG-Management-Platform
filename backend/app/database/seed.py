from app.database.session import SessionLocal, Base, engine
from app.models.models import User, Organization, Department
from app.core.security import get_password_hash

def seed_db():
    # Ensure all tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if default admin already exists
        admin_exists = db.query(User).filter(User.email == "admin@ecosphere.com").first()
        if admin_exists:
            print("Database already seeded.")
            return

        # 1. Create Default Organization
        org = db.query(Organization).filter(Organization.name == "EcoSphere Corp").first()
        if not org:
            org = Organization(name="EcoSphere Corp")
            db.add(org)
            db.commit()
            db.refresh(org)

        # 2. Create Default Department
        dept = db.query(Department).filter(
            Department.name == "Sustainability Office", 
            Department.organization_id == org.id
        ).first()
        if not dept:
            dept = Department(name="Sustainability Office", organization_id=org.id)
            db.add(dept)
            db.commit()
            db.refresh(dept)

        # 3. Create Default Admin User
        admin_user = User(
            email="admin@ecosphere.com",
            hashed_password=get_password_hash("adminpassword"),
            full_name="System Administrator",
            role="Super Admin",
            organization_id=org.id,
            department_id=dept.id,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        
        print("Successfully seeded database:")
        print("Email: admin@ecosphere.com")
        print("Password: adminpassword")
        print("Organization: EcoSphere Corp")
        print("Department: Sustainability Office")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
