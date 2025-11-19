# Expose views from submodules for easier import

from .api_root import api_root
from .translation_endpoints import (
    translate_db_context,
    regenerate_translation,
    submit_translation_feedback,
    get_user_preferences,
    translate_simple,
    test_topic_classification,
)
from .template_views import TranslatorView
from .admin_views import (
    admin_login,
    admin_logout,
    admin_user_list_create,
    admin_user_detail_update_delete,
    admin_usage_stats,
    admin_api_usage_stats,
    admin_settings,
)

# ConnectChat-focused endpoints only
__all__ = [
    'api_root',
    'translate_db_context',
    'regenerate_translation',
    'submit_translation_feedback',
    'get_user_preferences',
    'translate_simple',
    'test_topic_classification',
    'TranslatorView',
    'admin_login',
    'admin_logout',
    'admin_user_list_create',
    'admin_user_detail_update_delete',
    'admin_usage_stats',
    'admin_api_usage_stats',
    'admin_settings',
] 