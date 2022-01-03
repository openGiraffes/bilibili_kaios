let userId = 0;
let isOpen = false, self = false;
$(function () {
    var mid = $.getQueryVar('mid');
    if (mid === false) {
        self = true;
        var id = $.getData('mid');
        if (typeof id != 'undefined' && id != null && id != '') {
            userId = parseInt(id);
            setUserInfo();
        }
        else {
            $('#softkey-left').text('登录');
            $(".none").show();
            $(".info").hide();
        }
    }
    else {
        var id = $.getData('mid');
        if (id == mid) {
            self = true;
            softkey("", "", "选项");
        }
        userId = mid;
        setUserInfo();
    }
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
            if (!isOpen) {
                if (userId == 0)
                    window.location.href = '../login/index.html';
                else
                    logout();
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
    }
}

function setUserInfo() {
    var userInfo = null;
    if (self)
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
    if (self) {
        localStorage.setItem('userInfo', userInfo);
        $('#softkey-left').text('注销');
    }
    $(".none").hide();
    $(".info").show();
}

function showhideMenu() {
    if (isOpen) {
        $("#menu").hide();
        softkey("登录", "主页", "选项");
        isOpen = false;
    }
    else {
        if (!self) {
            $('*[data-tag="at"]').hide();
            $('*[data-tag="ct"]').hide();
        }
        $("#menu").show();
        var items = document.querySelectorAll('.menuitem');
        items[0].focus();
        softkey("选择", "", "返回");
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
    $(".none").show();
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
        var items = document.querySelectorAll('.menuitem');
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