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
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Check if there are existing admin users
        existing_admins = db.query(User).filter(User.is_admin == True).all()
        if existing_admins:
            print("📋 Existing admin users found:")
            for admin in existing_admins:
                print(f"   - {admin.username} ({admin.email})")
            print()
            
            choice = input("Do you want to (1) Create new admin, (2) Update existing user to admin, or (3) Exit? [1/2/3]: ").strip()
            
            if choice == "2":
                return update_existing_user_to_admin(db)
            elif choice == "3":
                print("👋 Exiting...")
                return True
            # Continue with choice == "1" or any other input
        
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


def update_existing_user_to_admin(db: Session):
    """Update an existing user to admin status"""
    print()
    print("📧 Enter the email of the user to make admin:")
    email = input("Email: ").strip()
    
    if not email:
        print("❌ Email cannot be empty")
        return False
    
    # Find user by email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"❌ User with email '{email}' not found")
        return False
    
    if user.is_admin:
        print(f"✅ User '{user.username}' ({user.email}) is already an admin")
        
        # Ask if they want to update the password
        update_pwd = input("Do you want to update their password? [y/N]: ").strip().lower()
        if update_pwd in ['y', 'yes']:
            password = getpass.getpass("Enter new admin password: ")
            if not password:
                print("❌ Password cannot be empty")
                return False
            
            password_confirm = getpass.getpass("Confirm new admin password: ")
            if password != password_confirm:
                print("❌ Passwords do not match")
                return False
            
            # Update password
            hashed_password = auth_service.get_password_hash(password)
            user.hashed_password = hashed_password
            db.commit()
            
            print("✅ Admin password updated successfully!")
        
        return True
    
    # Make user admin
    user.is_admin = True
    user.is_active = True
    user.is_verified = True
    user.plan_type = 'unlimited'
    
    # Set password if they don't have one (OAuth users)
    if not user.hashed_password:
        password = getpass.getpass("Enter admin password for this user: ")
        if not password:
            print("❌ Password cannot be empty")
            return False
        
        password_confirm = getpass.getpass("Confirm admin password: ")
        if password != password_confirm:
            print("❌ Passwords do not match")
            return False
        
        user.hashed_password = auth_service.get_password_hash(password)
    
    db.commit()
    db.refresh(user)
    
    print()
    print("✅ User updated to admin successfully!")
    print(f"   Username: {user.username}")
    print(f"   Email: {user.email}")
    print(f"   Admin: {user.is_admin}")
    print(f"   Plan: {user.plan_type}")
    print()
    print("🔒 They can now log in to the admin panel using their credentials.")
    
    return True

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
