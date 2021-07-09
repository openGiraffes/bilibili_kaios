const textEncoder = new TextEncoder('utf-8');
const textDecoder = new TextDecoder('utf-8');

const readInt = function (buffer, start, len) {
    let result = 0;
    for (let i = len - 1; i >= 0; i--)
        result += Math.pow(256, len - i - 1) * buffer[start + i];
    return result;
}

const writeInt = function (buffer, start, len, value) {
    let i = 0;
    while (i < len) {
        buffer[start + i] = value / Math.pow(256, len - i - 1);
        i++;
    }
}

const encode = function (str, op) {
    let data = textEncoder.encode(str);
    let packetLen = 16 + data.byteLength;
    let header = [0, 0, 0, 0, 0, 16, 0, 1, 0, 0, 0, op, 0, 0, 0, 1]
    writeInt(header, 0, 4, packetLen);
    return (new Uint8Array(header.concat(...data))).buffer
}

const decode = function (blob, callback) {
    let reader = new FileReader();
    reader.onload = function (e) {
        let buffer = new Uint8Array(e.target.result)
        let result = {};
        result.packetLen = readInt(buffer, 0, 4);
        result.headerLen = readInt(buffer, 4, 2);
        result.ver = readInt(buffer, 6, 2);
        result.op = readInt(buffer, 8, 4);
        result.seq = readInt(buffer, 12, 4);
        if (result.op === 5) {
            result.body = [];
            let offset = 0;
            while (offset < buffer.length) {
                let packetLen = readInt(buffer, offset + 0, 4)
                let headerLen = 16;
                let data = buffer.slice(offset + headerLen, offset + packetLen);
                let body = '';
                try {
                    body = textDecoder.decode(pako.inflate(data));
                }
                catch (e) {
                    body = textDecoder.decode(data)
                }
                if (body) {
                    const group = body.split(/[\x00-\x1f]+/);
                    group.forEach(item => {
                        try {
                            const parsedItem = JSON.parse(item);
                            if (typeof parsedItem === 'object')
                                result.body.push(parsedItem);
                        }
                        catch (e) { }
                    });
                }
                offset += packetLen;
            }
        }
        else if (result.op === 3) {
            result.body = {
                count: readInt(buffer, 16, 4)
            };
        }
        callback(result);
    }
    reader.readAsArrayBuffer(blob);
}