let userId = 0;
let isOpen = false, selfvalue = false;

let urlQrCode = "https://passport.bilibili.com/x/passport-login/web/qrcode/generate?source=main-fe-header"
//urlQrCode = "http://passport.bilibili.com/qrcode/getLoginUrl"
urlQrCode = 'https://passport.bilibili.com/x/passport-tv-login/qrcode/auth_code'
var intervalCheck = null;
let qrcode_key = ""
let qrUrl = ""
function loadLoginQrCode()
{  
    if(intervalCheck)
    {
        clearInterval(intervalCheck)
    }
    var data = $.postApi(urlQrCode,'local_id=0',tv); 
    if(data.code!=0)
    {
        alert(data.message)
        return;
    }
    var url = data.data.url
    //qrcode_key = data.data.qrcode_key
    qrcode_key = data.data.auth_code
    document.getElementById('qrcodeimg').innerHTML=''
    new QRCode('qrcodeimg', {
        text: url,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H //纠错等级
    }); 
    $.golbalhideLoading = true;
    intervalCheck = setInterval(function(){
        var urlPoll="https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key="+qrcode_key+"&source=main-fe-header"
        //var urlPoll = 'http://passport.bilibili.com/qrcode/getLoginInfo'
        urlPoll='https://passport.bilibili.com/x/passport-tv-login/qrcode/poll'
        var dataPoll = $.postApi(urlPoll,'local_id=0&auth_code='+qrcode_key,tv); 

        //var dataPoll = $.postApi(urlPoll,"oauthKey="+qrcode_key); 
        //console.log(dataPoll)
        var code = dataPoll.code
        if (code == 0) {
            clearInterval(intervalCheck)
            $.golbalhideLoading = false;
            var token = dataPoll.data.token_info;
            userId = token.mid;
            localStorage.setItem('mid', token.mid);
            localStorage.setItem('access_token', token.access_token);
            localStorage.setItem('refresh_token', token.refresh_token);
            localStorage.setItem('expires_in', (token.expires_in + $.getTs()));
            alert('登录成功！');
            setUserInfo();
        }
        else if(code==86090)
        {
            $('#logintips').text("请点击登录");
        }
        else if(code==86101 || code==86039){ 
            $('#logintips').text("请使用哔哩app扫码登录"); 
        }
        else if(code == 86038)
        {
            clearInterval(intervalCheck)
            $.golbalhideLoading = false;
            //loadLoginQrCode()
        } 
        else {
            alert('登录失败！' + dataPoll.message);
            clearInterval(intervalCheck)
            $.golbalhideLoading = false;
        }
    },1000)
}
function refresh_self() {
    var mid = $.getQueryVar('mid');
    if (!mid) {
        selfvalue = true;
        var id = $.getData('mid');
        if (typeof id != 'undefined' && id != null && id != '') {
            userId = parseInt(id);
            $('#softkey-left').text('刷新');
            setUserInfo();
        }
        else {
            $('#softkey-left').text('刷新');
            $(".login").show();
            $(".info").hide();
            loadLoginQrCode();
        }
    }
    else {
        $('#softkey-left').text('刷新');
        var id = $.getData('mid');
        if (id == mid) {
            selfvalue = true;
            softkey("刷新", "", "选项");
        }
        userId = mid;
        setUserInfo();
    }
    document.activeElement.addEventListener('keydown', handleKeydown);
}

$(refresh_self);

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
            if (!isOpen) {
                if (userId == 0)
                {
                    loadLoginQrCode();
                    //login();
                }
                else{
                    //logout();
                    selfvalue=false;
                    setUserInfo();
                    refresh_self();
                }  
            }
            else {
                navigate();
            }
            break;
        case 'Enter':
            if (!isOpen)
                window.location.href = '../index.html';
            break;
        case 'Backspace':
            window.location.href = '../index.html';
            break;
        case 'E':
        case 'SoftRight':
            showhideMenu();
            break;
    }
}
function navigate() {
    var item = $($('.menuitem')[menuIndex]).attr('data-tag');
    switch (item) {
        case 'cb':
            window.location.href = '../contribution/index.html?mid=' + userId;
            break;
        case 'dy':
            window.location.href = '../dynamic/index.html?mid=' + userId;
            break;
        case 'ct':
            window.location.href = '../collection/index.html';
            break;
        case 'at':
            window.location.href = '../attention/index.html';
            break;
        case 'logout':
            logout();
            showhideMenu();
            break;
            
    }
}

function showhideMenu() {
    if (isOpen) {
        $("#menu").hide();
        softkey("刷新", "主页", "选项");
        isOpen = false;
    }
    else {
        if (!selfvalue) {
            $('*[data-tag="at"]').hide();
            $('*[data-tag="ct"]').hide();
        }
        menuIndex=0;
        $("#menu").show();
        var items = document.querySelectorAll('.menuitem');
        items.forEach(function (item, index) { 
            $(item).removeClass('select'); 
        }); 
        var items = document.querySelectorAll('.menuitem:not([style*="display:none"]):not([style*="display: none"]');
        items[0].focus();
        $(items[0]).addClass('select');
        softkey("选择", "主页", "返回");
        isOpen = true;
    }
}

function softkey(left, center, right) {
    $('#softkey-left').text(left);
    $('#softkey-center').text(center);
    $('#softkey-right').text(right);
}

function logout() {
    userId = 0;
    $(".info").hide();
    $(".login").show();
    $('#softkey-left').text('登录');
    localStorage.removeItem('mid');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_in');
    localStorage.removeItem('userInfo');
}

var current = -1, menuIndex = 0;
function nav(move) {
    if (!isOpen) {
        var next = current + move;
        const items = document.querySelectorAll('.item');
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
            $('.item').removeClass('select');
            $(targetElement).addClass('select');
        }
    }
    else {
        var next = menuIndex + move;
        var items = document.querySelectorAll('.menuitem:not([style*="display:none"]):not([style*="display: none"]');
        //console.log(items)  
        if (next >= items.length) {
            next = items.length - 1;
        }
        else if (next < 0) {
            next = 0;
        }
        const targetElement = items[next];
        if (targetElement) {
            menuIndex = next;
            targetElement.focus();
            $('.menuitem').removeClass('select');
            $(targetElement).addClass('select');
        }
    }
}

function login() {
    //var username = $('#name').val();
    //var pwd = $('#pwd').val();
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
            setUserInfo();
        }
        else {
            alert('登录失败！' + data.message);
        }
    }
}

function setUserInfo() {
    var userInfo = null;
    if (selfvalue)
        userInfo = $.getData('userInfo');
    if (typeof userInfo == 'undefined' || userInfo == null || userInfo == '') {
        var url = 'https://app.bilibili.com/x/v2/space?ps=10&vmid=' + userId;
        var result = $.getApi(url);
        userInfo = JSON.stringify(result);
    }
    var info = JSON.parse(userInfo);
    if (info != null) {
        $('#face').attr('src', info.data.card.face);
        $('#uid').text('UID ' + info.data.card.mid);
        $('#uname').text(info.data.card.name);
        $('#exp').text('经验 ' + info.data.card.level_info.current_exp + ' / ' + info.data.card.level_info.next_exp);
        $('#lv').text('LV ' + info.data.card.level_info.current_level);
        $('#focus').text(' 关注 ' + info.data.card.attention);
        $('#fans').text(' 粉丝 ' + info.data.card.fans);
        $('#sign').text(info.data.card.sign);
    }
    if (selfvalue) {
        localStorage.setItem('userInfo', userInfo);
        //$('#softkey-left').text('注销');
    }
    $(".login").hide();
    $(".info").show();
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
