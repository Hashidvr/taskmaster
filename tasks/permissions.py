from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    message="You must be the owner of this task."

    def has_object_permission(self,request,view,obj):
        return obj.owner==request.user