var thisRoomId = 0;
var tab_location = 0;
$(function () {
  document.activeElement.addEventListener('keydown', handleKeydown);
  makeLive(getLiveRoomNumer($.getQueryVar('uid')));
  $.listen(thisRoomId);
});

function makeLive(room_id) {
  thisRoomId = room_id;
  $.getJSON('https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=' + room_id +
    '&qn=80&platform=web&protocol=0,1&format=0,2&codec=0,1&ptype=8', function (result) {
      if (result.code != 0) {
        alert('获取直播地址失败！');
        return;
      };
      if (result.data.playurl_info) {
        var data = result.data.playurl_info.playurl.stream[0].format[0].codec[0];
        var url = data.url_info[0].host + data.base_url + data.url_info[0].extra;
        try {
          player = flvjs.createPlayer({
            type: 'flv',
            isLive: true,
            url: url
          });
          player.attachMediaElement(document.getElementById('player'));
          player.load();
          player.play();
        }
        catch (e) {
          console.log(e);
          alert('初始化播放器失败！');
        }
      }
      else {
        alert("直播不在进行中！");
      }
    })
}

function setData(name, sign, title) {
  $('.items').empty();
  $('.items').append("<div class='item' tabIndex='0'><p>主播名称：" + name + "</p></div> ");
  $('.items').append("<div class='item' tabIndex='1'><p>直播间标题：" + title + "</p></div> ")
  $('.items').append("<div class='item' tabIndex='2'><p>直播签名：" + sign + "</p></div> ");
  if (document.querySelectorAll('.item')[0]) {
    document.querySelectorAll('.item')[0].focus()
  }
}

function tab(move) {
  const currentIndex = parseInt($('.focus').attr('tabIndex'));
  var next = currentIndex + move;
  if (next > 1) {
    next = 0;
  }
  else if (next < 0) {
    next = 1;
  }
  const items = document.querySelectorAll('li');
  const targetElement = items[next];
  if (targetElement) {
    $('.focus').attr("class", "");
    targetElement.className = "focus";
    tab_location = next;
    if (tab_location == 0) {
      $('#softkey-left').text('全屏');
      $('#softkey-right').text('重新加载');
    }
    else if (tab_location == 1) {
      $('#softkey-left').text('刷新弹幕');
      $('#softkey-right').text('发送弹幕');
    }
    load();
  }
}

function appendComments(item, tabIndex) {
  var content = item.text;
  var uname = item.nickname;
  var ctime = item.timeline;
  $('.items').append('<div class="itemcomment" tabIndex="' + tabIndex + '"><div class="commenthead"> <div class="user-info"><p>' + uname
    + '</p><span>' + ctime + '</span></div> </div> <div class="comment"> <p>' + content + '</p></div></div>')
}

function getComments(page) {
  if (page) {

  }
  else {
    $('.items').empty();
    $('.items').append('正在加载…');
    commentpage = 1;
    page = 1;
  }
  url = 'https://api.live.bilibili.com/ajax/msg?roomid=' + thisRoomId;
  $.getJSON(url, function (result) {
    if (result.data.room) {
      $('.items').empty();
      $.each(result.data.room.reverse(), function (r, item) {
        appendComments(item, r + '');
      })
    }
    else {
      alert("没有获取到更多弹幕！");
      return;
    }
    if (document.querySelectorAll('.itemcomment')[0]) {
      document.querySelectorAll('.itemcomment')[0].focus()
    }
  }).fail(function (jqXHR, status, error) {
    alert(error + ",请求可能被拦截");
  });
}

function load() {
  switch (tab_location) {
    case 0:
      getLiveRoomNumer($.getQueryVar('uid'))
      var video = document.getElementById("player");
      if (video.paused == true) {
        $('#softkey-center').text('播放');
      }
      else {
        $('#softkey-center').text('暂停');
      }
      break;
    case 1:
      getComments();
      $('#softkey-center').text("查看")
      break;
  }
}

function nav(move) {
  if (tab_location === 0) {
    const currentIndex = document.activeElement.tabIndex;
    var next = currentIndex + move;
    const items = document.querySelectorAll('.item');
    if (next >= items.length) {
      next = items.length - 1;
    }
    else if (next < 0) {
      next = 0;
    }
    const targetElement = items[next];
    if (targetElement) {
      targetElement.focus();
      targetElement.scrollIntoView(true);
    }
    if (next == 0) {
      $('.items').scrollTop(0);
    }
  }
  else if (tab_location === 1) {
    const currentIndex = document.activeElement.tabIndex;
    var next = currentIndex + move;
    const items = document.querySelectorAll('.itemcomment');
    if (next >= items.length) {
      next = items.length - 1;
    }
    else if (next < 0) {
      next = 0;
    }
    const targetElement = items[next];
    if (targetElement) {
      targetElement.focus();
      targetElement.scrollIntoView(true);
    }
    if (next == 0) {
      $('.items').scrollTop(0);
    }
  }
}

function getLiveRoomNumer(uid) {
  var id, link = 'https://api.bilibili.com/x/space/acc/info?mid=' + uid;
  $.ajax({
    url: link,
    async: false,
    success: function (result) {
      id = result.data.live_room.roomid.toString();
      var name = result.data.name;
      var sign = result.data.sign;
      var title = result.data.live_room.title;
      setData(name, sign, title);
    }
  });
  return id;
}

function fullscreen(value) {
  if (value == false) {
    document.exitFullscreen();
    $('#player').attr('class', 'player');
  }
  else if (value == true) {
    document.documentElement.requestFullscreen();
    $('#player').attr('class', 'player_fullscreen');
  }
}

function enter() {
  if ($('#softkey-center').text() === '查看') {
    var items = document.querySelectorAll('.comment');
    var targetElement = items[document.activeElement.tabIndex];
    if (targetElement)
      alert($(targetElement).text());
  }
  else {
    if (document.getElementById('player').paused == true) {
      document.getElementById('player').play();
      $('#softkey-center').text('暂停');
    }
    else {
      document.getElementById('player').pause();
      $('#softkey-center').text('播放');
    }
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
    case 'Enter':
      enter();
      break;
    case 'Backspace':
      window.location.href = '../index.html?ref=' + $.getQueryVar('ref')
      break;
    case 'Q':
    case 'SoftLeft':
      if (tab_location === 0) {
        var v = $('#player').attr('class') == 'player';
        fullscreen(v);
      }
      else if (tab_location === 1) {
        getComments();
      }
      break;
    case 'E':
    case 'SoftRight':
      if (tab_location === 0) {
        location.reload();
      }
      else {
        var text = prompt("请输入弹幕内容", "");
        if (text != '') {
          var result = $.sendLiveDanmaku(thisRoomId, text);
          if (result.code != 0)
            alert('发送弹幕失败！' + result.message);
        }
      }
      break;
    case '2':
      navigator.volumeManager.requestUp();
      break;
    case '8':
      navigator.volumeManager.requestDown();
      break;
  }
}