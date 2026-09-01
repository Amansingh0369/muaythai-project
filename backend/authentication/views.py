from django.conf import settings
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
from rest_framework import status, views, response, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.views import TokenRefreshView
from users.models import User
from users.serializers import UserSerializer
from .links import email_verification_link, password_reset_link
from .services import GoogleAuthService
from .emails import send_verification_email, send_password_reset_email
from .serializers import (
    GoogleLoginSerializer, RegisterSerializer, LoginSerializer,
    ResendVerificationSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, PasswordResetTokenValidateSerializer
)

class GoogleLoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        id_token = serializer.validated_data['id_token']
        
        # Verify Token and Get User
        idinfo = GoogleAuthService.verify_id_token(id_token)
        user, created = GoogleAuthService.get_or_create_user(idinfo)
        
        if not user.is_active:
            return response.Response({'error': 'User account is inactive'}, status=status.HTTP_403_FORBIDDEN)
            
        # Generate Tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        res = response.Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'access': access_token
        }, status=status.HTTP_200_OK)
        
        # Set HttpOnly Cookie
        res.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'],
            value=refresh_token,
            expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH']
        )
        
        return res

class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
        
        if not refresh_token:
            return response.Response({'error': 'Refresh token not found in cookies'}, status=status.HTTP_401_UNAUTHORIZED)
            
        # Manually set the refresh token from cookie into data
        # because TokenRefreshView expects it in request.data
        data = request.data.copy()
        data['refresh'] = refresh_token
        
        serializer = self.get_serializer(data=data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])
            
        res = response.Response(serializer.validated_data, status=status.HTTP_200_OK)
        
        # If rotation is enabled, we need to set the new refresh token in cookie
        if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False) and 'refresh' in serializer.validated_data:
            res.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=serializer.validated_data['refresh'],
                expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
                path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH']
            )
            
        return res

class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
        
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass # Already blacklisted or expired
                
        res = response.Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        res.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        
        return res

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        send_verification_email(
            user=user, verification_link=email_verification_link(user))

        return response.Response({
            'message': 'Registration successful. Please check your email to verify your account.'
        }, status=status.HTTP_201_CREATED)

class VerifyEmailView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        
        if not uidb64 or not token:
            return response.Response({'error': 'Missing uid or token'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return response.Response({'error': 'Invalid link'}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            user.is_email_verified = True
            user.is_active = True
            user.save()
            return response.Response({'message': 'Email successfully verified. You can now login.'}, status=status.HTTP_200_OK)
        else:
            return response.Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationEmailView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # We return success for security reasons to prevent email discovery
            return response.Response({
                'message': 'If an account exists with this email, a verification link has been sent.'
            }, status=status.HTTP_200_OK)
            
        if user.is_email_verified:
            return response.Response({
                'error': 'This email address is already verified.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        send_verification_email(
            user=user, verification_link=email_verification_link(user))

        return response.Response({
            'message': 'If an account exists with this email, a verification link has been sent.'
        }, status=status.HTTP_200_OK)

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        if not user.is_email_verified:
            return response.Response({'error': 'Please verify your email address before logging in.'}, status=status.HTTP_403_FORBIDDEN)
            
        if not user.is_active:
            return response.Response({'error': 'User account is inactive. Please contact support.'}, status=status.HTTP_403_FORBIDDEN)
            
        # Generate Tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        res = response.Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'access': access_token
        }, status=status.HTTP_200_OK)
        
        # Set HttpOnly Cookie
        res.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'],
            value=refresh_token,
            expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH']
        )
        
        return res

class PasswordResetRequestView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # We return a success message even if user doesn't exist for security
            return response.Response({'message': 'If an account exists with this email, a reset link has been sent.'}, status=status.HTTP_200_OK)
            
        expiry_minutes = max(1, settings.PASSWORD_RESET_TIMEOUT // 60)
        send_password_reset_email(
            user=user, reset_link=password_reset_link(user), expiry_minutes=expiry_minutes)

        return response.Response({'message': 'If an account exists with this email, a reset link has been sent.'}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uidb64 = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return response.Response({'error': 'Invalid link'}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            # Following a link sent to that address proves control of it. This
            # is also how an account created for someone at a friend's checkout
            # becomes usable: it starts unverified with no password, and login
            # refuses an unverified address, so verifying here is what turns the
            # invite into an account they can actually sign in to.
            user.is_email_verified = True
            user.save()
            return response.Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
        else:
            return response.Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetTokenValidateView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetTokenValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uidb64 = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return response.Response({'error': 'Invalid link'}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            return response.Response({'message': 'Token is valid.'}, status=status.HTTP_200_OK)
        else:
            return response.Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
