from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import User
import re


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'full_name', 'matric_number', 'password', 'password2')
        extra_kwargs = {
            'matric_number': {'required': False, 'allow_blank': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        # Check if email already exists
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        # Validate matric_number if provided
        matric_number = attrs.get('matric_number')
        if matric_number:
            pattern = r'(^\d{2}/[a-z]{3}\d{2}/\d{3}$)|(^\d{12}[A-Z]{2}$)'
            if not re.match(pattern, matric_number):
                raise serializers.ValidationError({
                    "matric_number": "Must be in format 23/sci01/002 or JAMB Reg e.g. 202330217286FA"
                })

        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(email=email, password=password)

            if not user:
                raise serializers.ValidationError('Unable to log in with provided credentials.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')

            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include "email" and "password".')


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'matric_number', 'date_joined', 'is_email_verified')
        read_only_fields = ('id', 'email', 'date_joined', 'is_email_verified')

    def validate_matric_number(self, value):
        if value:
            pattern = r'(^\d{2}/[a-z]{3}\d{2}/\d{3}$)|(^\d{12}[A-Z]{2}$)'
            if not re.match(pattern, value):
                raise serializers.ValidationError(
                    "Matric/JAMB number must be in format 23/sci01/002 or JAMB Reg e.g. 202330217286FA"
                )
        return value

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "full_name")
