class BiliSocket {
    constructor(id) {
        this.danmaku = $.getData('danmaku');
        if (this.danmaku == '') this.danmaku = 0;
        this.roomid = parseInt(id);
    }
    draw(rootElementId, elementId) {
        if (this.danmaku != 0) {
            window.danmaku = new Danmaku({
                container: document.getElementById(rootElementId),
                media: document.getElementById(elementId),
                engine: 'canvas',
                speed: 80
            });
        }
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
    listen(callback) {
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
                        if (packet.op == 5) {
                            packet.body.forEach((body) => {
                                switch (body.cmd) {
                                    case 'DANMU_MSG': {
                                        var msg = body.info[1];
                                        var ct = $.toDateTimeString(body.info[9].ts);
                                        callback({
                                            content: {
                                                msg: msg,
                                                time: ct,
                                                user: body.info[2][1]
                                            },
                                            name: 'danmaku'
                                        });
                                        if (classObj.danmaku != 0) {
                                            window.danmaku.emit({
                                                text: msg,
                                                style: {
                                                    font: '12px',
                                                    fillStyle: '#fff'
                                                }
                                            });
                                        }
                                        break;
                                    }
                                }
                            });
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