from django.db import models


class LoginInfo(models.Model):
    login_id = models.CharField(max_length=32, primary_key=True)
    name = models.CharField(max_length=64)
    password = models.CharField(max_length=255)
    address = models.CharField(max_length=64)
    role = models.IntegerField()
