const msgStruct = [{
    name: 'Header Length', // 帧头
    key: 'headerLen',
    bytes: 2, // 字节长度
    offset: 4, // 偏移量
    value: 16
},
{
    name: 'Protocol Version', // 协议版本
    key: 'ver',
    bytes: 2,
    offset: 6,
    value: 1
},
{
    name: 'Operation', // 指令
    key: 'op',
    bytes: 4,
    offset: 8,
    value: 1
},
{
    name: 'Sequence Id',
    key: 'seq',
    bytes: 4,
    offset: 12,
    value: 1
}];
function str2bytes(str) {
    let c;
    const bytes = [], len = str.length;
    for (let i = 0; i < len; i++) {
        c = str.charCodeAt(i)
        if (c >= 0x010000 && c <= 0x10FFFF) {
            bytes.push(((c >> 18) & 0x07) | 0xF0);
            bytes.push(((c >> 12) & 0x3F) | 0x80);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        }
        else if (c >= 0x000800 && c <= 0x00FFFF) {
            bytes.push(((c >> 12) & 0x0F) | 0xE0);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        }
        else if (c >= 0x000080 && c <= 0x0007FF) {
            bytes.push(((c >> 6) & 0x1F) | 0xC0);
            bytes.push((c & 0x3F) | 0x80);
        }
        else {
            bytes.push(c & 0xFF);
        }
    }
    return bytes;
}
function bytes2str(array) {
    const bytes = array.slice(0);
    const filterArray = [
        [0x7f],
        [0x1f, 0x3f],
        [0x0f, 0x3f, 0x3f],
        [0x07, 0x3f, 0x3f, 0x3f]
    ]
    let j, str = '';
    for (let i = 0; i < bytes.length; i = i + j) {
        const item = bytes[i]
        let number = '';
        if (item >= 240)
            j = 4;
        else if (item >= 224)
            j = 3;
        else if (item >= 192)
            j = 2;
        else if (item < 128)
            j = 1;
        const filter = filterArray[j - 1]
        for (let k = 0; k < j; k++) {
            let r = (bytes[i + k] & filter[k]).toString(2)
            const l = r.length
            if (l > 6) {
                number = r;
                break;
            }
            for (let n = 0; n < 6 - l; n++)
                r = '0' + r;
            number = number + r;
        }
        str = str + String.fromCharCode(parseInt(number, 2));
    }
    return str;
}
function bytes2strEx(array, start, end) {
    console.log(array, start, end)
    const bytes = array.slice(start).filter(end);
    const filterArray = [
        [0x7f],
        [0x1f, 0x3f],
        [0x0f, 0x3f, 0x3f],
        [0x07, 0x3f, 0x3f, 0x3f]
    ]
    let j, str = '';
    for (let i = 0; i < bytes.length; i = i + j) {
        const item = bytes[i]
        let number = '';
        if (item >= 240)
            j = 4;
        else if (item >= 224)
            j = 3;
        else if (item >= 192)
            j = 2;
        else if (item < 128)
            j = 1;
        const filter = filterArray[j - 1]
        for (let k = 0; k < j; k++) {
            let r = (bytes[i + k] & filter[k]).toString(2)
            const l = r.length
            if (l > 6) {
                number = r;
                break;
            }
            for (let n = 0; n < 6 - l; n++)
                r = '0' + r;
            number = number + r;
        }
        str = str + String.fromCharCode(parseInt(number, 2));
    }
    return str;
}
function generatePacket(payload, action = 2) {
    const packet = str2bytes(payload);
    const buff = new ArrayBuffer(packet.length + 16);
    const dataBuf = new DataView(buff);
    dataBuf.setUint32(0, packet.length + 16);
    dataBuf.setUint16(4, 16);
    dataBuf.setUint16(6, 1);
    dataBuf.setUint32(8, action);
    dataBuf.setUint32(12, 1);
    for (let i = 0; i < packet.length; i++)
        dataBuf.setUint8(16 + i, packet[i]);
    return dataBuf;
}