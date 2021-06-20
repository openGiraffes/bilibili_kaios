let mid = 0, menuId = 0;
$(function () {
    mid = $.getData('mid');
    menuId = $.getQueryVar('id');
    loadData();
    document.activeElement.addEventListener('keydown', handleKeydown);
});
function loadData() {
    var url = 'https://api.bilibili.com/audio/music-service-c/menus/' + menuId + '?mid=' + mid;
    var result = $.getApi(url);
    console.log(result);
    if (result.code == 0) {
        $('#cover').attr('src', result.data.menusRespones.coverUrl + '@96w_80h.jpg');
        $('#title').text(result.data.menusRespones.title);
        $('#desc').text(result.data.menusRespones.intro);
        $('#play').text(result.data.menusRespones.playNum);
        var arr = result.data.songsList;
        if (arr != null) {
            for (var index = 0; index < arr.length; index++) {
                var html = '<div class="item" data-id="' + arr[index].id + '"><p>' + arr[index].title + '</p><p>' + arr[index].author + '</p></div>';
                $('.items').append(html);
            }
        }
    }
    else {
        alert('获取歌曲列表失败！' + result.message);
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
            const items = document.querySelectorAll('.item');
            const targetElement = items[current];
            var id = $(targetElement).attr("data-id");
            window.location.href = '../songinfo/index.html?id=' + id;
            break;
        case 'E':
        case 'Backspace':
        case 'SoftRight':
            window.location.href = '../music/index.html';
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