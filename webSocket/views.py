from django.http import HttpResponse


def index(request):
    # render() に置き換えると、用意したHTMLファイルにrequestやPythonの変数を渡すこともできる
    return HttpResponse("Hello, world. You're at the polls index.")
