from django.shortcuts import render, redirect
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
            print(f"Username: {login_info.username}, Password: {login_info.password}, Role: {login_info.role}")
        # nameとpwが一致した場合try 一致しなかった場合except
        try:
            login_info = LoginInfo.objects.get(username=username, password=password)
            request.session['username'] = username  # ユーザー名をセッションに保存
            request.session['role'] = login_info.role  # "role"をセッションに保存
            return render(request, 'loginok.html')
        except LoginInfo.DoesNotExist:
            return render(request, 'loginng.html')
    return render(request, 'login.html')


def chat(request):
    username = request.session.get('username')
    # ログインしていない場合はログインページにリダイレクト
    if not username:
        return redirect('login')

    return render(request, 'chat.html', {'name': username})


def contact(request):
    username = request.session.get('username')
    role = request.session.get('role')
    # ログインしていない場合はログインページにリダイレクト
    if not username:
        return redirect('login')

    if role == 1:
        return render(request, 'contact/teacher.html', {'name': username})
    elif role == 2:
        return render(request, 'contact/student.html', {'name': username})
