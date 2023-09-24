from django.shortcuts import render, redirect
from webSocket.models import LoginInfo
from hashing import hashing


def index(request):
    request.session.flush()
    return render(request, 'index.html')


def login(request):
    if request.method == 'POST':
        # login.htmlからPOSTされた内容を取得
        login_id = request.POST['login_id']
        password = request.POST['password']
        print(f"Received username: {login_id}, password: {password}")
        # ハッシュ化
        password = hashing(login_id, password)
        # nameとpwが一致した場合try 一致しなかった場合except
        try:
            login_info = LoginInfo.objects.get(login_id=login_id, password=password)
            request.session['login_id'] = login_id  # ユーザー名をセッションに保存
            request.session['username'] = login_info.name  # "name"をセッションnameに俩存
            request.session['role'] = login_info.role  # "role"をセッションに保存
            if login_info.role == 3:
                return render(request, 'administrator/loginok.html')
            return render(request, 'login/loginok.html')
        except LoginInfo.DoesNotExist:
            return render(request, 'login/loginng.html')
    return render(request, 'login/login.html')


def chat(request):
    username = request.session.get('username')
    # ログインしていない場合はログインページにリダイレクト
    if not username:
        return redirect('login')

    return render(request, 'chat/chat.html', {'name': username})


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
    else:
        return redirect('login')


def logout(request):
    request.session.flush()
    return render(request, 'login/logout.html')
