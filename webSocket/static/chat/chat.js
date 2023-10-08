fetch('https://static.tts.quest/voicevox_speakers.json')
    .then(response => response.json())
    .then(speakers => speakers.forEach(speaker => {
        const option = document.createElement('option');
        option.value = option.text = speaker;
        document.getElementById('speakerSelect').appendChild(option);
    }))
    .catch(error => console.error('Error fetching speakers:', error));
// WebSocketを格納する変数
const webSocket = new WebSocket('wss://wnukwbocq5.execute-api.us-east-1.amazonaws.com/production');
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
    fetch('https://erygod339e.execute-api.us-east-1.amazonaws.com/rest', {
        method: 'POST',
        body: 'status_history',
        headers: {'Content-Type': 'text/plain'}
    })
        .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok.'))
        .then(statusHistory => {
            const statusIcon = document.getElementById("status_icon");
            const statusInfo = JSON.parse(statusHistory[document.getElementById('toInput').value])
            statusIcon.style.color = statusInfo['status'] ? 'green' : 'red';
            const chatName = document.getElementById("chat_name");
            chatName.parentNode.insertBefore(statusIcon, chatName);
        })
        .catch(error => {
            console.error('エラー:', error)
            document.getElementById("status_icon").style.color = 'red'
        });

    // jsonチャット履歴受け取り
    fetch('https://erygod339e.execute-api.us-east-1.amazonaws.com/rest', {
        method: 'POST',
        body: 'chat_history',
        headers: {'Content-Type': 'text/plain'}
    })
        .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok.'))
        .then(chatHistory => {
            for (const key in chatHistory) {
                handleMessage(JSON.parse(chatHistory[key]));
            }
        })
        .catch(error => console.error('エラー:', error));
};
// メッセージを受信したときの処理
webSocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data['data_type'] === 'status') {
        // 相手のステータスのみ更新
        if (data['client_id'] === document.getElementById('toInput').value) {
            const statusIcon = document.getElementById("status_icon");
            statusIcon.style.color = data['status'] ? 'green' : 'red';
            const chatName = document.getElementById("chat_name");
            chatName.parentNode.insertBefore(statusIcon, chatName);
        }
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
            const chat = document.getElementById('chat');
            chat.appendChild(messageContainer);

            // wraparound_clear
            const clearDiv = document.createElement('div');
            clearDiv.classList.add('wraparound_clear');
            chat.appendChild(clearDiv);

            // message_box クラスを持つ新しいメッセージ要素にクリックイベントトリスナーを追加
            messageBox.addEventListener('click', () => {
                if (document.getElementById('mode').checked) {
                    // クリックされた要素内のテキストコンテンツを取得
                    // .message_display クラスを持つ要素のテキストを取得し、アラートとして表示
                    new TtsQuestV3Voicevox(
                        document.getElementById('speakerSelect').selectedIndex,
                        messageDisplay.textContent
                    ).play();
                }
            });

            // スクロールを一番下に移動
            chat.scrollTop = chat.scrollHeight;
        } else {
            // すでに表示されているメッセージがあれば 未読・既読 を更新
            const readStatus = existingMessage.querySelector('.info_right');
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

// Tabで送信
document.getElementById('sendButton').addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
        event.preventDefault();
        document.getElementById('sendButton').click();
    }
});

// Audioクラスを継承して新しいクラスTtsQuestV3Voicevoxを定義する
class TtsQuestV3Voicevox extends Audio {
    constructor(speakerId, text) {
        super(); // 親クラスのコンストラクターを呼び出す
        // 音声合成のメソッド#mainを呼び出す
        this.#main(this, new URLSearchParams({speaker: speakerId, text: text}));
    }

    // 非公開メソッド#main - 音声合成リクエストをAPIに送信して音声を取得する
    #main(owner, query) {
        if (owner.src.length > 0) return;
        fetch('https://api.tts.quest/v3/voicevox/synthesis' + '?' + query.toString())
            .then(response => response.json())
            .then(response => {
                if (typeof response['retryAfter'] !== 'undefined') {
                    setTimeout(owner.#main, 1000 * (1 + response['retryAfter']), owner, query);
                } else if (typeof response['mp3StreamingUrl'] !== 'undefined') {
                    owner.src = response['mp3StreamingUrl'];
                } else if (typeof response['mp3StreamingUrl'] !== 'undefined') {
                    throw new Error(response['mp3StreamingUrl']);
                } else throw new Error("serverError");
            });
    }
}

// ページが閉じられる前に実行
window.addEventListener('beforeunload', () => {
    webSocket.send(JSON.stringify({
        'data_type': 'status',
        'client_id': document.getElementById('idInput').value,
        'status': false
    }));
});

