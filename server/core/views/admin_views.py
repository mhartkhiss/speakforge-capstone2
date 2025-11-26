from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from firebase_admin import db, auth
import datetime
from django.contrib.auth import authenticate, get_user_model
from rest_framework.authtoken.models import Token
from rest_framework import status
from ..models import APIUsageStats
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDate

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """
    Admin login endpoint using Firebase ID Token.
    Verifies Firebase ID Token, ensures user is an admin in RTDB,
    and issues a Django Rest Framework Token for backend API access.
    """
    firebase_token = request.data.get('token') # Expecting Firebase ID Token now

    if not firebase_token:
        return Response({'error': 'Firebase token is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 1. Verify Firebase ID Token with clock skew tolerance
        decoded_token = auth.verify_id_token(firebase_token, clock_skew_seconds=10)
        uid = decoded_token['uid']
        email = decoded_token.get('email')

        # 2. Check if user is an admin in Realtime Database
        # Note: We double-check here for security, even though frontend checked it.
        user_ref = db.reference(f'users/{uid}')
        user_snapshot = user_ref.get()

        if not user_snapshot or not user_snapshot.get('isAdmin') == True:
             return Response({'error': 'User is not authorized for admin access'}, status=status.HTTP_403_FORBIDDEN)

        # 3. Get or Create Django User to issue DRF Token
        # We map Firebase UID to Django username or use email
        # Strategy: Use email as username for Django user
        if not email:
             return Response({'error': 'Email is required in Firebase token'}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(username=email, defaults={'email': email, 'is_staff': True, 'is_superuser': True})
        
        # Ensure the user is marked as staff so IsAdminUser permission works
        if not user.is_staff:
            user.is_staff = True
            user.save()

        # 4. Issue DRF Token
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})

    except Exception as e:
        print(f"Admin Login Error: {e}")
        return Response({'error': 'Invalid Authentication Token'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAdminUser]) # Re-enabled permission check
def admin_logout(request):
    """
    Admin logout endpoint.
    Needs logic to invalidate token/session.
    """
    # For TokenAuthentication, logout is typically handled client-side by deleting the token.
    # If you need server-side token invalidation, you can delete the token:
    try:
        # request.auth is the token object provided by TokenAuthentication
        if request.auth:
            request.auth.delete()
            return Response({'message': 'Logged out successfully by deleting token.'})
        else:
             # This might happen if the request didn't include a valid token
             return Response({'message': 'Logout successful (no token found to delete).'}) 
    except Exception as e:
        print(f"Error during logout: {e}")
        return Response({'error': 'An error occurred during logout.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser]) # Restore IsAdminUser permission check
def admin_user_list_create(request):
    """
    GET: List all users.
    POST: Create a new user.
    Needs implementation using Firebase Admin SDK.
    """
    if request.method == 'GET':
        try:
            users_ref = db.reference('users')
            snapshot = users_ref.get() # Use get() instead of once('value') in Python SDK
            # Firebase returns None if the path doesn't exist or has no data
            if snapshot is None:
                return Response({}) # Return empty dict if no users
            return Response(snapshot)
        except Exception as e:
            print(f"Error fetching users from Firebase: {e}")
            return Response({'error': f'Failed to fetch users: {str(e)}'}, status=500)

    elif request.method == 'POST':
        try:
            email = request.data.get('email')
            password = request.data.get('password')

            if not email or not password:
                return Response({'error': 'Email and password are required'}, status=400)

            # Create the user in Firebase Authentication
            user_record = auth.create_user(
                email=email,
                password=password,
                email_verified=False
            )

            # Create the user in Realtime Database
            user_ref = db.reference(f'users/{user_record.uid}')
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            user_data = {
                'userId': user_record.uid,
                'email': email,
                'accountType': 'free',
                'username': email.split('@')[0],
                'status': 'offline',
                'translator': 'gemini', # Default translator
                'createdAt': now
                # Note: language and lastLoginDate are not set for admin-created users
                # They will be set when the user first logs in through the mobile app
            }
            user_ref.set(user_data)

            return Response({'message': 'User created successfully', 'userId': user_record.uid}, status=201)
        
        except auth.EmailAlreadyExistsError:
             return Response({'error': 'Email already exists'}, status=400)
        except Exception as e:
            print(f"Error creating user: {e}")
            # Attempt to clean up if user was created in Auth but failed before RTDB
            if 'user_record' in locals() and user_record:
                try:
                    auth.delete_user(user_record.uid)
                    print(f"Cleaned up partially created user: {user_record.uid}")
                except Exception as cleanup_error:
                    print(f"Failed to cleanup partially created user {user_record.uid}: {cleanup_error}")
            return Response({'error': f'Failed to create user: {str(e)}'}, status=500)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser]) # Re-enabled permission check
def admin_user_detail_update_delete(request, user_id):
    """
    GET: Retrieve user details.
    PUT: Update user details.
    DELETE: Delete user.
    Needs implementation using Firebase Admin SDK.
    """
    user_ref = db.reference(f'users/{user_id}')

    if request.method == 'GET':
        try:
            snapshot = user_ref.get()
            if snapshot is None:
                return Response({'error': 'User not found'}, status=404)
            return Response(snapshot)
        except Exception as e:
            print(f"Error fetching user {user_id}: {e}")
            return Response({'error': f'Failed to fetch user: {str(e)}'}, status=500)

    elif request.method == 'PUT':
        try:
            # Check if user exists in RTDB before attempting update
            if user_ref.get() is None:
                 return Response({'error': 'User not found in Realtime Database'}, status=404)

            user_data = request.data
            # Ensure userId is not part of the update payload
            if 'userId' in user_data:
                del user_data['userId'] 
            if 'email' in user_data:
                 # Updating email in RTDB might be okay, but Auth email is separate
                 # Consider if you need to update Auth email as well (requires re-auth typically)
                 # For now, we only update RTDB as per Node.js logic.
                 pass 
            
            # Prevent overwriting critical fields if not provided
            # Ensure essential keys like createdAt are not accidentally removed if not in request.data
            # It might be safer to fetch existing data and merge updates
            # However, mirroring Node.js simple update for now:
            user_ref.update(user_data)
            
            return Response({'message': 'User updated successfully'})
        except Exception as e:
            print(f"Error updating user {user_id}: {e}")
            return Response({'error': f'Failed to update user: {str(e)}'}, status=500)

    elif request.method == 'DELETE':
        try:
            # Check if user exists in RTDB before attempting delete
            if user_ref.get() is None:
                print(f"User {user_id} not found in Realtime Database, attempting Auth delete only.")
                # Proceed to delete from Auth even if not in RTDB
            else:
                # Delete user from Realtime Database first
                 user_ref.delete()
                 print(f"Deleted user {user_id} from Realtime Database.")

            # Delete user from Authentication
            try:
                auth.delete_user(user_id)
                print(f"Deleted user {user_id} from Firebase Authentication.")
            except auth.UserNotFoundError:
                 print(f"User {user_id} not found in Firebase Authentication (already deleted or never existed?).")
                 # If user wasn't in RTDB either, return 404. Otherwise, it's a partial success.
                 if user_ref.get() is None: # Check RTDB again in case of race condition? No, just use initial check. Assume RTDB delete worked if attempted.
                     return Response({'error': 'User not found in RTDB or Auth'}, status=404)
                 else: # User was deleted from RTDB but not found in Auth
                    return Response({'message': 'User deleted from Realtime Database, but not found in Authentication.'}) 

            return Response({'message': 'User deleted successfully'})
        except Exception as e:
            print(f"Error deleting user {user_id}: {e}")
            # Consider potential partial deletion scenarios
            return Response({'error': f'Failed to delete user: {str(e)}'}, status=500)

def calculate_percentage_change(current_value, previous_value):
    """
    Calculate percentage change between current and previous values.
    Returns formatted percentage string with + or - sign.
    """
    if previous_value == 0:
        if current_value > 0:
            return "+100%"  # New metric appeared
        else:
            return "0%"     # Both are zero
    
    change = ((current_value - previous_value) / previous_value) * 100
    sign = "+" if change >= 0 else ""
    return f"{sign}{change:.1f}%"

def store_daily_statistics(date_str, stats_data):
    """
    Store daily statistics in Firebase for historical tracking.
    """
    try:
        stats_ref = db.reference(f'usage_statistics/{date_str}')
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # Check if record already exists
        existing_data = stats_ref.get()
        
        stats_record = {
            'date': date_str,
            'totalUsers': stats_data['totalUsers'],
            'activeUsersLast7Days': stats_data['activeUsersLast7Days'],
            'premiumUsers': stats_data['premiumUsers'],
            'freeUsers': stats_data['freeUsers'],
            'newUsersToday': stats_data.get('newUsersToday', 0),
            'dailyLoginCount': stats_data.get('dailyLoginCount', 0),
            'languageDistribution': stats_data['languageDistribution'],
            'calculatedAt': now_iso
        }
        
        # Set createdAt only if this is a new record
        if existing_data is None:
            stats_record['createdAt'] = now_iso
        else:
            stats_record['createdAt'] = existing_data.get('createdAt', now_iso)
        
        stats_ref.set(stats_record)
        print(f"Stored daily statistics for {date_str}")
        
    except Exception as e:
        print(f"Error storing daily statistics for {date_str}: {e}")

def get_previous_period_stats(current_date):
    """
    Get statistics from the previous period (7 days ago) for comparison.
    """
    try:
        previous_date = current_date - datetime.timedelta(days=7)
        previous_date_str = previous_date.isoformat()
        
        stats_ref = db.reference(f'usage_statistics/{previous_date_str}')
        previous_stats = stats_ref.get()
        
        if previous_stats:
            return previous_stats
        else:
            # If no data from exactly 7 days ago, try to find the most recent data before current date
            stats_ref = db.reference('usage_statistics')
            all_stats = stats_ref.get()
            
            if all_stats:
                # Find the most recent date before current date
                available_dates = [datetime.date.fromisoformat(date_str) for date_str in all_stats.keys() 
                                 if datetime.date.fromisoformat(date_str) < current_date]
                
                if available_dates:
                    most_recent_date = max(available_dates)
                    most_recent_date_str = most_recent_date.isoformat()
                    return all_stats[most_recent_date_str]
            
            return None
            
    except Exception as e:
        print(f"Error fetching previous period stats: {e}")
        return None

@api_view(['GET'])
@permission_classes([IsAdminUser]) # Re-enabled permission check
def admin_usage_stats(request):
    """
    Get usage statistics with real percentage changes vs previous period.
    Stores daily statistics for historical tracking.
    Supports different time periods via 'period' query parameter.
    """
    try:
        users_ref = db.reference('users')
        users_snapshot = users_ref.get()
        users = users_snapshot if users_snapshot else {}

        today = datetime.date.today()
        today_str = today.isoformat()
        
        # Get the period parameter from query string (default: 7 days)
        period = request.GET.get('period', '7d')
        
        # Calculate the number of days based on period
        if period == '7d':
            days_count = 7
        elif period == '1m':
            days_count = 30
        elif period == '3m':
            days_count = 90
        elif period == '6m':
            days_count = 180
        elif period == '1y':
            days_count = 365
        else:
            days_count = 7  # Default fallback
        
        daily_login_usage = []

        # Calculate logins for the specified period
        for i in range(days_count - 1, -1, -1):
            target_date = today - datetime.timedelta(days=i)
            date_str = target_date.isoformat() # YYYY-MM-DD format
            
            users_logged_in_on_date = []
            count = 0
            for user_id, user_data in users.items():
                last_login_iso = user_data.get('lastLoginDate')
                if last_login_iso:
                    try:
                        # Handle both ISO format (2024-07-28T10:00:00Z) and mobile app format (2024-07-28 10:00:00)
                        if 'T' in last_login_iso:
                            # ISO format - extract date part before 'T'
                            last_login_date_str = last_login_iso.split('T')[0]
                        else:
                            # Mobile app format - extract date part before space
                            last_login_date_str = last_login_iso.split(' ')[0]
                        
                        if last_login_date_str == date_str:
                            count += 1
                            users_logged_in_on_date.append({
                                'userId': user_id, # Include userId for potential UI use
                                'email': user_data.get('email'),
                                'accountType': user_data.get('accountType'),
                                'loginTime': last_login_iso,
                                'profileImageUrl': user_data.get('profileImageUrl'),
                                'username': user_data.get('username')
                            })
                    except Exception as date_parse_error:
                        # Log if a date string is invalid, but continue
                        print(f"Could not parse lastLoginDate '{last_login_iso}' for user {user_id}: {date_parse_error}")
                        continue 

            daily_login_usage.append({
                'date': date_str,
                'count': count,
                'users': users_logged_in_on_date
            })

        # Calculate current statistics
        total_users = len(users)
        active_users_last_7_days = set()
        
        # Count unique users who logged in during the last 7 days
        for day_data in daily_login_usage:
            for user in day_data['users']:
                active_users_last_7_days.add(user['userId'])
        
        # Calculate premium vs free users
        premium_users = sum(1 for user_data in users.values() if user_data.get('accountType') == 'premium')
        free_users = total_users - premium_users
        
        # Calculate users by language (excluding users with no language)
        language_distribution = {}
        users_without_language = 0
        for user_data in users.values():
            language = user_data.get('language')
            if language and language not in ['null', 'undefined', '']:
                language_distribution[language] = language_distribution.get(language, 0) + 1
            else:
                users_without_language += 1
        
        # Add count for users without language set (typically admin-created users who haven't logged in yet)
        if users_without_language > 0:
            language_distribution['Not Set'] = users_without_language

        # Calculate new users today
        new_users_today = 0
        daily_login_count = 0
        
        for user_data in users.values():
            # Count new users created today
            created_at = user_data.get('createdAt')
            if created_at:
                try:
                    if 'T' in created_at:
                        created_date_str = created_at.split('T')[0]
                    else:
                        created_date_str = created_at.split(' ')[0]
                    
                    if created_date_str == today_str:
                        new_users_today += 1
                except Exception:
                    pass
            
            # Count users who logged in today
            last_login = user_data.get('lastLoginDate')
            if last_login:
                try:
                    if 'T' in last_login:
                        login_date_str = last_login.split('T')[0]
                    else:
                        login_date_str = last_login.split(' ')[0]
                    
                    if login_date_str == today_str:
                        daily_login_count += 1
                except Exception:
                    pass

        # Prepare current statistics
        current_stats = {
            'totalUsers': total_users,
            'activeUsersLast7Days': len(active_users_last_7_days),
            'premiumUsers': premium_users,
            'freeUsers': free_users,
            'newUsersToday': new_users_today,
            'dailyLoginCount': daily_login_count,
            'languageDistribution': language_distribution
        }

        # Store today's statistics for historical tracking
        store_daily_statistics(today_str, current_stats)

        # Get previous period statistics for comparison
        previous_stats = get_previous_period_stats(today)
        
        # Calculate percentage changes
        trends = {}
        if previous_stats:
            trends = {
                'totalUsers': calculate_percentage_change(
                    current_stats['totalUsers'], 
                    previous_stats.get('totalUsers', 0)
                ),
                'activeUsersLast7Days': calculate_percentage_change(
                    current_stats['activeUsersLast7Days'], 
                    previous_stats.get('activeUsersLast7Days', 0)
                ),
                'premiumUsers': calculate_percentage_change(
                    current_stats['premiumUsers'], 
                    previous_stats.get('premiumUsers', 0)
                ),
                'freeUsers': calculate_percentage_change(
                    current_stats['freeUsers'], 
                    previous_stats.get('freeUsers', 0)
                )
            }
        else:
            # No previous data available, show as new metrics
            trends = {
                'totalUsers': '+100%',
                'activeUsersLast7Days': '+100%',
                'premiumUsers': '+100%',
                'freeUsers': '+100%'
            }

        return Response({
            'dailyLoginUsage': daily_login_usage,
            'totalUsers': current_stats['totalUsers'],
            'activeUsersLast7Days': current_stats['activeUsersLast7Days'],
            'premiumUsers': current_stats['premiumUsers'],
            'freeUsers': current_stats['freeUsers'],
            'languageDistribution': current_stats['languageDistribution'],
            'trends': trends,
            'previousPeriodDate': previous_stats.get('date') if previous_stats else None,
            'calculatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'period': period,
            'daysCount': days_count
        })

    except Exception as e:
        print(f'Error fetching usage statistics: {e}')
        return Response({'error': 'Failed to fetch usage statistics'}, status=500)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_api_usage_stats(request):
    """
    Get API usage statistics with cost calculations for Claude and Gemini models.
    Supports different time periods via 'period' query parameter.
    Includes per-user API usage breakdown.
    """
    try:
        # Get the period parameter from query string (default: 7 days)
        period = request.GET.get('period', '7d')

        # Calculate the number of days based on period
        if period == '7d':
            days_count = 7
        elif period == '1m':
            days_count = 30
        elif period == '3m':
            days_count = 90
        elif period == '6m':
            days_count = 180
        elif period == '1y':
            days_count = 365
        else:
            days_count = 7  # Default fallback

        # Calculate date range
        end_date = datetime.datetime.now(datetime.timezone.utc)
        start_date = end_date - datetime.timedelta(days=days_count)

        # Get API usage data
        api_usage = APIUsageStats.objects.filter(
            request_timestamp__gte=start_date,
            request_timestamp__lte=end_date
        )

        # Aggregate by model
        model_stats = api_usage.values('model_name').annotate(
            total_requests=Count('id'),
            total_input_tokens=Sum('input_tokens'),
            total_output_tokens=Sum('output_tokens'),
            total_tokens=Sum('total_tokens'),
            total_input_cost=Sum('input_cost'),
            total_output_cost=Sum('output_cost'),
            total_cost=Sum('total_cost')
        ).order_by('model_name')

        # Aggregate by date for chart data
        daily_usage = api_usage.annotate(
            date=TruncDate('request_timestamp')
        ).values('date', 'model_name').annotate(
            requests=Count('id'),
            input_tokens=Sum('input_tokens'),
            output_tokens=Sum('output_tokens'),
            total_tokens=Sum('total_tokens'),
            input_cost=Sum('input_cost'),
            output_cost=Sum('output_cost'),
            total_cost=Sum('total_cost')
        ).order_by('date', 'model_name')

        # Group daily data by date
        daily_stats = {}
        for entry in daily_usage:
            date_str = entry['date'].isoformat()
            model = entry['model_name']

            if date_str not in daily_stats:
                daily_stats[date_str] = {
                    'date': date_str,
                    'models': {},
                    'total_requests': 0,
                    'total_tokens': 0,
                    'total_cost': 0
                }

            daily_stats[date_str]['models'][model] = {
                'requests': entry['requests'] or 0,
                'input_tokens': entry['input_tokens'] or 0,
                'output_tokens': entry['output_tokens'] or 0,
                'total_tokens': entry['total_tokens'] or 0,
                'input_cost': float(entry['input_cost'] or 0),
                'output_cost': float(entry['output_cost'] or 0),
                'total_cost': float(entry['total_cost'] or 0)
            }

            daily_stats[date_str]['total_requests'] += entry['requests'] or 0
            daily_stats[date_str]['total_tokens'] += entry['total_tokens'] or 0
            daily_stats[date_str]['total_cost'] += float(entry['total_cost'] or 0)

        # Convert to list and sort by date
        daily_stats_list = sorted(daily_stats.values(), key=lambda x: x['date'])

        # Overall totals
        overall_stats = api_usage.aggregate(
            total_requests=Count('id'),
            total_input_tokens=Sum('input_tokens'),
            total_output_tokens=Sum('output_tokens'),
            total_tokens=Sum('total_tokens'),
            total_input_cost=Sum('input_cost'),
            total_output_cost=Sum('output_cost'),
            total_cost=Sum('total_cost')
        )

        # Calculate averages per request
        total_requests = overall_stats['total_requests'] or 0
        avg_tokens_per_request = (overall_stats['total_tokens'] or 0) / total_requests if total_requests > 0 else 0
        avg_cost_per_request = float(overall_stats['total_cost'] or 0) / total_requests if total_requests > 0 else 0

        # Format model stats for response
        formatted_model_stats = []
        for stat in model_stats:
            formatted_model_stats.append({
                'model': stat['model_name'],
                'requests': stat['total_requests'] or 0,
                'input_tokens': stat['total_input_tokens'] or 0,
                'output_tokens': stat['total_output_tokens'] or 0,
                'total_tokens': stat['total_tokens'] or 0,
                'input_cost': float(stat['total_input_cost'] or 0),
                'output_cost': float(stat['total_output_cost'] or 0),
                'total_cost': float(stat['total_cost'] or 0)
            })

        # Aggregate by user
        user_stats = api_usage.filter(
            user_id__isnull=False
        ).exclude(
            user_id=''
        ).values('user_id').annotate(
            total_requests=Count('id'),
            total_input_tokens=Sum('input_tokens'),
            total_output_tokens=Sum('output_tokens'),
            total_tokens=Sum('total_tokens'),
            total_cost=Sum('total_cost')
        ).order_by('-total_cost')

        # Get user details from Firebase for each user
        users_ref = db.reference('users')
        users_snapshot = users_ref.get()
        users_data = users_snapshot if users_snapshot else {}

        # Aggregate by user and date for daily consumption
        user_daily_usage = api_usage.filter(
            user_id__isnull=False
        ).exclude(
            user_id=''
        ).annotate(
            date=TruncDate('request_timestamp')
        ).values('user_id', 'date').annotate(
            requests=Count('id'),
            input_tokens=Sum('input_tokens'),
            output_tokens=Sum('output_tokens'),
            total_tokens=Sum('total_tokens'),
            total_cost=Sum('total_cost')
        ).order_by('user_id', 'date')

        # Group daily data by user
        user_daily_stats = {}
        for entry in user_daily_usage:
            user_id = entry['user_id']
            date_str = entry['date'].isoformat()

            if user_id not in user_daily_stats:
                user_daily_stats[user_id] = []

            user_daily_stats[user_id].append({
                'date': date_str,
                'requests': entry['requests'] or 0,
                'input_tokens': entry['input_tokens'] or 0,
                'output_tokens': entry['output_tokens'] or 0,
                'total_tokens': entry['total_tokens'] or 0,
                'total_cost': float(entry['total_cost'] or 0)
            })

        # Format user stats with user details and daily consumption
        formatted_user_stats = []
        for stat in user_stats:
            user_id = stat['user_id']
            user_info = users_data.get(user_id, {})
            
            formatted_user_stats.append({
                'user_id': user_id,
                'email': user_info.get('email', 'Unknown'),
                'username': user_info.get('username', 'Unknown'),
                'account_type': user_info.get('accountType', 'free'),
                'requests': stat['total_requests'] or 0,
                'input_tokens': stat['total_input_tokens'] or 0,
                'output_tokens': stat['total_output_tokens'] or 0,
                'total_tokens': stat['total_tokens'] or 0,
                'total_cost': float(stat['total_cost'] or 0),
                'avg_cost_per_request': float(stat['total_cost'] or 0) / (stat['total_requests'] or 1),
                'daily_usage': user_daily_stats.get(user_id, [])
            })

        return Response({
            'period': period,
            'days_count': days_count,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'overall_stats': {
                'total_requests': total_requests,
                'total_tokens': overall_stats['total_tokens'] or 0,
                'total_cost': float(overall_stats['total_cost'] or 0),
                'avg_tokens_per_request': round(avg_tokens_per_request, 2),
                'avg_cost_per_request': round(avg_cost_per_request, 6)
            },
            'model_breakdown': formatted_model_stats,
            'daily_stats': daily_stats_list,
            'user_stats': formatted_user_stats,
            'pricing_info': {
                'claude_3_5_sonnet': {
                    'input_price_per_million': 3.00,
                    'output_price_per_million': 15.00
                },
                'gemini_2_5_flash': {
                    'input_price_per_million': 0.10,
                    'output_price_per_million': 0.40
                }
            }
        })

    except Exception as e:
        print(f'Error fetching API usage statistics: {e}')
        return Response({'error': 'Failed to fetch API usage statistics'}, status=500)

@api_view(['GET', 'PUT'])
@permission_classes([IsAdminUser])
def admin_settings(request):
    """
    GET: Retrieve application settings from Firebase.
    PUT: Update application settings in Firebase.
    """
    settings_ref = db.reference('settings')

    if request.method == 'GET':
        try:
            snapshot = settings_ref.get()
            if snapshot is None:
                # Return default settings if none exist
                return Response({
                    'backendUrl': 'https://06jwj9s0-8000.asse.devtunnels.ms/api/',
                    'apkDownloadUrl': 'https://drive.google.com/file/d/1DH0Zmn5EIG5GUmrsdrhY-8ub2JQlIVSY/view?usp=drive_link'
                })
            return Response(snapshot)
        except Exception as e:
            print(f"Error fetching settings from Firebase: {e}")
            return Response({'error': f'Failed to fetch settings: {str(e)}'}, status=500)

    elif request.method == 'PUT':
        try:
            backend_url = request.data.get('backendUrl')
            apk_download_url = request.data.get('apkDownloadUrl')

            if not backend_url or not apk_download_url:
                return Response({'error': 'Both backendUrl and apkDownloadUrl are required'}, status=400)

            # Update settings in Firebase
            settings_data = {
                'backendUrl': backend_url,
                'apkDownloadUrl': apk_download_url,
                'updatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'updatedBy': 'admin'  # You might want to get the actual admin user
            }

            settings_ref.set(settings_data)

            return Response({
                'message': 'Settings updated successfully',
                'settings': settings_data
            })

        except Exception as e:
            print(f"Error updating settings: {e}")
            return Response({'error': f'Failed to update settings: {str(e)}'}, status=500) 