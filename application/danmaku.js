window.danmaku = null;
$.extend({
    showDanmaku: function (text, time, color) {
        if (typeof color == 'undefined' || color == '')
            color = '#ffffff';
        var comment = {
            text: text,
            style: {
                fontSize: '12px',
                color: color
            }
        };
        if (typeof time != 'undefined' && time != '' && time > 0)
            comment.time = time;
        danmaku.emit(comment);
    },
    sendDanmaku: function (aid, cid, mid, p, color, msg) {
        var json = null;
        var ts = $.getTs();
        var access_token = this.getData('access_token');
        var url = 'https://api.bilibili.com/x/v2/dm/post?access_key=' + access_token + '&aid=' + aid + '&appkey=' + android.key + '&build=' + build + '&mobi_app=android&oid=' + cid +
            '&platform=android&ts=' + ts;
        url += "&sign=" + $.getSign(url);
        var content = 'pool=0&rnd=' + ts + '&oid=' + cid + '&fontsize=25&msg=' + encodeURIComponent(msg) + '&mode=' + mid + '&progress=' + p + '&color=' + color +
            '&plat=2&screen_state=0&from=861&type=1';
        $.ajax({
            url: url,
            data: content,
            type: 'post',
            async: false,
            headers: {
                'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Mobile Safari/537.36'
            },
            success: function (data) {
                json = data;
            }
        });
        return json;
    },
    sendLiveDanmaku: function (rid, msg) {
        var json = null;
        try {
            var ts = $.getTs();
            var mid = $.getQueryVar('mid');
            var access_token = this.getData('access_token');
            var content = 'cid=' + rid + '&mid=' + mid + '&msg=' + msg + '&rnd=' + ts + '&mode=1&pool=0&type=json&color=16777215&fontsize=25&playTime=0.0';
            var url = 'https://api.live.bilibili.com/api/sendmsg?access_key=' + access_token + '&actionKey=appkey&appkey=' + android.key + '&build=' + build + '&device=android&mobi_app=android&platform=android&ts=' + ts;
            url += "&sign=" + $.getSign(url);
            $.ajax({
                url: url,
                data: content,
                type: 'post',
                async: false,
                headers: {
                    'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Mobile Safari/537.36'
                },
                success: function (data) {
                    json = data;
                }
            });
        }
        catch (e) {
            console.log(e);
        }
        return json;
    },
    sendComment: function (aid, text) {
        var json = null;
        try {
            var ts = $.getTs();
            var access_token = this.getData('access_token');
            var url = "https://api.bilibili.com/x/v2/reply/add";
            var content = "access_key=" + access_token + "&appkey=" + android.key + "&platform=android&type=1&oid=" + aid + "&ts=" + ts + "&message=" + text;
            content += "&sign=" + $.getSign(content);
            $.ajax({
                url: url,
                data: content,
                type: 'post',
                async: false,
                headers: {
                    'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Mobile Safari/537.36'
                },
                success: function (data) {
                    json = data;
                }
            });
        }
        catch (e) {
            console.log(e);
        }
        return json;
    },
    getDanmaku: function (rootElementId, elementId, cid) {
        try {
            var url = 'https://api.bilibili.com/x/v1/dm/list.so?oid=' + cid;
            var result = $.getWeb(url);
            var nodes = result.getElementsByTagName('d');
            var task = function () {
                var comments = [];
                for (var idx = 0; idx < nodes.length; idx++) {
                    try {
                        var content = nodes[idx].textContent;
                        var attributes = nodes[idx].attributes[0].nodeValue.split(',');
                        var mode = 'rtl', time = parseFloat(attributes[0]);
                        switch (attributes[1]) {
                            case '4':
                                mode = 'bottom';
                                break;
                            case '5':
                                mode = 'top';
                                break;
                        }
                        comments.push({
                            text: content,
                            mode: mode,
                            time: time,
                            style: {
                                font: '12px',
                                fillStyle: '#fff'
                            }
                        });
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                window.danmaku = new Danmaku({
                    container: document.getElementById(rootElementId),
                    media: document.getElementById(elementId),
                    engine: 'canvas',
                    comments: comments,
                    speed: 80
                });

            };
            setTimeout(task, 60);
        }
        catch (e) {
            console.log(e);
        }
    }
});