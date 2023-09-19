from django.shortcuts import render
from webSocket.models import LoginInfo


def index(request):
    return render(request, 'webSocket/index.html')


def login(request):
    if request.method == 'POST':
        # login.htmlからPOSTされた内容を取得
        username = request.POST['username']
        password = request.POST['password']
        print(f"Received username: {username}, password: {password}")
        # データベースの内容をすべて出力
        login_info_list = LoginInfo.objects.all()
        for login_info in login_info_list:
            print(f"Username: {login_info.username}, Password: {login_info.password}")
        # nameとpwが一致した場合try 一致しなかった場合except
        try:
            login_info = LoginInfo.objects.get(username=username, password=password)
            return render(request, 'loginok.html')
        except LoginInfo.DoesNotExist:
            return render(request, 'loginng.html')
    return render(request, 'login.html')
