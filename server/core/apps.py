from django.apps import AppConfig
from .firebase_init import initialize_firebase


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        try:
            initialize_firebase()
        except Exception as e:
            # Log error but don't crash during build (e.g. collectstatic)
            import sys
            if 'collectstatic' not in sys.argv:
                raise e
            print(f"Skipping Firebase initialization during build: {e}")
