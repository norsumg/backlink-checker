#!/usr/bin/env python3
"""
Create Admin User Script

This script creates an initial admin user for secure admin authentication.
Run this once after implementing the new secure admin authentication system.

Usage:
    python create_admin.py

The script will prompt for admin credentials and create a secure admin user.
"""

import sys
import getpass
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.services.auth_service import auth_service
from app.models.user import User

def create_admin_user():
    """Create an admin user interactively"""
    print("🔐 Admin User Creation")
    print("=" * 50)
    print("This will create a secure admin user for the new JWT-based authentication system.")
    print()
    
    # Get admin credentials
    username = input("Enter admin username: ").strip()
    if not username:
        print("❌ Username cannot be empty")
        return False
    
    email = input(f"Enter admin email (optional, default: {username}@admin.local): ").strip()
    if not email:
        email = f"{username}@admin.local"
    
    password = getpass.getpass("Enter admin password: ")
    if not password:
        print("❌ Password cannot be empty")
        return False
    
    password_confirm = getpass.getpass("Confirm admin password: ")
    if password != password_confirm:
        print("❌ Passwords do not match")
        return False
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Create admin user
        admin_user = auth_service.create_admin_user(
            db=db,
            username=username,
            password=password,
            email=email
        )
        
        print()
        print("✅ Admin user created successfully!")
        print(f"   Username: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   Admin: {admin_user.is_admin}")
        print(f"   Plan: {admin_user.plan_type}")
        print()
        print("🔒 You can now log in to the admin panel using these credentials.")
        print("   The old plain-text password authentication has been disabled.")
        
        return True
        
    except ValueError as e:
        print(f"❌ Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    finally:
        db.close()

def main():
    """Main function"""
    try:
        success = create_admin_user()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n❌ Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
