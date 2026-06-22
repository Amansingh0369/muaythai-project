from django.apps import AppConfig
from django.db.models.signals import post_migrate

def create_default_admin(sender, **kwargs):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    email = 'admin@admin.com'
    password = 'adminmuaythai'
    
    # Create the seed admin if no admin users exist at all
    if not User.objects.filter(role='ADMIN').exists() and not User.objects.filter(email=email).exists():
        User.objects.create_superuser(
            email=email,
            password=password,
            full_name='System Admin',
            role='ADMIN',
            is_email_verified=True,
            is_active=True
        )
        print(f"\n*** Default Seed Admin Created ***")
        print(f"Email: {email} | Password: {password}")
        print(f"**********************************\n")

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        post_migrate.connect(create_default_admin, sender=self)
