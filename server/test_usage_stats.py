#!/usr/bin/env python3
"""
Test script for admin usage statistics endpoint
Run this script to test if the usage statistics are working properly
"""

import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'speakforge_api.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from core.views.admin_views import admin_usage_stats

def test_usage_stats():
    """Test the usage statistics endpoint"""
    print("Testing admin usage statistics endpoint...")
    
    # Create a test admin user
    try:
        admin_user = User.objects.get(username='testadmin')
    except User.DoesNotExist:
        admin_user = User.objects.create_user(
            username='testadmin',
            email='admin@test.com',
            password='testpass123',
            is_staff=True,
            is_superuser=True
        )
        print(f"Created test admin user: {admin_user.username}")
    
    # Create or get token for the admin user
    token, created = Token.objects.get_or_create(user=admin_user)
    if created:
        print(f"Created new token for admin user: {token.key}")
    else:
        print(f"Using existing token for admin user: {token.key}")
    
    # Create a mock request
    factory = RequestFactory()
    request = factory.get('/api/admin/usage/')
    request.user = admin_user
    request.auth = token
    
    try:
        # Call the usage stats view
        response = admin_usage_stats(request)
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.data}")
        
        if response.status_code == 200:
            data = response.data
            print("\n=== Usage Statistics Summary ===")
            print(f"Total Users: {data.get('totalUsers', 'N/A')}")
            print(f"Active Users (Last 7 Days): {data.get('activeUsersLast7Days', 'N/A')}")
            print(f"Premium Users: {data.get('premiumUsers', 'N/A')}")
            print(f"Free Users: {data.get('freeUsers', 'N/A')}")
            print(f"Daily Login Usage Days: {len(data.get('dailyLoginUsage', []))}")
            print(f"Language Distribution: {data.get('languageDistribution', {})}")
            print("\n=== Test PASSED ===")
        else:
            print(f"\n=== Test FAILED ===")
            print(f"Error: {response.data}")
            
    except Exception as e:
        print(f"\n=== Test FAILED ===")
        print(f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_usage_stats() 