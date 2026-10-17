from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Project(models.Model):
    owner=models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="projects",
        null=True,
        blank=True
    )
    name=models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Tasks(models.Model):
    owner=models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True,
        blank=True
    )
    project= models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True,
        blank=True
        )

    title= models.CharField(max_length=200)
    description=models.TextField(blank=True)
    completed=models.BooleanField(default=False)
    created_at=models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title
