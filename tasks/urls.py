from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    TaskViewSet,
    ProjectViewSet,
    RegisterView,
    AnalyzeTaskFileView,
)

router=DefaultRouter()
router.register("tasks",TaskViewSet,basename="tasks")
router.register("projects",ProjectViewSet,basename="projects")

urlpatterns=[
    path("auth/register/",RegisterView.as_view(),name="register"),
    path(
    "tasks/analyze-file/",
    AnalyzeTaskFileView.as_view(),
    name="analyze-task-file",
),
]
urlpatterns += router.urls
