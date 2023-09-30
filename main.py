import asyncio
import json

import websockets

# クライアントの管理用のセット
clients = set()


# クライアントからのメッセージを受信するコルーチン
async def handle_client(websocket):  # 接続が確立された
    print("クライアントが接続しました。")
    try:
        # 新しいクライアントのWebSocket接続をclientsセットに追加
        clients.add(websocket)

        async for message in websocket:
            # 受信したJSONデータをPythonオブジェクトに変換
            data = json.loads(message)
            if data.get('data_type', '') == 'status':
                # JSONのテータス履歴を追加
                with open('status_history.json', 'r', encoding='utf-8') as json_file_r:
                    status_history = json.load(json_file_r)
                # JSONテータス履歴を辞書に追加(キーはStringに変換)
                status_history[data.get('client_id', '')] = message
                # テータス履歴をJSONで保存
                with open('status_history.json', 'w', encoding='utf-8') as json_file_w:
                    json.dump(status_history, json_file_w, ensure_ascii=False, indent=4)
            else:
                # dataオブジェクトには'messageId', 'client_id', 'message'が含まれる
                message_id = data.get('message_id', '')
                client_id = data.get('client_id', '')
                received_message = data.get('message', '')
                checked = data.get('checked', False)  # チェック状態を取得
                print(f"ID:{message_id}　受信ID：{client_id}　メッセージ:{received_message}　チェック状態:{checked}")
                # JSONのチャット履歴を追加
                with open('chat_history.json', 'r', encoding='utf-8') as json_file_r:
                    chat_history = json.load(json_file_r)
                # JSONチャット履歴を辞書に追加(キーはStringに変換)
                chat_history[str(message_id)] = message
                # チャット履歴をJSONで保存
                with open('chat_history.json', 'w', encoding='utf-8') as json_file_w:
                    json.dump(chat_history, json_file_w, ensure_ascii=False, indent=4)
            # クライアントからのメッセージをすべてのクライアントにブロードキャスト
            for client in clients:
                await client.send(message)

    finally:  # クライアントが切断された
        print(f"接続が切断されました。")
        # クライアントのWebSocket接続をclientsセットから削除
        clients.remove(websocket)


# WebSocketサーバーを起動
start_server = websockets.serve(handle_client, "localhost", 8765)
print("サーバー起動中...")

# イベントループの開始
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
