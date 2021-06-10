let userId = 0, total = 0, page = 1;

$(function () {
    var id = $.getData('mid');
    if (typeof id != 'undefined' && id != null && id != '') {
        userId = parseInt(id);
        loadFollow();
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
            const items = document.querySelectorAll('.item');
            const targetElement = items[current];
            window.location.href = '../user/index.html?mid=' + $(targetElement).attr('data-mid');
            break;
        case 'Enter':
            page++;
            loadFollow();
            break;
        case 'E':
        case 'Backspace':
        case 'SoftRight':
            window.location.href = '../user/index.html?mid=' + userId;
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

function loadFollow() {
    var url = 'https://api.bilibili.com/x/relation/followings?vmid=' + userId + '&ps=30&pn=' + page + '&order=desc';
    var result = $.getApi(url);
    if (result.code == 0) {
        var arr = result.data.list;
        total = result.data.total;
        for (var index = 0; index < arr.length; index++) {
            var item = '<div data-mid=' + arr[index].mid + ' class="item"><img src="' + arr[index].face + '@36w_36h.jpg"><label class="name">' + arr[index].uname
                + '</label><label class="sign">' + arr[index].sign + '</label></div>';
            $('#container').append(item);
        }
    }
    else {
        alert('加载关注列表失败!' + result.message);
    }
}