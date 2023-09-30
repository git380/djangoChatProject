const webSocket = new WebSocket("ws://localhost:8765"); // WebSocketを格納する変数
// WebSocketの接続が開いたときの処理
webSocket.onopen = () => {
    console.log('WebSocketが開かれました。');
    // 参加後に送信ボタンを有効にする
    document.getElementById('sendButton').disabled = false;

    // オンラインステータス送信
    webSocket.send(JSON.stringify({
        'data_type': 'status',
        'client_id': document.getElementById('idInput').value,
        'status': true  // オンライン状態
    }));
    // jsonステータス履歴受け取り
    fetch('status_history.json')
        .then(data => data.json())
        .then(statusHistory => {
            const statusIcon = document.getElementById("status_icon");
            try {
                const statusInfo = JSON.parse(statusHistory[document.getElementById('toInput').value])
                statusIcon.style.color = statusInfo['status'] ? 'green' : 'red';
            } catch (e) {
                statusIcon.style.color = 'red';
            }
            const chatName = document.getElementById("chat_name");
            chatName.parentNode.insertBefore(statusIcon, chatName);
        });

    // jsonチャット履歴受け取り
    fetch('chat_history.json')
        .then(data => data.json())
        .then(chatHistory => {
            for (const key in chatHistory) {
                handleMessage(JSON.parse(chatHistory[key]));
            }
        });
};
// メッセージを受信したときの処理
webSocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data['data_type'] === 'status') {
        const statusIcon = document.getElementById("status_icon");
        statusIcon.style.color = data['status'] ? 'green' : 'red';
        const chatName = document.getElementById("chat_name");
        chatName.parentNode.insertBefore(statusIcon, chatName);
    } else {
        handleMessage(data);
    }
};
// WebSocketの接続が閉じたときの処理
webSocket.onclose = () => console.log('WebSocketが閉じられました。');

// メッセージを処理する関数
function handleMessage(data) {
    const idInput = document.getElementById('idInput').value;
    const toInput = document.getElementById('toInput').value;
    const isMyMessage = data['client_id'] === idInput;
    // 自分が相手に送信した or 相手が自分に送信した
    if ((isMyMessage && data['to_client'] === toInput) || (data['client_id'] === toInput && data['to_client'] === idInput)) {
        // すでに表示されているメッセージを検索
        const existingMessage = document.getElementById(`message-${data['message_id']}`);

        // 作成 or 更新
        if (!existingMessage) {
            // 新しいメッセージを作成
            const messageContainer = document.createElement('div');
            const messageBox = document.createElement('div');
            const messageDisplay = document.createElement('div');
            const messageInfo = document.createElement('div');
            messageContainer.classList.add('message_container');
            messageBox.classList.add('message_box');
            messageDisplay.classList.add('message_display');
            // idにmessage_idを設定
            messageContainer.id = `message-${data['message_id']}`;

            // 表示内容
            if (isMyMessage) {
                // 自分のmessage作成
                messageContainer.classList.add('right_message');
                messageDisplay.textContent = data['message'];
                messageBox.appendChild(messageDisplay);

                // 未読・既読作成
                messageInfo.classList.add('info_right');
                messageInfo.textContent = data['checked'] ? '既読' : '未読';
                messageBox.appendChild(messageInfo);
            } else {
                // 相手のmessage作成
                messageContainer.classList.add('left_message');
                messageDisplay.textContent = data['message'];
                messageBox.appendChild(messageDisplay);

                // チェックボックスを作成
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = data['checked'];
                messageBox.appendChild(checkbox);

                // チェックボックスが変更されたときの処理
                checkbox.addEventListener('change', () => {
                    // チェックボックスの状態を代入
                    data['checked'] = checkbox.checked;
                    // JSONに戻してサーバへ送信
                    webSocket.send(JSON.stringify(data));
                });

                // 名前作成
                messageInfo.classList.add('info_left');
                messageInfo.textContent = document.getElementById('toNameInput').value;
                messageBox.appendChild(messageInfo);
            }
            messageContainer.appendChild(messageBox);
            // messageをdivタグのchatの後に追加
            document.getElementById('chat').appendChild(messageContainer);

            // wraparound_clear
            const clearDiv = document.createElement('div');
            clearDiv.classList.add('wraparound_clear');
            document.getElementById('chat').appendChild(clearDiv);
        } else {
            // すでに表示されているメッセージがあれば 未読・既読 を更新
            const readStatus = existingMessage.querySelector('.name_right');
            if (readStatus) readStatus.textContent = data['checked'] ? '既読' : '未読';
        }
    }
}

// 送信ボタンが押されると、入力された文字を送る
function sendMessage() {
    const messageInput = document.getElementById('message');
    // JavaScriptオブジェクトを作成
    const data = {
        'message_id': Date.now(),
        'client_id': document.getElementById('idInput').value,
        'to_client': document.getElementById('toInput').value,
        'message': messageInput.value,
        'checked': false  // チェックボックスの初期状態
    };
    // JSONへ変換して送信
    webSocket.send(JSON.stringify(data));
    messageInput.value = '';
}

// ページが閉じられる前に実行
window.addEventListener("beforeunload", () => {
    webSocket.send(JSON.stringify({
        'data_type': 'status',
        'client_id': document.getElementById('idInput').value,
        'status': false
    }));
});

