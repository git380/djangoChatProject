import os
import django

# Django設定をロード
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoChatProject.settings')
django.setup()

# 管理者作成
from webSocket.models import LoginInfo

LoginInfo.objects.create(
    login_id='admin',
    name='admin',
    password='c9013d7c8ac44ac9d46a5fc77bcc0972843318ea199cc677fcfe993c7b3519c2',
    address='admin',
    role=3
)
