var sms = false;

$(function () {
    $('#sms').hide();
    $("#wait").hide();
    $('#passwd').show();
    document.activeElement.addEventListener('keydown', handleKeydown);
});

function handleKeydown(e) {
    $.clearEvent(e);
    switch (e.key) {
        case 'ArrowUp':
            nav(-1);
            break;
        case 'ArrowDown':
            nav(1);
            break;
        case 'Q':
        case 'SoftLeft':
            login();
            break;
        case 'E':
        case 'SoftRight':
            window.location.href = '../user/index.html';
            break;
        case 'Enter':
            if (sms) {
                if (current == 1) {
                    $('.geetest_radar_tip').trigger('click');
                }
                else {
                    sms = false;
                    $('#sms').hide();
                    $('#passwd').show();
                }
            }
            else {
                sms = true;
                $('#sms').show();
                $('#passwd').hide();
                gtInit();
            }
            break;
    }
}

function gtInit() {
    var result = $.getWeb('http://passport.bilibili.com/web/captcha/combine?plat=6');
    if (result.code == 0) {
        var gt = result.data.result.gt;
        var challenge = result.data.result.challenge;
        initGeetest({
            gt: gt,
            challenge: challenge,
            offline: false,
            new_captcha: true,
            product: "popup",
            width: "300px",
            https: true
        }, function (captchaObj) {
            captchaObj.appendTo('#captcha');
            captchaObj.onReady(function () {
                $("#wait").hide();
            });
            captchaObj.onSuccess(function () {
                var result = captchaObj.getValidate();
                if (!result)
                    return alert('请完成验证');
                else {
                    var seccode = result.geetest_seccode;
                    var validate = result.geetest_validate;

                }
            });
        });
    }
    else {
        alert('联系服务器失败，请稍后重试！');
    }
}

function login() {
    if (sms) {

    }
    else {
        var username = document.getElementById('name').value;
        var pwd = document.getElementById('pwd').value;
        if (username == '' || pwd == '') {
            alert('账号或者密码不能为空！');
        }
        else {
            var passwd = encryptedPwd(pwd);
            var content = 'username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(passwd) + '&gee_type=10';
            var data = $.postApi('https://passport.bilibili.com/api/v3/oauth2/login', content, tv);
            if (data.code == 0) {
                var token = data.data.token_info;
                userId = token.mid;
                localStorage.setItem('mid', token.mid);
                localStorage.setItem('access_token', token.access_token);
                localStorage.setItem('refresh_token', token.refresh_token);
                localStorage.setItem('expires_in', (token.expires_in + $.getTs()));
                alert('登录成功！');
                window.location.href = '../user/index.html';
            }
            else {
                alert('登录失败！' + data.message);
            }
        }

    }
}

function encryptedPwd(pwd) {
    var encrypted = pwd;
    var data = $.postApi("https://passport.bilibili.com/api/oauth2/getKey", '', android);
    if (data != null && data.code == 0) {
        var key = data.data.key;
        var hash = data.data.hash;
        key = key.replace(/\n/g, '').replace('-----BEGIN PUBLIC KEY-----', '').replace('-----END PUBLIC KEY-----', '');
        var decrypt = new JSEncrypt();
        decrypt.setPublicKey(key);
        var hashPass = hash.concat(pwd);
        encrypted = decrypt.encrypt(hashPass);
        if (typeof encrypted == 'boolean' && encrypted == false) {
            //加密失败，放弃挣扎吧
            encrypted = pwd;
        }
    }
    return encrypted;
}

var current = -1;
function nav(move) {
    var tag = sms ? ".item2" : ".item";
    const items = document.querySelectorAll(tag);
    var next = current + move;
    if (next >= items.length) {
        next = items.length - 1;
    }
    else if (next < 0) {
        next = 0;
    }
    const targetElement = items[next];
    if (targetElement) {
        current = next;
        targetElement.focus();
        $(tag).removeClass('select');
        $(targetElement).addClass('select');
    }
}