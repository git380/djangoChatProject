from django.db import models


class LoginInfo(models.Model):
    username = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    role = models.IntegerField(default=0)
