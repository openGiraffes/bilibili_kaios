$(function () {
    loadData();
    document.activeElement.addEventListener('keydown', handleKeydown);
});
function loadData() {
    var url = 'https://api.live.bilibili.com/xlive/app-interface/v2/index/getAllList?device=android&rec_page=1&relation_page=1&scale=xxhdpi';
    var result = $.getApi(url);
    if (result.code == 0) {
        var rooms = result.data.room_list;
        if (rooms != null) {
            for (var index = 0; index < rooms.length; index++) {
                var lists = rooms[index].list;
                var module_info = rooms[index].module_info;
                var aid = module_info.link.match(new RegExp(/&area_id=(\d+)/));
                var paid = module_info.link.match(new RegExp(/parent_area_id=(\d+)/));
                aid = $.getKeyValue(aid);
                paid = $.getKeyValue(paid);
                var html = '<div class="item" data-aid="' + aid + '" data-paid="' + paid + '"><div class="header">' + module_info.title + '</div><div class="roomlist">';
                if (lists != null) {
                    for (var j = 0; j < lists.length; j++) {
                        html += '<div class="room" data-id="' + lists[j].uid + '">';
                        html += '<img src="' + lists[j].cover + '@96w_60h.jpg" /><p>' + lists[j].title + '</p>';
                        html += '</div>';
                    }
                }
                html += '</div></div>';
                $('#container').append(html);
            }
        }
    }
    else {
        alert('获取直播信息失败！' + result.message);
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
        case 'ArrowRight':
            tab(1);
            break;
        case 'ArrowLeft':
            tab(-1);
            break;
        case 'Q':
        case 'SoftLeft':
            {
                const items = document.querySelectorAll('.item');
                const targetElement = items[current];
                var index = $(targetElement).attr('data-index');
                if (index) {
                    var item = $(targetElement).find('.roomlist').children()[index];
                    var uid = $(item).attr('data-id');
                    window.location.href = '../live/index.html?uid=' + uid;
                }
                break;
            }
        case 'Enter': {
            const items = document.querySelectorAll('.item');
            const targetElement = items[current];
            var aid = $(targetElement).attr('data-aid');
            var paid = $(targetElement).attr('data-paid');
            window.location.href = '../allive/index.html?aid=' + aid + '&paid=' + paid;
            break;
        }
        case 'E':
        case 'Backspace':
        case 'SoftRight':
            window.location.href = '../index.html';
            break;
    }
}
var current = -1;
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
function tab(move) {
    const items = document.querySelectorAll('.item');
    const targetElement = items[current];
    var index = $(targetElement).attr('data-index');
    if (!index)
        index = -1;
    else
        index = parseInt(index);
    var next = index + move;
    if (next < 0) next = 0;
    var root = $(targetElement).find('.roomlist');
    var child = $(root).children();
    if (child != null) {
        if (next > child.length)
            next = 0;
        var container = child[next];
        $(child[index]).removeClass('select');
        $(container).addClass('select');
        $(targetElement).attr('data-index', next);
        var scrollLeft = $(container).width() * next;
        root[0].scroll(scrollLeft, 0);
    }
}