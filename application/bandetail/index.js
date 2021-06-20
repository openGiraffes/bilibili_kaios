let id = '', season_type = 0;
var tab_location = 1;//设置header位置
$(function () {
    id = $.getQueryVar('id');
    if (id) {
        var url = 'https://api.bilibili.com/pgc/view/app/season?season_id=' + id;
        var result = $.getApi(url);
        if (result.code == 0) {
            $('#cover').attr('src', result.result.cover + '@192w_120h.jpg');
            $('#title').text(result.result.title);
            $('#play').text(result.result.stat.play);
            $('#focus').text(result.result.stat.followers);
            $('#time').text(result.result.new_ep.desc);
            setTimeout(function () {
                console.log(result.result.episodes)
                var episodes = result.result.episodes.sort(orderBy);
                season_type = result.result.type;
                if (episodes != null) {
                    for (var index = 0; index < episodes.length; index++) {
                        var html = '<div class="item" data-bid="' + episodes[index].bvid + '" data-aid="' + episodes[index].aid + '" data-cid="' + episodes[index].cid + '">'
                            + episodes[index].title + '</div>';
                        $('.items').append(html);
                    }
                }
            }, 80);
        }
        else {
            alert('获取番剧信息失败' + result.message);
        }
    }
    else {
        alert('获取番剧信息失败!');
        window.location.href = '../bangmi/index.html';
    }
    document.activeElement.addEventListener('keydown', handleKeydown);
});
function orderBy(item1, item2) {
    var v1 = parseInt(item1.ep_index);
    var v2 = parseInt(item2.ep_index);
    if (v1 < v2)
        return 1;
    else if (v1 > v2)
        return -1;
    else
        return 0;
}
function selectItem() {
    const items = document.querySelectorAll('.item');
    const targetElement = items[current];
    var aid = $(targetElement).attr('data-aid');
    var cid = $(targetElement).attr('data-cid');
    var bvid = $(targetElement).attr('data-bid');
    window.location.href = '../player/index.html?aid=' + aid + '&bvid=' + bvid + '&cid=' + cid + '&season_type=' + season_type + '&type=bandetail&id=' + id;
}
function load() {
    switch (tab_location) {
        case 0: {
            $('.items').hide();
            $('#container').show();
            break;
        }
        case 1: {
            $('.items').show();
            $('#container').hide();
            break;
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
        case 'SoftLeft':
            selectItem();
            break;
        case 'E':
        case 'Backspace':
        case 'SoftRight':
            window.location.href = '../bangmi/index.html';
            break;
    }
}
function tab(move) {
    var currentIndex = parseInt($('.focus').attr('tabIndex')); //获取目前带有focus的元素的tabIndex
    var next = currentIndex + move; //设置移动位置
    if (next > 1) {
        next = 0;
    }
    if (next < 0) {
        next = 1;
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
    if (next == 0)
        $('.items').scrollTop(0);
}