const build = '5442100';
const android = {
    key: '1d8b6e7d45233436',
    secret: '560c52ccd288fed045859ed18bffd973'
};
const web = {
    key: '84956560bc028eb7',
    secret: '94aba54af9065f71de72f5508f1cd42e'
};
const tv = {
    key: '4409e2ce8ffd12b8',
    secret: '59b43e04ad6965f34319062b478f83dd'
};
$.extend({
    addScript: function (remoteUrl, loadCallback, errorCalllback) {
        window.URL = window.URL || window.webkitURL;
        var request = new XMLHttpRequest({ mozSystem: true });		
		request.onreadystatechange = function() {  
				if (request.readyState === 4) {
					if (request.status === 200) {  
						var head = document.getElementsByTagName("head")[0];
						console(request.responseText);
						var blob = new Blob([request.responseText], { type: 'text/javascript' });
						var script = document.createElement('script');
						
						script.src = window.URL.createObjectURL(blob);
						script.onload = script.onreadystatechange = function () {
							loadCallback();
						};
						script.onerror = function () {
							errorCalllback();
						};E
						head.appendChild(script);
				}
			}
		}
        request.open("GET", remoteUrl); 
		request.send("");
    },
    Async: function () {
        var task = new Promise(function (resolve) {
            resolve();
        });
        return task;
    },
    getById: function (id) {
        return document.getElementById(id);
    },
    clearEvent: function (e) {
        try {
            var key = e.key;
			var num = -1;
			try{
				num = parseInt(key,10);
			}
			catch (e) {
				console.log(e);
			}
            if ( num == -1 && key != "EndCall" && key.toLowerCase().indexOf('arrow') == -1)
                e.preventDefault();
        }
        catch (e) {
            console.log(e);
        }
    },
    initApi: function () {
        $.ajaxSettings.xhr = function () {
            try {
                return new XMLHttpRequest({ mozSystem: true });
            } catch (e) { }
        };
    },
    postApi: function (url, content, keyValue) {
        var json = null;
        if (keyValue == undefined || keyValue == null || typeof keyValue == 'undefined')
            keyValue = android;
        var access_token = this.getData('access_token');
        content += '&access_key=' + access_token + '&appkey=' + keyValue.key + '&mobi_app=android&platform=android&ts=' + this.getTs();
        content += "&sign=" + this.getSign(content, keyValue.secret);
        $.ajax({
            url: url,
            data: content,
            type: 'post',
            async: false,
            beforeSend: function (request) {
                $.showLoading();
                request.setRequestHeader("user-agent", "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Mobile Safari/537.36")
            },
            success: function (data) {
                json = data;
            },
            error: function (xhr) {
                json = xhr.responseJSON;
            },
            complete: function () {
                $.hideLoading();
            }
        });
        return json;
    },
    postApiAsync: function (url, content, callback, keyValue) {
        if (keyValue == undefined || keyValue == null || typeof keyValue == 'undefined')
            keyValue = android;
        var access_token = this.getData('access_token');
        content += '&access_key=' + access_token + '&appkey=' + keyValue.key + '&mobi_app=android&platform=android&ts=' + this.getTs();
        content += "&sign=" + this.getSign(content, keyValue.secret);
        $.ajax({
            url: url,
            data: content,
            type: 'post',
            async: true,
            beforeSend: function (request) {
                $.showLoading();
                request.setRequestHeader("user-agent", "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Mobile Safari/537.36")
            },
            success: function (data) {
                callback(data);
            },
            error: function (xhr) {
                var data = xhr.responseJSON;
                callback(data);
            },
            complete: function () {
                $.hideLoading();
            }
        });
    },
    getApi: function (url, keyValue) {
        var json = null;
        if (keyValue == undefined || keyValue == null || typeof keyValue == 'undefined')
            keyValue = android;
        var access_token = this.getData('access_token');
        if (url.indexOf('?') > -1)
            url += '&access_key=' + access_token + '&appkey=' + keyValue.key + '&platform=android&build=' + build + '&mobi_app=android&ts=' + this.getTs();
        else
            url += '?access_key=' + access_token + '&appkey=' + keyValue.key + '&platform=android&build=' + build + '&mobi_app=android&ts=' + this.getTs();
        url += "&sign=" + this.getSign(url, keyValue.secret);
        $.ajax({
            url: url,
            type: "get",
            async: false,
            beforeSend: function (request) {
                $.showLoading();
                request.setRequestHeader("user-agent", "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Mobile Safari/537.36")
            },
            success: function (data) {
                json = data;
            },
            error: function (xhr) {
                json = xhr.responseJSON;
            },
            complete: function () {
                $.hideLoading();
            }
        });
        return json;
    },
    getWeb: function (url) {
        var json = null;
        $.ajax({
            url: url,
            type: "get",
            async: false,
            beforeSend: function (request) {
                $.showLoading();
                request.setRequestHeader("user-agent", "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Mobile Safari/537.36")
            },
            success: function (data) {
                json = data;
            },
            error: function (xhr) {
                json = xhr.responseJSON;
            },
            complete: function () {
                $.hideLoading();
            }
        });
        return json;
    },
    getApiAsync: function (url, callback, keyValue) {
        if (keyValue == undefined || keyValue == null || typeof keyValue == 'undefined')
            keyValue = android;
        var access_token = this.getData('access_token');
        url += '&access_key=' + access_token + '&appkey=' + keyValue.key + '&platform=android&build=' + build + '&mobi_app=android&ts=' + this.getTs();
        url += "&sign=" + this.getSign(url, keyValue.secret);
        $.ajax({
            url: url,
            type: "get",
            async: true,
            beforeSend: function (request) {
                $.showLoading();
                request.setRequestHeader("user-agent", "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Mobile Safari/537.36")
            },
            success: function (data) {
                callback(data);
            },
            error: function (xhr) {
                var data = xhr.responseJSON;
                callback(data);
            },
            complete: function () {
                $.hideLoading();
            }
        });
    },
    getData: function (key) {
        try {
            var value = localStorage.getItem(key);
            if (value == undefined || typeof value == 'undefined' || value == null)
                value = '';
            return value;
        }
        catch (e) {
            console.log(e);
        }
        return '';
    },
    setData: function (key, value) {
        try {
            localStorage.setItem(key, value);
        }
        catch (e) {
            console.log(e);
        }
    },
    getSign: function (url, secret) {
        if (typeof secret == 'undefined')
            secret = android.Secret;
        var str = url.substring(url.indexOf("?", 4) + 1);
        var list = str.split('&');
        list.sort();
        var stringBuilder = '';
        for (var index = 0; index < list.length; index++) {
            stringBuilder += (stringBuilder.length > 0 ? '&' : '');
            stringBuilder += list[index];
        }
        stringBuilder += secret;
        var result = stringBuilder;
        result = md5(stringBuilder);
        return result.toLowerCase();
    },
    getTs: function () {
        var ts = new Date().getTime().toString();
        if (ts.length > 10)
            ts = ts.substring(0, 10);
        return ts;
    },
    //获取url传值
    getQueryVar: function (variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) { return pair[1]; }
        }
        return (false);
    },
    getKeyValue: function (value) {
        var result = null;
        if (value != null && typeof value == 'string') {
            if (value.indexOf(':') > -1) {
                var arr = value.split(':');
                if (arr.length > 1)
                    result = arr[1];
            }
            else if (value.indexOf('=') > -1) {
                var arr = value.split('=');
                if (arr.length > 1)
                    result = arr[1];
            }
        }
        else if (value instanceof Array) {
            if (value.length > 0) {
                result = this.getKeyValue(value[0]);
            }
        }
        return result;
    },
    toDateTimeString: function (timestamp) {
        var date = new Date(timestamp * 1000);
        var Y = date.getFullYear() + '-';
        var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        var D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
        var h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
        var m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
        var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
        return Y + M + D + h + m + s;
    }
});

$(function () {
    $.initApi();
});
