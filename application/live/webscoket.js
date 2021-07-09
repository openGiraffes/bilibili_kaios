class BiliSocket {
    constructor(id) {
        this.roomid = parseInt(id);
    }
    draw(rootElementId, elementId) {
        window.danmaku = new Danmaku({
            container: document.getElementById(rootElementId),
            media: document.getElementById(elementId),
            engine: 'canvas',
            speed: 80
        });
    }
    server() {
        var url = 'https://api.live.bilibili.com/room/v1/Danmu/getConf?room_id=' + this.roomid;
        var result = $.getApi(url);
        if (result.code == 0) {
            var token = result.data.token;
            var info = result.data.host_server_list[0];
            return { token: token, host: info.host, port: info.ws_port };
        }
        else {
            return { token: '', host: 'broadcastlv.chat.bilibili.com', port: 2244 };
        }
    }
    listen() {
        try {
            var classObj = this;
            var info = this.server();
            var ws = new WebSocket('ws://' + info.host + ':' + info.port + '/sub');
            ws.onopen = function () {
                var uid = $.getData('mid');
                if (uid == '')
                    uid = 0;
                var data = {
                    protover: 2,
                    platform: "web",
                    key: info.token,
                    uid: parseInt(uid),
                    roomid: classObj.roomid
                };
                ws.send(encode(JSON.stringify(data), 7));
            };
            ws.onmessage = function (event) {
                try {
                    decode(event.data, function (packet) {
                        switch (packet.op) {
                            case 3:
                                const count = packet.body.count
                                //console.log(`人气：${count}`);
                                break;
                            case 5:
                                packet.body.forEach((body) => {
                                    switch (body.cmd) {
                                        case 'DANMU_MSG': {
                                            console.log(body.info[1])
                                            window.danmaku.emit({
                                                text: body.info[1],
                                                style: {
                                                    font: '12px',
                                                    fillStyle: '#fff'
                                                }
                                            });
                                            break;
                                        }
                                        case 'SEND_GIFT': {
                                            var content = body.data.uname + body.data.action + '个' + body.data.giftName;

                                            break;
                                        }
                                        case 'WELCOME': {
                                            var content = '欢迎' + body.data.uname + '进入直播间';

                                            break;
                                        }
                                    }
                                })
                                break;
                        }
                    });
                }
                catch (e) {
                    console.log(e)
                }
            };
            ws.onclose = function (event) {
                alert('弹幕服务连接断开！');
            };
            setInterval(function () {
                ws.send(encode('', 2));
            }, 30000);
        }
        catch (e) {
            console.log(e)
        }
    }
}