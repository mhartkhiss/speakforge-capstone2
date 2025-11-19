#!/usr/bin/env python3
"""
Test script for admin user creation functionality.
This script tests that new users created by admin don't have language or lastLoginDate set.
"""

import os
import sys
import django
from datetime import datetime, timezone

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'speakforge_api.settings')
django.setup()

from firebase_admin import db, auth
from django.test import RequestFactory
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from core.views.admin_views import admin_user_list_create

def test_admin_user_creation():
    """Test that admin-created users don't have language or lastLoginDate set"""
    print("=== Testing Admin User Creation ===")
    
    try:
        # Create a test admin user
        factory = RequestFactory()
        
        # Create or get admin user
        admin_user, created = User.objects.get_or_create(
            username='testadmin',
            defaults={
                'email': 'admin@test.com',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        # Create token for admin user
        token, created = Token.objects.get_or_create(user=admin_user)
        
        # Test user data
        test_email = f"testuser_{datetime.now().timestamp()}@example.com"
        test_password = "testpassword123"
        
        # Create request to add new user
        request = factory.post('/users/', {
            'email': test_email,
            'password': test_password
        })
        request.user = admin_user
        request.auth = token
        
        # Call the API to create user
        response = admin_user_list_create(request)
        
        if response.status_code == 201:
            print("✓ User creation API call successful")
            
            # Get the created user ID from response
            user_id = response.data.get('userId')
            print(f"  - Created user ID: {user_id}")
            
            # Verify the user data in Firebase
            user_ref = db.reference(f'users/{user_id}')
            user_data = user_ref.get()
            
            if user_data:
                print("✓ User data retrieved from Firebase")
                
                # Check required fields are present
                required_fields = ['userId', 'email', 'accountType', 'username', 'status', 'translator', 'createdAt']
                missing_required = [field for field in required_fields if field not in user_data]
                
                if not missing_required:
                    print("✓ All required fields are present")
                else:
                    print(f"✗ Missing required fields: {missing_required}")
                
                # Check that language and lastLoginDate are NOT set
                if 'language' not in user_data:
                    print("✓ Language field is correctly NOT set")
                else:
                    print(f"✗ Language field should not be set, but found: {user_data['language']}")
                
                if 'lastLoginDate' not in user_data:
                    print("✓ LastLoginDate field is correctly NOT set")
                else:
                    print(f"✗ LastLoginDate field should not be set, but found: {user_data['lastLoginDate']}")
                
                # Verify default values
                expected_values = {
                    'email': test_email,
                    'accountType': 'free',
                    'username': test_email.split('@')[0],
                    'status': 'offline',
                    'translator': 'gemini'
                }
                
                for field, expected_value in expected_values.items():
                    actual_value = user_data.get(field)
                    if actual_value == expected_value:
                        print(f"✓ {field}: {actual_value}")
                    else:
                        print(f"✗ {field}: expected '{expected_value}', got '{actual_value}'")
                
                # Clean up - delete the test user
                try:
                    auth.delete_user(user_id)
                    user_ref.delete()
                    print("✓ Test user cleaned up successfully")
                except Exception as cleanup_error:
                    print(f"✗ Error cleaning up test user: {cleanup_error}")
                
            else:
                print("✗ Failed to retrieve user data from Firebase")
                
        else:
            print(f"✗ User creation failed with status {response.status_code}")
            print(f"  Error: {response.data}")
            
    except Exception as e:
        print(f"✗ Error in admin user creation test: {e}")
        import traceback
        traceback.print_exc()

def test_usage_stats_with_no_language_users():
    """Test that usage statistics handle users without language correctly"""
    print("\n=== Testing Usage Stats with Users Without Language ===")
    
    try:
        from core.views.admin_views import admin_usage_stats
        from django.test import RequestFactory
        from django.contrib.auth.models import User
        from rest_framework.authtoken.models import Token
        
        # Create a test admin user
        factory = RequestFactory()
        
        # Create or get admin user
        admin_user, created = User.objects.get_or_create(
            username='testadmin2',
            defaults={
                'email': 'admin2@test.com',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        # Create token for admin user
        token, created = Token.objects.get_or_create(user=admin_user)
        
        # Create request for usage stats
        request = factory.get('/usage/')
        request.user = admin_user
        request.auth = token
        
        # Call the usage stats API
        response = admin_usage_stats(request)
        
        if response.status_code == 200:
            data = response.data
            print("✓ Usage stats API call successful")
            
            # Check if language distribution includes "Not Set" category
            language_dist = data.get('languageDistribution', {})
            print(f"  - Language distribution: {language_dist}")
            
            if 'Not Set' in language_dist:
                print(f"✓ 'Not Set' language category found with {language_dist['Not Set']} users")
            else:
                print("ℹ No users without language found (this is normal if all users have language set)")
            
            # Verify other statistics are calculated correctly
            total_users = data.get('totalUsers', 0)
            language_total = sum(language_dist.values())
            
            if total_users == language_total:
                print(f"✓ Language distribution accounts for all {total_users} users")
            else:
                print(f"✗ Language distribution mismatch: {language_total} vs {total_users} total users")
                
        else:
            print(f"✗ Usage stats API call failed with status {response.status_code}")
            print(f"  Error: {response.data}")
            
    except Exception as e:
        print(f"✗ Error in usage stats test: {e}")
        import traceback
        traceback.print_exc()

def cleanup_test_users():
    """Clean up any test users"""
    print("\n=== Cleaning Up Test Data ===")
    
    try:
        # Clean up test admin users
        from django.contrib.auth.models import User
        test_users = User.objects.filter(username__in=['testadmin', 'testadmin2'])
        count = test_users.count()
        test_users.delete()
        print(f"✓ Cleaned up {count} test admin users")
        
    except Exception as e:
        print(f"✗ Error in cleanup: {e}")

if __name__ == '__main__':
    print("Admin User Creation Test Suite")
    print("=" * 50)
    
    try:
        test_admin_user_creation()
        test_usage_stats_with_no_language_users()
        
        print("\n" + "=" * 50)
        print("✓ All tests completed!")
        
    except Exception as e:
        print(f"\n✗ Test suite failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Ask user if they want to clean up test data
        cleanup_choice = input("\nClean up test data? (y/n): ").lower().strip()
        if cleanup_choice == 'y':
            cleanup_test_users()
        else:
            print("Test data preserved for manual inspection.") 