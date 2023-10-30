// VOICEVOX 話者一覧の取得
fetch('https://static.tts.quest/voicevox_speakers.json')
    .then(response => response.json())
    .then(speakers => speakers.forEach(speaker => {  // JSONから取得したspeakers配列をループする
        // 各speakerに対してリストの内容を作成する
        const option = document.createElement('option');
        option.value = speaker;
        option.text = speaker;
        // 各speakerに対してspeakerSelectの中にリストを追加する
        document.getElementById('speakerSelect').appendChild(option);
    }))
    .catch(error => console.error('Error fetching speakers:', error));

// chat_nameに自分と相手のIDを入れる
document.getElementById('chat_name').textContent = `${document.getElementById('idInput').value} <=> ${document.getElementById('toInput').value}`;

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
            // ● の色を変更
            const statusIcon = document.getElementById('status_icon');
            const statusInfo = JSON.parse(statusHistory[document.getElementById('toInput').value])
            statusIcon.style.color = statusInfo['status'] ? 'green' : 'red'; 　// true : false
            // ● chat_name の順番で上書きする
            const chatName = document.getElementById('chat_name');
            chatName.parentNode.insertBefore(statusIcon, chatName);
        })
        .catch(error => {
            console.error('エラー:', error)
            // エラーが発生した場合強制的に赤にする
            document.getElementById('status_icon').style.color = 'red'
        });

    // jsonチャット履歴受け取り
    fetch('https://erygod339e.execute-api.us-east-1.amazonaws.com/rest', {
        method: 'POST',
        body: 'chat_history',
        headers: {'Content-Type': 'text/plain'}
    })
        .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok.'))
        .then(chatHistory => {
            // すべての履歴を表示する
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
        // 自分のステータス情報を反映させない
        if (data['client_id'] === document.getElementById('toInput').value) {
            // ● の色を変更
            const statusIcon = document.getElementById('status_icon');
            statusIcon.style.color = data['status'] ? 'green' : 'red'; 　// true : false
            // ● chat_name の順番で上書きする
            const chatName = document.getElementById('chat_name');
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

        // 表示されているメッセージが無い場合、メッセージを作成
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
                messageInfo.textContent = data['checked'] ? '既読' : '未読'; 　// true : false
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

            // message_box クラスを持つ新しいメッセージ要素にクリックイベントリスナーを追加
            messageBox.addEventListener('click', () => {
                if (document.getElementById('mode').checked) {
                    new TtsQuestV3Voicevox(
                        // クリックされた要素内のテキストコンテンツを取得
                        document.getElementById('speakerSelect').selectedIndex,
                        // .message_display クラスを持つ要素のテキストを取得する
                        messageDisplay.textContent
                    ).play();
                }
            });

            // スクロールを一番下に移動
            chat.scrollTop = chat.scrollHeight;
        } else {
            // すでに表示されているメッセージがある場合 未読・既読 を更新
            const readStatus = existingMessage.querySelector('.info_right');
            if (readStatus) readStatus.textContent = data['checked'] ? '既読' : '未読'; 　// true : false
        }
    }
}

// 送信ボタンが押されると、入力された文字を送る
function sendMessage() {
    const messageInput = document.getElementById('message');
    // JavaScriptオブジェクトをJSONへ変換して送信
    webSocket.send(JSON.stringify({
        'message_id': Date.now(),
        'client_id': document.getElementById('idInput').value,
        'to_client': document.getElementById('toInput').value,
        'message': messageInput.value,
        'checked': false  // チェックボックスの初期状態
    }));
    messageInput.value = '';
}

// Tabで送信
document.getElementById('message').addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
        event.preventDefault();
        sendMessage();
    }
});

// Audioクラスを継承して新しいクラスTtsQuestV3Voicevoxを定義する
class TtsQuestV3Voicevox extends Audio {
    constructor(speakerId, text) {
        super();  // 親クラスのコンストラクターを呼び出す
        // リクエストパラメーター(speaker,text)を格納して、音声合成のメソッド#mainを呼び出す
        this.#main(this, new URLSearchParams({speaker: speakerId, text: text}));
    }

    // 非公開メソッド#main - 音声合成リクエストをAPIに送信して音声を取得する
    #main(owner, query) {
        // 既にsrc属性に音声ファイルがセットされている場合は処理を中断する
        if (owner.src.length > 0) return;
        // fetch関数を使って合成リクエストを送信し、レスポンスを処理する
        fetch('https://api.tts.quest/v3/voicevox/synthesis' + '?' + query.toString())
            .then(response => response.json())
            .then(response => {
                // レスポンスにretryAfter(待機時間(秒))が含まれている場合、APIリクエストが頻繁すぎるときは再試行する
                if (typeof response['retryAfter'] !== 'undefined') {
                    setTimeout(owner.#main, 1000 * (1 + response['retryAfter']), owner, query);
                // レスポンスにmp3StreamingUrlが含まれている場合、音声ファイルのURLをsrcにセットする
                } else if (typeof response['mp3StreamingUrl'] !== 'undefined') {
                    owner.src = response['mp3StreamingUrl'];
                // レスポンスにerrorMessageが含まれている場合、エラーをスローする
                } else if (typeof response['errorMessage'] !== 'undefined') {
                    throw new Error(response['errorMessage']);
                // 上記以外の場合、サーバーエラーとしてエラーをスローする
                } else throw new Error('serverError');
            });
    }
}

// ページが閉じられる前に実行
window.addEventListener('beforeunload', () => {
    // オンラインステータス送信
    webSocket.send(JSON.stringify({
        'data_type': 'status',
        'client_id': document.getElementById('idInput').value,
        'status': false  // オフライン状態
    }));
});