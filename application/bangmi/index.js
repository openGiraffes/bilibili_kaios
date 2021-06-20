var page = 1, type = 0;
var data = null;
var tab_location = 1;//设置header位置
$(function () {
    type = $.getQueryVar('type');
    type = parseInt(type);
    myFollow();
    homeData();
    document.activeElement.addEventListener('keydown', handleKeydown);
});
function load() {
    $('.items').empty();
    switch (tab_location) {
        case 0: {
            myFollow();
            break;
        }
        case 1: {
            var arr = data.today;
            if (data != null && arr != null) {
                for (var index = 0; index < arr.length; index++) {
                    var html = '<div class="item" data-id="' + arr[index].season_id + '"><img src="' + arr[index].cover + '@96w_60h.jpg" /><p>' + arr[index].title + '</p><p>'
                        + arr[index].pub_index + '</p></div>';
                    $('.items').append(html);
                }
            }
            break;
        }
        case 2: {
            var arr = data.ranks;
            if (data != null && arr != null) {
                for (var index = 0; index < arr.length; index++) {
                    var html = '<div class="item" data-id="' + arr[index].season_id + '"><img src="' + arr[index].cover + '@96w_60h.jpg" /><p>' + arr[index].title + '</p><p>'
                        + arr[index].index_show + '</p></div>';
                    $('.items').append(html);
                }
            }
            break;
        }
        case 3: {
            var arr = data.hots;
            if (data != null && arr != null) {
                for (var index = 0; index < arr.length; index++) {
                    var html = '<div class="item" data-id="' + arr[index].season_id + '"><img src="' + arr[index].cover + '@96w_60h.jpg" /><p>' + arr[index].title + '</p><p>'
                        + arr[index].index_show + '</p></div>';
                    $('.items').append(html);
                }
            }
            break;
        }
    }
}
function homeData() {
    var url = type == 0 ? 'http://biliapi.iliili.cn/api/anime/bangumi' : 'http://biliapi.iliili.cn/api/anime/guochuang';
    $.get(url, function (result) {
        if (result.code == 0) {
            data = result.data;
        }
    });
}
function myFollow() {
    var url = 'http://bangumi.bilibili.com/api/get_concerned_season?page=' + page + '&pagesize=9';
    var result = $.getApi(url);
    if (result.code == 0) {
        var arr = result.result;
        if (arr != null) {
            for (var index = 0; index < arr.length; index++) {
                var html = '<div class="item" data-id="' + arr[index].season_id + '"><img src="' + arr[index].cover + '@96w_60h.jpg" /><p>' + arr[index].title + '</p><p>'
                    + arr[index].update_pattern + '</p></div>';
                $('.items').append(html);
            }
        }
    }
}
function handleKeydown(e) {
    $.clearEvent(e);
    switch (e.key) {
        case 'ArrowRight':
            tab(1);
            break;
        case 'ArrowLeft':
            tab(-1);
            break;
        case 'ArrowUp':
            nav(-1);
            break;
        case 'ArrowDown':
            nav(1);
            break;
        case 'Q':
        case 'SoftLeft': {
            const items = document.querySelectorAll('.item');
            const targetElement = items[current];
            var id = $(targetElement).attr('data-id');
            window.location.href = '../bandetail/index.html?id=' + id;
            break;
        }
        case 'E':
        case 'Backspace':
        case 'SoftRight':
            window.location.href = '../index.html';
            break;
    }
}
function tab(move) {
    var currentIndex = parseInt($('.focus').attr('tabIndex')); //获取目前带有focus的元素的tabIndex
    var next = currentIndex + move; //设置移动位置
    if (next > 4) {
        next = 0;
    }
    if (next < 0) {
        next = 4;
    }
    var items = document.querySelectorAll('li'); //遍历所有的li元素
    var targetElement = items[next]; //将位置与遍历结果对应
    if (targetElement == undefined) { //如果没有可供选择的目标
        return; //中止函数
    }
    $('.focus').attr("class", ""); //清除原有效果
    targetElement.className = "focus"; //设置新效果
    tab_location = next;
    load();
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