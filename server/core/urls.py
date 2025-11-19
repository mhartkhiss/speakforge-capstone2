from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.api_root, name='api_root'),
    
    # ConnectChat endpoints (used by mobile app)
    path('translate-db-context/', views.translate_db_context, name='translate_db_context'),
    path('regenerate-translation/', views.regenerate_translation, name='regenerate_translation'),
    path('translation-feedback/', views.submit_translation_feedback, name='submit_translation_feedback'),
    path('user-preferences/', views.get_user_preferences, name='get_user_preferences'),
    
    # Simple translation endpoint (for basic and conversational translation)
    path('translate-simple/', views.translate_simple, name='translate_simple'),
    
    # Development/Testing endpoints
    path('test-topic-classification/', views.test_topic_classification, name='test_topic_classification'),
    path('translator/', views.TranslatorView.as_view(), name='translator-interface'),

    # Admin API Endpoints
    path('admin/login/', views.admin_login, name='admin_login'),
    path('admin/logout/', views.admin_logout, name='admin_logout'),
    path('admin/users/', views.admin_user_list_create, name='admin_user_list_create'),
    path('admin/users/<str:user_id>/', views.admin_user_detail_update_delete, name='admin_user_detail_update_delete'),
    path('admin/usage/', views.admin_usage_stats, name='admin_usage_stats'),
    path('admin/api-usage/', views.admin_api_usage_stats, name='admin_api_usage_stats'),
    path('admin/settings/', views.admin_settings, name='admin_settings'),
] 