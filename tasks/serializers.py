from rest_framework import serializers
from .models import Tasks,Project
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

class ProjectTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model=Tasks
        fields=["id","title","completed","created_at"]

class ProjectSerializer(serializers.ModelSerializer):
    tasks=ProjectTaskSerializer(many=True,read_only=True)
    class Meta:
        model=Project
        fields=["id","name","tasks"]


class TaskSerializer(serializers.ModelSerializer):
    project =ProjectSerializer(read_only=True)
    
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        source="project",
        write_only=True,
        required=False,
        allow_null=True,
    )


    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        request=self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["project_id"].queryset=Project.objects.filter(
                owner=request.user
            )
    def validate_title(self,value):
        if len(value)<3:
            raise serializers.ValidationError("Title must contain atleast 3 character")
        return value
    
    def validate(self, data):
        completed = data.get(
            "completed",
            self.instance.completed if self.instance else False
        )

        description = data.get(
            "description",
            self.instance.description if self.instance else ""
        )

        if completed and not description:
            raise serializers.ValidationError({
                "description": "A completed task must have a description."
            })

        return data

    
    class Meta:
        model=Tasks
        fields="__all__"
        read_only_fields=["owner"]


class RegisterSerializer(serializers.ModelSerializer):
    password=serializers.CharField(write_only=True)
    class Meta:
        model=User
        fields=["username","email","password"]

    def validate_email(self,value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "this email is already registered"
            )
        return value
    def validate_password(self,value):
        try:
            validate_password(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.messages)
        return value

    def create(self,validate_data):
        user=User.objects.create_user(
            username=validate_data["username"],
            email=validate_data["email"],
            password=validate_data["password"]
        )
        return user