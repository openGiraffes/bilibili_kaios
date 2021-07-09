$.extend({
    listen: function (id) {
        var ws = new WebSocket('wss://broadcastlv.chat.bilibili.com:2245/sub');
        ws.onopen = function () {
            var uid = $.getData('mid');
            if (uid == '')
                uid = 1e14 + 2e14 * Math.random();
            ws.send(generatePacket(JSON.stringify({
                uid: uid,
                roomid: id
            }), 7));
        };
        ws.onmessage = function (event) {
            onMessage(event)
        }
        ws.onclose = function (event) {
            console.log(event)
            alert('弹幕服务连接断开！');
        }
        setInterval(function () {
            ws.send(generatePacket('', 2));
        }, 20000);
    }
});

function onMessage(event) {
    try {
        var reader = new FileReader();
        reader.onload = function () {
            try {
                const dataView = new DataView(this.result);
                let packetLen, headerLen;
                const result = [];
                for (let offset = 0; offset < dataView.byteLength;) {
                    const data = {};
                    packetLen = dataView.getUint32(offset)
                    headerLen = dataView.getUint16(offset + 4)
                    msgStruct.forEach(item => {
                        if (item.bytes === 4) {
                            data[item.key] = dataView.getUint32(offset + item.offset)
                        } else if (item.bytes === 2) {
                            data[item.key] = dataView.getUint16(offset + item.offset)
                        }
                    });
                    data.body = [];
                    const recData = [];
                    for (let i = offset + headerLen; i < offset + packetLen; i++)
                        recData.push(dataView.getUint8(i));
                    try {
                        data.body = [];
                        const body = JSON.parse(bytes2str(recData));
                        switch (body.cmd) {
                            case 'DANMU_MSG':
                                console.log(body.info[2][1], ':', body.info[1]);
                                break;
                        }
                        data.body.push(body)
                    }
                    catch (e) {
                        console.log(recData)
                    }
                    result.push(data);
                    offset += packetLen
                }
            }
            catch (e) {
                console.log(e)
            }
        }
        reader.readAsArrayBuffer(event.data);
    }
    catch (e) {
        console.log(e)
    }
}