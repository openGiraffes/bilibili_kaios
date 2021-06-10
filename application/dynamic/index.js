let last_parm = '', userId = 0, self = false;
let scrollHeight = 0;
$(function () {
    userId = $.getQueryVar('mid');
    if (userId === false)
        userId = $.getData('mid');
    self = userId == $.getData('mid');
    loadData();
    document.activeElement.addEventListener('keydown', handleKeydown);
});
function loadData() {
    if (self) {
        if (last_parm == '') {
            var url = 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new?type_list=268435455&uid=' + userId;
            var result = $.getApi(url);
            if (result.code == 0) {
                var cards = result.data.cards;
                if (cards != null) {
                    for (var index = 0; index < cards.length; index++)
                        addItem(cards[index]);
                    if (cards.length > 1)
                        last_parm = cards[cards.length - 1].desc.dynamic_id;
                }
            }
            else {
                alert('获取动态失败！' + result.message);
            }
        }
        else {
            var url = 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_history?offset_dynamic_id=' + last_parm + '&type_list=268435455&uid=' + userId;
            var result = $.getApi(url);
            if (result.code == 0) {
                var cards = result.data.cards;
                if (cards != null) {
                    for (var index = 0; index < cards.length; index++)
                        addItem(cards[index]);
                    if (cards.length > 1)
                        last_parm = cards[cards.length - 1].desc.dynamic_id;
                }
            }
            else {
                alert('获取动态失败！' + result.message);
            }
        }
    }
    else {
        var mid = $.getData('mid');
        var url = 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history?offset_dynamic_id=' + last_parm + '&visitor_uid=' +
            mid + '&host_uid=' + userId + '&need_top=1';
        var result = $.getApi(url);
        if (result.code == 0) {
            var cards = result.data.cards;
            if (cards != null) {
                for (var index = 0; index < cards.length; index++)
                    addItem(cards[index]);
                if (cards.length > 1)
                    last_parm = cards[cards.length - 1].desc.dynamic_id;
            }
        }
        else {
            alert('获取动态失败！' + result.message);
        }
    }
}
function addItem(item) {
    try {
        var dynamic_id = item.desc.dynamic_id;
        if ($('*[data-id="' + dynamic_id + '"]').length == 0) {
            var uname = '';
            if (item.desc.user_profile != null)
                uname = item.desc.user_profile.info.uname;
            else if (typeof item.season == "undefined" && item.season != null)
                uname = item.season.title;
            var html = '<div class="item" data-id="' + dynamic_id + '"><div class="user_info">' + uname + '</div>';
            var card = JSON.parse(item.card);
            switch (item.desc.type) {
                case 1: {
                    var content = card.item.content;
                    html += '<div class="content" data-type="1" data-id="' + dynamic_id + '"><div class="desc">' + content + '</div>';

                    html + '</div>';
                    break;
                }
                case 2: {
                    var desc = card.item.description;
                    var pictures = card.item.pictures;
                    html += '<div class="content" data-type="2" data-id="' + dynamic_id + '"><div class="desc">' + desc + '</div>';
                    if (pictures != null && pictures.length > 0) {
                        var src = buildImageGrid(pictures);
                        html += src;
                    }
                    html + '</div>';
                    break;
                }
                case 4: {
                    var content = card.item.content;
                    html += '<div class="content" data-type="4" data-id="' + dynamic_id + '"><div class="desc">' + content + '</div></div>';
                    break;
                }
                case 8: {
                    var aid = card.aid;
                    var cid = card.cid;
                    var bvid = item.desc.bvid;
                    var view = card.stat.view;
                    var danmaku = card.stat.danmaku;
                    html += '<div class="content" data-type="8" data-aid="' + aid + '" data-cid="' + cid + '" data-bvid="' + bvid + '"><div class="desc">' + card.desc
                        + '</div><div class="video"><img src="' + card.pic + '@96w_60h.jpg" /><div class="info"><p>' +
                        card.title + '</p><p>播放：' + view + '</p><p>弹幕：' + danmaku + '</p></div></div></div>';
                    break;
                }
                case 64: {
                    var id = card.id;
                    var view = card.stats.view;
                    var like = card.stats.like;
                    var cover = card.image_urls[0];
                    html += '<div class="content" data-type="64" data-id="' + id + '"><div class="video"><img src="' + cover + '@96w_60h.jpg" /><div class="info"><p>' +
                        card.title + '</p><p>浏览：' + view + '</p><p>点赞' + like + '</p></div></div></div>';
                    break;
                }
                case 256: {
                    var id = card.id;
                    var cover = card.cover;
                    html += '<div class="content" data-type="256" data-id="' + id + '"><div class="video"><img src="' + cover + '@96w_60h.jpg" /><div class="info"><p>' +
                        card.title + '</p></div></div></div>';
                    break;
                }
                case 512: {
                    var play = card.stat.play;
                    var id = card.season.season_id;
                    var danmaku = card.stat.danmaku;
                    var ts = parseFloat(card.player_info.expire_time + '000')
                    var dt = new Date(ts);
                    var time = dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate() + '  ' + dt.getHours() + ':' + dt.getMinutes() + '更新';
                    html += '<div class="content" data-type="512" data-id="' + id + '"><div class="desc">' + time + '</div><div class="video"><img src="' + card.season.cover +
                        '@96w_60h.jpg" /><div class="info"><p>' + card.card_show_title + '</p><p>播放：' + play + '</p><p>弹幕：' + danmaku + '</p></div></div></div>';
                    break;
                }
                case 2048: {
                    var title = card.sketch.title;
                    var desc = card.vest.desc_text;
                    var cover = card.sketch.cover_url;
                    var link = card.sketch.target_url;
                    html += '<div class="content" data-type="8" data-link="' + link + '"><div class="desc">' + desc + '</div><div class="video"><img src="' + cover
                        + '@96w_60h.jpg" /><div class="info"><p>' + title + '</p><p>' + card.sketch.desc_text + '</p></div></div></div>';
                    break;
                }
                default: {
                    html += '<div>不支持的类型:' + item.desc.type + '</div>';
                    break;
                }
            }
            html + '</div>';
            $('.items').append(html);
        }
    }
    catch (e) {
        console.log(e);
        console.log(card);
    }
}
function openLink() {
    const items = document.querySelectorAll('.item');
    const targetElement = items[current];
    var content = $(targetElement).find('.content');
    var type = $(content).attr('data-type');
    switch (parseInt(type)) {
        case 8: {
            var aid = $(content).attr('data-aid');
            var cid = $(content).attr('data-cid');
            var bvid = $(content).attr('data-bvid');
            window.location.href = '../player/index.html?aid=' + aid + '&cid=' + cid + '&bvid=' + bvid + '&type=dynamic';
            break;
        }
        case 64: {
            var id = $(content).attr('data-id');
            window.location.href = '../web/index.html?id=' + id;
            break;
        }
        case 256: {
            var id = $(content).attr('data-id');
            window.location.href = '../songinfo/index.html?id=' + id;
            break;
        }
        case 512: {
            var id = $(content).attr('data-id');
            window.location.href = '../bandetail/index.html?id=' + id;
            break;
        }
        case 2048: {
            var link = $(content).attr('data-link');
            sessionStorage.setItem('link', link);
            window.location.href = '../web/index.html';
            break;
        }
        default: {
            var id = $(content).attr('data-id');
            window.location.href = '../dydetail/index.html?id=' + id;
            break;
        }
    }
}
function buildImageGrid(pics) {
    var html = '<div class="grid ' + ((len == 3 || len > 4) ? 'row2' : 'row3') + '">';
    var len = pics.length, row2 = window.innerWidth / 2, row3 = window.innerWidth / 3;
    var cw = Math.floor((len == 3 || len > 4) ? row3 : row2);
    for (var index = 0; index < len; index++)
        html += '<img src="' + pics[index].img_src + '@96w_60h.jpg" style="max-width:' + cw + 'px" />';
    return html + '</div>';
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
            loadData();
            break;
        case 'Q':
        case 'SoftLeft':
            openLink();
            break;
        case 'E':
        case 'Backspace':
        case 'SoftRight':
            window.location.href = '../user/index.html';
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
        var h = $(targetElement).height();
        if (move > 0) {
            scrollTo(0, scrollHeight);
            scrollHeight += h;
        }
        else {
            scrollHeight -= h;
            scrollTo(0, scrollHeight);
        }
    }
}