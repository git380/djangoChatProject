from django.http import HttpResponse
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


def info_list(request):
    # ログインしていない場合もしくは管理者でない場合
    if request.session.get('role') != 3:
        return redirect('login')

    login_info_list = LoginInfo.objects.all()
    return render(request, 'administrator/loginlist.html', {'login_info_list': login_info_list})


def info_update(request, login_id):
    # ログインしていない場合もしくは管理者でない場合
    if request.session.get('role') != 3:
        return redirect('login')

    login_info = LoginInfo.objects.get(login_id=login_id)

    if request.method == 'POST':
        # login_info_update.htmlで、チェックされた内容を変更
        if request.POST.get('name_checkbox'):
            login_info.name = request.POST['name']
        if request.POST.get('password_checkbox'):
            login_info.password = hashing(login_id, request.POST['password'])
        if request.POST.get('address_checkbox'):
            login_info.address = request.POST['address']
        if request.POST.get('role_checkbox'):
            login_info.role = request.POST['role']
        login_info.save()

        print(f"Received: {login_info}")
        return redirect('info_list')

    return render(request, 'administrator/login_info_update.html', {'login_info': login_info})


def login_info_add(request):
    # ログインしていない場合もしくは管理者でない場合
    if request.session.get('role') != 3:
        return redirect('login')

    if request.method == 'POST':
        login_id = request.POST['login_id']
        if LoginInfo.objects.filter(login_id=login_id).exists():
            return HttpResponse('既に登録されているIDです。')
        else:
            # DBへ追加
            login_info = LoginInfo(
                login_id=login_id,
                name=request.POST['name'],
                password=hashing(login_id, request.POST['password']),
                address=request.POST['address'],
                role=request.POST['role']
            )
            login_info.save()

            return redirect('info_list')

    return render(request, 'administrator/login_info_add.html')
