let page = 1;
let userId = 0;
let isOpen = false;
let fid = 0;

$(function () {
    userId = $.getData('mid');
    var url = 'https://api.bilibili.com/medialist/gateway/base/created?channel=bilih5&pn=1&ps=20&type=2&up_mid=' + userId;
    var result = $.getApi(url);
    if (result.code == 0) {
        try {
            var arr = result.data.list, options = '';
            for (var index = 0; index < arr.length; index++) {
                var item = arr[index];
                options += '<li class="menuitem" value="' + item.fid + '">' + item.title + '</li>';
            }
            fid = arr[0].fid;
            loadBox();
            $('#menucontainer').append(options);
        }
        catch (e) {
            console.log(e);
        }
    }
    else {
        alert('获取收藏夹失败！');
    }
    document.activeElement.addEventListener('keydown', handleKeydown);
});

function handleKeydown(e) {
    switch (e.key) {
        case 'ArrowUp':
            nav(-1);
            break;
        case 'ArrowDown':
            nav(1);
            break;
        case 'Q':
        case 'SoftLeft':
            if (isOpen) {
                const item = document.querySelectorAll('.menuitem')[menu];
                if (typeof item != 'undefined') {
                    page = 1;
                    fid = $(item).attr('value');
                    loadBox();
                }
            }
            else {
                const item = document.querySelectorAll('.item')[current];
                if (typeof item != 'undefined') {
                    var aid = $(item).attr('data-aid'), cid = $(item).attr('data-cid');
                    window.location.href = '../player/index.html?aid=' + aid + '&cid=' + cid + '&type=collection';
                }
            }
            showhideMenu();
            break;
        case 'Backspace':
            window.location.href = '../user/index.html?mid=' + userId;
            break;
        case 'Enter':
            if (!isOpen) {
                page++;
                loadBox();
            }
            break;
        case 'E':
        case 'SoftRight':
            showhideMenu();
            break;
    }
}

function loadBox() {
    var url = 'http://api.bilibili.com/x/v2/fav/video?pn=' + page + '&ps=20&tid=0&fid=' + fid + '&vmid=' + userId + '&order=ftime';
    var result = $.getApi(url);
    if (page == 1)
        $('#container').empty();
    if (result.code == 0) {
        var arr = result.data.archives;
        for (var index = 0; index < arr.length; index++) {
            var item = arr[index];
            var name = '';
            if (item.owner != null)
                name = item.owner.name;
            $('#container').append("<div class='item' data-aid='" + item.aid + "' data-title='" + item.title + "' data-cid='" + item.cid + "'><img class='cover' src='" +
                item.pic + "@96w_60h.jpg" + "'/><div class='title'>" + item.title + "</div><div class='imgUP'>UP</div><div class='author'>" + name + "</div></div>");
        }
    }
    else {
        alert('获取收藏夹内容失败！' + result.message);
    }
}

function showhideMenu() {
    if (isOpen) {
        $("#menu").hide();
        softkey("登录", "主页", "选项");
        isOpen = false;
    }
    else {
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

var current = -1, menu = 0;
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
        var next = menu + move;
        const items = document.querySelectorAll('.menuitem');
        if (next >= items.length) {
            next = items.length - 1;
        }
        else if (next < 0) {
            next = 0;
        }
        const targetElement = items[next];
        if (targetElement) {
            menu = next;
            targetElement.focus();
            $('.menuitem').removeClass('select');
            $(targetElement).addClass('select');
        }

    }
}