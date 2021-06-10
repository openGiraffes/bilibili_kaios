let aid = 0, paid = 0, page = 1;
$(function () {
    aid = $.getQueryVar('aid');
    paid = $.getQueryVar('paid');
    loadData();
    document.activeElement.addEventListener('keydown', handleKeydown);
});
function loadData() {
    var url = 'https://api.live.bilibili.com/room/v3/Area/getRoomList?actionKey=appkey&area_id=' + aid + '&cate_id=0&parent_area_id='
        + paid + '&page=' + page + '&page_size=36&sort_type=online';
    var result = $.getApi(url);
    if (result.code == 0) {
        var arr = result.data.list;
        if (arr != null) {
            for (var index = 0; index < arr.length; index++) {
                var uid = arr[index].uid;
                var nick = arr[index].uname;
                var sub = arr[index].online;
                var title = arr[index].title;
                var image = arr[index].cover;
                $('#container').append("<div class='item' data-uid='" + uid + "' data-title='" + title + "'><img class='head2' src='" + image +
                    "@100w_60h.jpg'/><div class='title' style='left: 110px'>" + title + "</div><div class='author' style='left: 106px'>" + nick + "&nbsp;&nbsp;在线："
                    + sub + "</div></div>")
            }
        }
        else {
            alert('没有更多了！');
        }
    }
    else {
        alert('获取分区列表失败！' + result.message);
    }
}
function handleKeydown(e) {
    switch (e.key) {
        case 'ArrowUp':
            nav(-1);
            break;
        case 'ArrowDown':
            nav(1);
            break;
        case 'Enter':
            {
                page++;
                loadData();
                break;
            }
        case 'Q':
        case 'SoftLeft':
            const items = document.querySelectorAll('.item');
            const targetElement = items[current];
            var uid = $(targetElement).attr("data-uid");
            window.location.href = '../live/index.html?uid=' + uid;
            break;
        case 'E':
        case 'Backspace':
        case 'SoftRight':
            window.location.href = '../lives/index.html';
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