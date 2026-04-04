"""
Property-based tests for User model using Hypothesis.
"""
import pytest
from hypothesis import given, strategies as st, settings
from django.db import IntegrityError, transaction
from users.models import User


# Feature: django-oauth-jwt-auth, Property 16: Email Uniqueness Constraint
@given(email=st.emails())
@settings(max_examples=100)
@pytest.mark.django_db(transaction=True)
def test_email_uniqueness_constraint(email):
    """
    For any two User records in the database, their email addresses should be distinct.
    
    This test validates that the email uniqueness constraint is enforced at the database level.
    Attempting to create two users with the same email should raise an IntegrityError.
    
    **Validates: Requirements 5.1**
    """
    # Create first user with the generated email
    user1 = User.objects.create_user(email=email)
    # Django normalizes email addresses (lowercases the domain part)
    assert user1.email.lower() == email.lower()
    
    # Attempting to create a second user with the same email should fail
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            User.objects.create_user(email=email)
    
    # Verify only one user exists with this email (case-insensitive check)
    assert User.objects.filter(email__iexact=email).count() == 1
