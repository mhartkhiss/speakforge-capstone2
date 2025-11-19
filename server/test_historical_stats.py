#!/usr/bin/env python3
"""
Test script for historical usage statistics functionality.
This script tests the new percentage calculation features.
"""

import os
import sys
import django
from datetime import datetime, timedelta, timezone

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'speakforge_api.settings')
django.setup()

from core.views.admin_views import (
    calculate_percentage_change, 
    store_daily_statistics, 
    get_previous_period_stats
)
from firebase_admin import db
import datetime as dt

def test_percentage_calculations():
    """Test the percentage change calculation function"""
    print("=== Testing Percentage Calculations ===")
    
    test_cases = [
        (100, 80, "+25.0%"),    # 100 vs 80 = +25%
        (80, 100, "-20.0%"),    # 80 vs 100 = -20%
        (100, 100, "+0.0%"),    # 100 vs 100 = 0%
        (50, 0, "+100%"),       # 50 vs 0 = +100%
        (0, 0, "0%"),           # 0 vs 0 = 0%
        (0, 50, "-100.0%"),     # 0 vs 50 = -100%
    ]
    
    for current, previous, expected in test_cases:
        result = calculate_percentage_change(current, previous)
        status = "✓" if result == expected else "✗"
        print(f"{status} {current} vs {previous} = {result} (expected: {expected})")

def test_store_statistics():
    """Test storing daily statistics"""
    print("\n=== Testing Statistics Storage ===")
    
    # Create test data
    test_date = "2024-01-15"
    test_stats = {
        'totalUsers': 150,
        'activeUsersLast7Days': 45,
        'premiumUsers': 20,
        'freeUsers': 130,
        'newUsersToday': 5,
        'dailyLoginCount': 25,
        'languageDistribution': {
            'English': 100,
            'Spanish': 30,
            'French': 20
        }
    }
    
    try:
        store_daily_statistics(test_date, test_stats)
        print(f"✓ Successfully stored statistics for {test_date}")
        
        # Verify the data was stored
        stats_ref = db.reference(f'usage_statistics/{test_date}')
        stored_data = stats_ref.get()
        
        if stored_data:
            print(f"✓ Data verification successful")
            print(f"  - Total Users: {stored_data.get('totalUsers')}")
            print(f"  - Premium Users: {stored_data.get('premiumUsers')}")
            print(f"  - Languages: {len(stored_data.get('languageDistribution', {}))}")
            print(f"  - Created At: {stored_data.get('createdAt')}")
        else:
            print("✗ Failed to retrieve stored data")
            
    except Exception as e:
        print(f"✗ Error storing statistics: {e}")

def test_historical_comparison():
    """Test historical data comparison"""
    print("\n=== Testing Historical Comparison ===")
    
    try:
        # Store some historical data first
        base_date = dt.date.today() - timedelta(days=7)
        historical_stats = {
            'totalUsers': 100,
            'activeUsersLast7Days': 30,
            'premiumUsers': 15,
            'freeUsers': 85,
            'newUsersToday': 3,
            'dailyLoginCount': 20,
            'languageDistribution': {
                'English': 70,
                'Spanish': 20,
                'French': 10
            }
        }
        
        store_daily_statistics(base_date.isoformat(), historical_stats)
        print(f"✓ Stored historical data for {base_date}")
        
        # Test retrieval
        retrieved_stats = get_previous_period_stats(dt.date.today())
        
        if retrieved_stats:
            print(f"✓ Successfully retrieved previous period stats")
            print(f"  - Date: {retrieved_stats.get('date')}")
            print(f"  - Total Users: {retrieved_stats.get('totalUsers')}")
            
            # Test percentage calculations with real data
            current_users = 120
            previous_users = retrieved_stats.get('totalUsers', 0)
            change = calculate_percentage_change(current_users, previous_users)
            print(f"  - User growth: {current_users} vs {previous_users} = {change}")
            
        else:
            print("✗ No previous period stats found")
            
    except Exception as e:
        print(f"✗ Error in historical comparison test: {e}")

def test_api_integration():
    """Test the full API integration"""
    print("\n=== Testing API Integration ===")
    
    try:
        from django.test import RequestFactory
        from django.contrib.auth.models import User
        from rest_framework.authtoken.models import Token
        from core.views.admin_views import admin_usage_stats
        
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
        
        # Create request with authentication
        request = factory.get('/usage/')
        request.user = admin_user
        request.auth = token
        
        # Call the API
        response = admin_usage_stats(request)
        
        if response.status_code == 200:
            data = response.data
            print("✓ API call successful")
            print(f"  - Total Users: {data.get('totalUsers', 'N/A')}")
            print(f"  - Trends available: {'trends' in data}")
            
            if 'trends' in data:
                trends = data['trends']
                print(f"  - Total Users Trend: {trends.get('totalUsers', 'N/A')}")
                print(f"  - Premium Users Trend: {trends.get('premiumUsers', 'N/A')}")
            
            if 'previousPeriodDate' in data:
                print(f"  - Previous Period: {data['previousPeriodDate']}")
            
        else:
            print(f"✗ API call failed with status {response.status_code}")
            print(f"  Error: {response.data}")
            
    except Exception as e:
        print(f"✗ Error in API integration test: {e}")
        import traceback
        traceback.print_exc()

def cleanup_test_data():
    """Clean up test data"""
    print("\n=== Cleaning Up Test Data ===")
    
    try:
        # Remove test statistics
        test_dates = [
            "2024-01-15",
            (dt.date.today() - timedelta(days=7)).isoformat()
        ]
        
        for test_date in test_dates:
            try:
                stats_ref = db.reference(f'usage_statistics/{test_date}')
                stats_ref.delete()
                print(f"✓ Cleaned up test data for {test_date}")
            except Exception as e:
                print(f"✗ Error cleaning up {test_date}: {e}")
                
        # Clean up test admin user
        try:
            from django.contrib.auth.models import User
            User.objects.filter(username='testadmin').delete()
            print("✓ Cleaned up test admin user")
        except Exception as e:
            print(f"✗ Error cleaning up test user: {e}")
            
    except Exception as e:
        print(f"✗ Error in cleanup: {e}")

if __name__ == '__main__':
    print("Historical Usage Statistics Test Suite")
    print("=" * 50)
    
    try:
        test_percentage_calculations()
        test_store_statistics()
        test_historical_comparison()
        test_api_integration()
        
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
            cleanup_test_data()
        else:
            print("Test data preserved for manual inspection.") 