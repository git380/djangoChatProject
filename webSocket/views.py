from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render, redirect
from webSocket.models import LoginInfo
from hashing import hashing
import json
import requests


def index(request):
    request.session.flush()
    return render(request, 'index.html')


def login(request):
    if request.method == 'POST':
        # login.htmlからPOSTされた内容を取得
        login_id = request.POST['login_id']
        password = request.POST['password']
        # nameとpwが一致した場合try 一致しなかった場合except
        try:
            login_info = LoginInfo.objects.get(login_id=login_id, password=hashing(login_id, password))
            request.session['login_id'] = login_id  # ユーザidをセッションに保存
            request.session['username'] = login_info.name  # 名前をセッションusernameに保存
            request.session['role'] = login_info.role  # ロールをセッションに保存
            return redirect('login_ok')
        except LoginInfo.DoesNotExist:
            return render(request, 'login/loginNG.html')
    return render(request, 'login/login.html')


def login_ok(request):
    login_id = request.session.get('login_id')  # セッションからlogin_idを取得
    # ログインしていない場合はログインページにリダイレクト
    if not login_id:
        return redirect('login')

    # セッションのroleと比較
    if request.session.get('role') == 3:
        print(f'管理者 ログイン:{login_id}')
        return render(request, 'administrator/loginOK.html')
    print(f'ログイン:{login_id}')
    return render(request, 'login/loginOK.html')


def chat_list(request):
    login_id = request.session.get('login_id')
    # ログインしていない場合はログインページにリダイレクト
    if not login_id:
        return redirect('login')

    return render(request, 'chat/chat_list.html',
                  {'partner_list': LoginInfo.objects.exclude(role=3).exclude(login_id=login_id).all()})


def chat(request):
    login_id = request.session.get('login_id')
    # ログインしていない場合はログインページにリダイレクト
    if not login_id:
        return redirect('login')

    if request.method == 'POST':
        toid = request.POST['toid']
        if not toid:
            return redirect('chat_list')

        to_info = LoginInfo.objects.filter(login_id=toid).values('name').first()
        chat_info = {'toNameInput': to_info['name'], 'toInput': toid, 'idInput': login_id}
        return render(request, 'chat/chat.html', {'chat_info': chat_info})
    return redirect('chat_list')


def contact(request):
    username = request.session.get('username')
    role = request.session.get('role')

    if role == 1:
        return render(request, 'contact/student.html', {'name': username})
    elif role == 2:
        return render(request, 'contact/teacher.html', {'name': username})
    else:
        # ログインしていない・ロールが一致しない場合はログインページにリダイレクト
        return redirect('login')


def logout(request):
    request.session.flush()
    return render(request, 'login/logout.html')


def info_list(request):
    # ログインしていない場合もしくは管理者でない場合
    if request.session.get('role') != 3:
        return redirect('login')

    return render(request, 'administrator/login_info_list.html', {'login_info_list': LoginInfo.objects.all()})


def login_info_add(request):
    # ログインしていない場合もしくは管理者でない場合
    if request.session.get('role') != 3:
        return redirect('login')

    if request.method == 'POST':
        login_id = request.POST['login_id']
        # データベースにIDがある場合
        if LoginInfo.objects.filter(login_id=login_id).exists():
            return HttpResponse('既に登録されているIDです。')

        # DBへ追加
        LoginInfo(
            login_id=login_id,
            name=request.POST['name'],
            password=hashing(login_id, request.POST['password']),
            address=request.POST['address'],
            role=request.POST['role']
        ).save()

        return redirect('info_list')

    return render(request, 'administrator/login_info_add.html')


def info_update(request, login_id=None):
    # ログインしていない場合もしくは管理者でない場合
    if request.session.get('role') != 3:
        return redirect('login')
    # login_id パラメータがない場合404を返す
    if login_id is None:
        return HttpResponseNotFound("login_idがありません")

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

        return redirect('info_list')

    return render(request, 'administrator/login_info_update.html', {'login_info': login_info})


def delete_info(request, login_id=None):
    # ログインしていない場合もしくは管理者でない場合
    if request.session.get('role') != 3:
        return redirect('login')
    # login_id パラメータがない場合404を返す
    if login_id is None:
        return HttpResponseNotFound("login_idがありません")

    login_info = LoginInfo.objects.get(login_id=login_id)

    if request.method == 'POST':
        login_info.delete()
        return redirect('info_list')

    return render(request, 'administrator/login_info_delete.html', {'login_info': login_info})


def message_history(request):
    # ログインしていない場合もしくは管理者でない場合
    if request.session.get('role') != 3:
        return redirect('login')

    if request.method == 'POST':
        message_list = []
        id1 = request.POST['name1']
        id2 = request.POST['name2']
        for message_id, message in requests.post('https://erygod339e.execute-api.us-east-1.amazonaws.com/rest',
                                                 data='chat_history').json().items():  # 辞書の中身(JSON)をすべて取り出す
            data = json.loads(message)
            if data['client_id'] == id1 and data['to_client'] == id2:
                # id1 から id2 に送信された
                message_list.append(f"{id1}:{data['message']}")
            elif data['client_id'] == id2 and data['to_client'] == id1:
                # id2 から id1 に送信された
                message_list.append(f"{id2}:{data['message']}")
        return render(request, 'administrator/chat_history.html', {'message_list': message_list})

    return render(request, 'administrator/all_chat_history.html',
                  {'id_list': LoginInfo.objects.values_list('login_id', flat=True)})
