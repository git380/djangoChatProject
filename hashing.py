import hashlib


def hashing(login_id, password):
    # salt+name+passそれぞれハッシュ化
    salt = hashlib.sha256('ahlve@HQ)E#IGOJ`E3*{}Or]mX@r[jre>,wsr5t6TY'.encode("utf-8")).hexdigest().encode("utf-8")
    hash_username = hashlib.sha256(login_id.encode("utf-8")).hexdigest().encode("utf-8")
    hash_password = hashlib.sha256(password.encode("utf-8")).hexdigest().encode("utf-8")
    # まとめてハッシュ化
    return hashlib.sha256(salt + hash_username + hash_password).hexdigest()
