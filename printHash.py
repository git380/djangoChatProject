from hashing import hashing

if __name__ == '__main__':
    # usernameとpasswordの入力
    login_id = input('username: ')
    password = input('password: ')
    # ハッシュ化
    print(hashing(login_id, password))
