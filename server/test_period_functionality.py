#!/usr/bin/env python3
"""
Test script for period functionality in usage statistics.
This script tests that different time periods work correctly.
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

from django.test import RequestFactory
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from core.views.admin_views import admin_usage_stats

def test_period_parameters():
    """Test that different period parameters work correctly"""
    print("=== Testing Period Parameters ===")
    
    try:
        # Create a test admin user
        factory = RequestFactory()
        
        # Create or get admin user
        admin_user, created = User.objects.get_or_create(
            username='testadmin_period',
            defaults={
                'email': 'admin_period@test.com',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        # Create token for admin user
        token, created = Token.objects.get_or_create(user=admin_user)
        
        # Test different periods
        test_periods = [
            ('7d', 7, '7 Days'),
            ('1m', 30, '1 Month'),
            ('3m', 90, '3 Months'),
            ('6m', 180, '6 Months'),
            ('1y', 365, '1 Year'),
            ('invalid', 7, 'Invalid (should default to 7 days)')
        ]
        
        for period_param, expected_days, description in test_periods:
            print(f"\n--- Testing {description} ---")
            
            # Create request with period parameter
            request = factory.get(f'/usage/?period={period_param}')
            request.user = admin_user
            request.auth = token
            
            # Call the API
            response = admin_usage_stats(request)
            
            if response.status_code == 200:
                data = response.data
                print(f"✓ API call successful for period: {period_param}")
                
                # Check if period and daysCount are returned
                returned_period = data.get('period')
                returned_days = data.get('daysCount')
                daily_login_usage = data.get('dailyLoginUsage', [])
                
                print(f"  - Returned period: {returned_period}")
                print(f"  - Returned days count: {returned_days}")
                print(f"  - Daily login usage entries: {len(daily_login_usage)}")
                
                # Verify the period parameter is correctly processed
                if period_param == 'invalid':
                    expected_period = '7d'  # Should default to 7d
                else:
                    expected_period = period_param
                
                if returned_period == expected_period:
                    print(f"✓ Period parameter correctly processed")
                else:
                    print(f"✗ Period parameter mismatch: expected {expected_period}, got {returned_period}")
                
                # Verify the days count
                if returned_days == expected_days:
                    print(f"✓ Days count correct: {returned_days}")
                else:
                    print(f"✗ Days count mismatch: expected {expected_days}, got {returned_days}")
                
                # Verify the daily login usage has the correct number of entries
                if len(daily_login_usage) == expected_days:
                    print(f"✓ Daily login usage has correct number of entries: {len(daily_login_usage)}")
                else:
                    print(f"ℹ Daily login usage entries: {len(daily_login_usage)} (may be less than {expected_days} if no historical data)")
                
                # Check date range
                if daily_login_usage:
                    first_date = daily_login_usage[0]['date']
                    last_date = daily_login_usage[-1]['date']
                    print(f"  - Date range: {first_date} to {last_date}")
                
            else:
                print(f"✗ API call failed with status {response.status_code}")
                print(f"  Error: {response.data}")
                
    except Exception as e:
        print(f"✗ Error in period parameters test: {e}")
        import traceback
        traceback.print_exc()

def test_default_period():
    """Test that no period parameter defaults to 7 days"""
    print("\n=== Testing Default Period (No Parameter) ===")
    
    try:
        from django.test import RequestFactory
        from django.contrib.auth.models import User
        from rest_framework.authtoken.models import Token
        
        # Create a test admin user
        factory = RequestFactory()
        
        # Create or get admin user
        admin_user, created = User.objects.get_or_create(
            username='testadmin_default',
            defaults={
                'email': 'admin_default@test.com',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        # Create token for admin user
        token, created = Token.objects.get_or_create(user=admin_user)
        
        # Create request without period parameter
        request = factory.get('/usage/')
        request.user = admin_user
        request.auth = token
        
        # Call the API
        response = admin_usage_stats(request)
        
        if response.status_code == 200:
            data = response.data
            print("✓ API call successful without period parameter")
            
            returned_period = data.get('period')
            returned_days = data.get('daysCount')
            
            if returned_period == '7d' and returned_days == 7:
                print("✓ Default period correctly set to 7 days")
            else:
                print(f"✗ Default period incorrect: period={returned_period}, days={returned_days}")
                
        else:
            print(f"✗ API call failed with status {response.status_code}")
            
    except Exception as e:
        print(f"✗ Error in default period test: {e}")

def cleanup_test_users():
    """Clean up test users"""
    print("\n=== Cleaning Up Test Data ===")
    
    try:
        from django.contrib.auth.models import User
        test_users = User.objects.filter(username__in=['testadmin_period', 'testadmin_default'])
        count = test_users.count()
        test_users.delete()
        print(f"✓ Cleaned up {count} test admin users")
        
    except Exception as e:
        print(f"✗ Error in cleanup: {e}")

if __name__ == '__main__':
    print("Period Functionality Test Suite")
    print("=" * 50)
    
    try:
        test_period_parameters()
        test_default_period()
        
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