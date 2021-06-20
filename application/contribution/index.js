let userId = 0, page = 1;
let self = false;

$(function () {
    var mid = $.getQueryVar('mid');
    if (mid === false) {
        self = true;
        userId = $.getData('mid');
    }
    else {
        userId = mid;
    }
    loadResource();
    document.activeElement.addEventListener('keydown', handleKeydown);
});

function playV() {
    const items = document.querySelectorAll('.item');
    const targetElement = items[current];
    var aid = $(targetElement).attr('data-aid');
    var bvid = $(targetElement).attr('data-bvid');
    var cid = $(targetElement).attr('data-cid');
    window.location.href = '../player/index.html?aid=' + aid + '&bvid=' + bvid + '&cid=' + cid + '&type=contribution&mid=' + userId;
}

function loadResource() {
    var url = 'https://api.bilibili.com/x/space/arc/search?mid=' + userId + '&ps=30&tid=0&pn=' + page + '&keyword=&order=pubdate';
    var result = $.getApi(url);
    if (result.code == 0) {
        var vlist = result.data.list.vlist;
        if (vlist != null && vlist.length > 0) {
            for (var index = 0; index < vlist.length; index++) {
                var item = vlist[index];
                $('#container').append("<div class='item' data-bvid='" + item.bvid + "' data-aid='" + item.aid + "' data-title='" + item.title + "' data-cid='" + item.cid
                    + "'><img class='cover' src='" + item.pic + "@96w_60h.jpg" + "'/><div class='title'>" + item.title + "</div><div class='imgUP'>UP</div><div class='author'>"
                    + item.author + "</div></div>");
            }
        }
        else {
            $('#container').append('<label>木有投过稿啊qaq~</label>')
        }
    }
    else {
        alert('获取投稿内容失败！' + result.message);
    }
}

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
            playV();
            break;
        case 'E':
        case 'Backspace':
        case 'SoftRight':
            window.location.href = '../user/index.html?mid=' + userId;
            break;
    }
}

var current = 0;
function nav(move) {
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