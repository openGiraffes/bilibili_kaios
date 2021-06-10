let tab_location = 0, data = null;
$(function () {
    loadData();
    document.activeElement.addEventListener('keydown', handleKeydown);
});
function loadData() {
    var url = 'https://api.bilibili.com/audio/music-service-c/firstpage';
    var result = $.getApi(url);
    if (result.code == 0) {
        data = result.data;
        loadView();
    }
    else {
        alert(result.message);
    }
}
function selectItem() {
    const items = document.querySelectorAll('.item');
    const targetElement = items[current];
    if (targetElement) {
        switch (tab_location) {
            case 0:
            case 1:
            case 3: {
                var id = $(targetElement).attr('data-id');
                window.location.href = '../musicmenu/index.html?id=' + id;
                break;
            }
            case 2: {
                var id = $(targetElement).attr('data-id');
                window.location.href = '../songinfo/index.html?id=' + id;
                break;
            }
        }
    }
}
function loadView() {
    $('.items').empty();
    switch (tab_location) {
        case 0: {
            for (var index = 0; index < data.common.length; index++) {
                var item = data.common[index];
                var html = '<div class="item" data-id="' + item.menuId + '"><img src="' + item.coverUrl + '@60w_60h.jpg" /><div class="info"><p>' + item.title + '</p><p>播放：'
                    + item.playNum + '</p></div></div>';
                $('.items').append(html);
            }
            break;
        }
        case 1: {
            for (var index = 0; index < data.pmenu.length; index++) {
                var item = data.pmenu[index];
                var html = '<div class="item" data-id="' + item.menuId + '"><img src="' + item.coverUrl + '@60w_60h.jpg" /><div class="info"><p>' + item.title + '</p><p>播放：'
                    + item.playNum + '</p></div></div>';
                $('.items').append(html);
            }
            break;
        }
        case 2: {
            for (var index = 0; index < data.hitSongs.length; index++) {
                var item = data.hitSongs[index];
                var html = '<div class="item" data-id="' + item.id + '"><img src="' + item.cover_url + '@60w_60h.jpg" /><div class="info"><p>' + item.title + '</p><p>播放：' + item.play_num + '</p></div></div>';
                $('.items').append(html);
            }
            break;
        }
        case 3: {
            for (var index = 0; index < data.categories.length; index++) {
                var item = data.categories[index];
                var html = '<div class="item"><img src="' + item.coverUrl + '@60w_60h.jpg" /><div class="info"><p>' + item.title + '</p><p>播放：' + item.playNum + '</p></div></div>';
                $('.items').append(html);
            }
            break;
        }
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
        case 'ArrowRight':
            tab(1);
            break;
        case 'ArrowLeft':
            tab(-1);
            break;
        case 'Enter':
            break;
        case 'Q':
        case 'SoftLeft':
            selectItem();
            break;
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
    if (next >= items.length)
        next = items.length - 1;
    else if (next < 0)
        next = 0;
    const targetElement = items[next];
    if (targetElement) {
        current = next;
        targetElement.focus();
        $('.item').removeClass('select');
        $(targetElement).addClass('select');
    }
}
function tab(move) {
    var currentIndex = parseInt($('.focus').attr('tabIndex'));
    var next = currentIndex + move;
    if (next > 4)
        next = 0;
    if (next < 0)
        next = 4;
    var items = document.querySelectorAll('li');
    var targetElement = items[next];
    if (targetElement) {
        $('.focus').attr("class", "");
        targetElement.className = "focus";
        tab_location = next;
        loadView();
    }
}