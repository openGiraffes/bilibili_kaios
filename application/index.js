
/*  通用函数  */
//添加视频项目
//房间初始化信息
var roominiturl = 'https://api.live.bilibili.com/room/v1/Room/room_init?id=' //直播间id：22966845
//首页推荐直播列表
var liverecomlisturl = 'https://api.live.bilibili.com/xlive/web-interface/v1/webMain/getList?platform=web'
//直播间信息
var roominfourl = 'https://api.live.bilibili.com/room/v1/Room/getRoomInfoOld?mid=' // 用户id：588626186
//设置cookie的url，防止接口报错
var setCookieUrl = 'https://data.bilibili.com/v/web/web_page_view'
//喜欢的菜单
var menulike = ['用户', '添加', '删除', '清空']
//直播的菜单
var menulive = ['用户', '添加直播间', '添加直播用户', '删除', '清空']
//跨域设置
$.ajaxSettings.xhr = function () {
  try {
    var xhr = new XMLHttpRequest({ mozSystem: true });
    return xhr;
  }
  catch (e) { console.log(e); }
};
function getById(id) {
  return document.getElementById(id);
}
var opened_VList = false;
//比较版本号
function compareVer(oldver, newver) {
  var a = oldver.split('.');
  var b = newver.split('.');
  for (var i = 0; i < a.length; i++) {
    var aa = parseInt(a[i]);
    var bb = parseInt(b[i]);
    if (bb > aa) {
      return true;
    }
    else if (bb === aa) {
      continue;
    }
    else if (bb < aa) {
      return false;
    }
  }
  return false;
}
function appendV(item, tabIndex) {
  $('.items').append("<div class='item' tabIndex='" + tabIndex + "' data-aid='" + item.aid + "' data-bvid='" + item.bvid + "' data-title='" + item.title + "' data-cid='" + item.cid + "'><img class='cover' src='" + item.pic + "@96w_60h.jpg" + "'/><div class='title'>" + item.title + "</div><div class='imgUP'>UP</div><div class='author'>" + item.author + "</div></div>")
}
//添加UP主
function appendA(uid, nick, sub, image, tabIndex) {
  image = image + '@60w_60h.jpg';
  $('.items').append("<div class='item' tabIndex='" + tabIndex + "' data-uid='" + uid + "' data-nick='" + nick + "'><img class='head' src='" + image + "'/><div class='title' style='left: 63px'>" + nick + ' (' + uid + ")</div><div class='author' style='left: 63px'>粉丝：" + sub + "</div></div>")
}
//添加直播
function appendZ(uid, nick, title, image, sub, tabIndex) {
  $('.items').append("<div class='item' tabIndex='" + tabIndex + "' data-uid='" + uid + "' data-title='" + title + "'><img class='head2' src='" + image + "@100w_60h.jpg" + "'/><div class='title' style='left: 110px'>" + title + "</div><div class='author' style='left: 106px'>" + nick + "&nbsp;&nbsp;在线：" + sub + "</div></div>")
}
//打开视频
function openV() {
  var currentIndex = document.activeElement.tabIndex;
  if (currentIndex < 0) {
    alert("请选择一个视频再选择播放！");
    return;
  }
  var item = $(document.querySelectorAll(".item")[currentIndex]);
  if (item) {
    var aid = item.data("aid");
    var bvid = item.data("bvid");
    var title = item.data("title");
    var cid = item.data("cid");
    var ref = {
      tab_location: tab_location,
      tabIndex: document.activeElement.tabIndex,
      nowuserid: nowuserid,
      opened_VList: opened_VList,
      lastLikeIndex: lastLikeIndex,
      nowpage: nowpage,
      searchdata: searchdata,
      searchPage: searchPage
    }
    window.location.href = './player/index.html?aid=' + aid + '&cid=' + cid + '&bvid=' + bvid + '&ref=' + escape(JSON.stringify(ref))
  } else {
    alert("读取不到选择的视频！");
    return;
  }
}
//加载搜索框
function loadSearch() {
  $('.items').empty();
  $('.items').append("<input id='searchInput' class='input' type='text' tabIndex='0' />");
  document.querySelectorAll('#searchInput')[0].focus();
}
//设置导航栏
function softkey(left, center, right) {
  $('#softkey-left').text(left);
  $('#softkey-center').text(center);
  $('#softkey-right').text(right);
}
/*  获取信息  */
//dict：方法（遍历时用于解析的列表：【标题，作者，配图，视频AV号，视频BV号】）（以item开头）
//each：遍历的位置（以result开头）
//获取视频列表
function getVList(error, data) {
  if (error) {
    alert(error);
  } else {
    if (data.code != 0) {
      alert(data.message);
      return;
    }
    $('.items').empty() //清空列已有的列表 
    $.each(data.data.list, function (r, item) {
      if (item.pic.substr(0, 2) == '//') {
        item.pic = 'http:' + item.pic;
      }
      appendV(item, r + '');
    })
    try {
      //对焦 
      if (document.querySelectorAll('.item')[lastHotIndex]) {
        document.querySelectorAll('.item')[lastHotIndex].focus();
      }
      else {
        document.querySelectorAll('.item')[0].focus();
      }
    } catch (err) {
      console.log(errr);
    }
  }
};
//获取视频列表
function getVList2(error, data) {
  if (error) {
    alert(error);
  } else {
    if (data.code != 0) {
      alert(data.message);
      return;
    }
    $('.items').empty() //清空列已有的列表
    $.each(data.data.list.vlist, function (r, item) {
      if (item.pic.substr(0, 2) == '//') {
        item.pic = 'http:' + item.pic;
      }
      appendV(item, r + '');
    });
    if (thisOpenVlist == true || lastOpened_VList) {
      //对焦  
      if (document.querySelectorAll('.item')[thisRef.tabIndex]) {
        document.querySelectorAll('.item')[thisRef.tabIndex].focus();
      }
    }
    else {
      //对焦 
      if (document.querySelectorAll('.item')[0]) {
        document.querySelectorAll('.item')[0].focus();
      }
    }
  }
};
//获取作者列表
function getAList() {
  $('.items').empty() //清空列已有的列表
  if (navigator.onLine == false) {
    $('.items').append('请连接互联网！');
    return;
  }
  $('.items').append('正在加载…') //展示加载信息
  var result = localStorage.getItem('like') //从本地获取信息 
  try {
    var result = JSON.parse(result)
  } catch (e) {
    localStorage.setItem('like', "[]")
    getAList()
  }
  $('.items').empty() //清空列已有的列表 
  $('.items').append('<p style="color:red;">新版在菜单列表中选择用户可进行查看账号关注的UP主~</p>');
  if (result.length == 0) {
    $('.items').append('<p>您还没有添加过UP主哦,按“选项>添加”添加试试</p>')
    return
  }
  //建立列表
  $.each(result, function (r, i) {
    appendA(i.uid, i.nick, i.sub, i.pic, r + '');
  })
  try {
    //对焦 
    if (document.querySelectorAll('.item')[lastLikeIndex]) {
      document.querySelectorAll('.item')[lastLikeIndex].focus();
    }
    else {
      document.querySelectorAll('.item')[0].focus();
    }
  } catch (err) {
    console.log(errr);
  }
};
//获取直播列表
function getZList() {
  $('.items').empty() //清空列已有的列表
  if (navigator.onLine == false) {
    $('.items').append('请连接互联网！');
    return;
  }
  $('.items').append('正在加载…') //展示加载信息
  try {
    var url = 'https://api.live.bilibili.com/xlive/app-interface/v1/relation/liveAnchor?actionKey=appkey&device=android&qn=0&sortRule=0&filterRule=0';
    var data = $.getApi(url, 'text');
    $('.items').empty(); //清空列已有的列表
    if (data != null && data.code == 0) {
      var result = data.data.rooms;
      if (result != null && result.length > 0) {
        //建立列表
        $.each(result, function (r, i) {
          appendZ(i.uid, i.uname, i.title, i.cover, i.online, r + '');
        })
        var index = 0;
        if (thisrefLiveIndex) {
          index = thisrefLiveIndex;
          thisrefLiveIndex = 0;
        }
        else if (lastliveIndex) {
          index = lastliveIndex;
        }
        //对焦
        if (document.querySelectorAll('.item')[index]) {
          document.querySelectorAll('.item')[index].focus();
        }
        else {
          if ($('.item').length > 0)
            document.querySelectorAll('.item')[0].focus();
        }
      }
      else {
        $('.items').append('关注的UP没有一个在直播qaq~');
      }
    }
  }
  catch (e) {
    console.log(e)
    getZList()
  }
};
function check_update(pack_name, version) {
  if ($.cookie('update_checked') == true) {
    return;
  }
  ajax = $.getJSON('https://sss.wmm521.cn/kaios/bilibili_ver.json?_=' + (new Date().getTime()), function (result) {
    var latest_version = result.version;
    if (compareVer(version, latest_version)) {
      if (confirm('【检测到新版本】\n版本号：' + latest_version + '\n是否下载新版本？')) {
        window.open(result.downloadUrl)
      }
    }
    $.cookie('update_checked', true)
  })
}
/*  D-Pad  */
//设置按键函数
function handleKeydown(e) {
  if (e.key != "EndCall") {
    e.preventDefault();//清除默认行为（滚动屏幕等）
  }
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
      if (isshowmenu) {
        showhideMenu();
        return;
      }
      if (opened_VList)
        load();
      else {
        if (confirm('是否退出哔哩哔哩?'))
          window.close();
      }
      break;
    case 'Q':
    case 'SoftLeft':
      if (tab_location != 4)
        refresh();
      else {
        var item = $('.item.select').attr('tabIndex');
        item = parseInt(item);
        switch (item) {
          case 0: {
            window.location.href = './bangmi/index.html?type=0';
            break;
          }
          case 1: {
            window.location.href = './bangmi/index.html?type=1';
            break;
          }
          case 2: {
            window.location.href = './lives/index.html';
            break;
          }
          case 3: {
            window.location.href = './music/index.html';
            break;
          }
          case 4: {
            window.location.href = './user/index.html';
            break;
          }
          case 5: {
            window.location.href = './setting/index.html';
            break;
          }
        }
      }
      break;
    case 'E':
    case 'SoftRight':
      SoftRight()
      break;
    case '0':
      if (confirm('您真的要初始化吗？\n这会丢失你所有的数据！')) {
        localStorage.setItem('like', "[]")
        localStorage.setItem('live', "[]")
        alert('已完成！');
      } else {
        alert('已取消！');
      }
      break;
    case '#':
      alert('By：白羊座的一只狼  修改 by zixing\n使用说明：\n1.此界面按0初始化\n2.播放界面按2增加音量\n3.播放界面按8降低音量');
      break;
  }
}
//设置导航键函数
var tab_location = 1;//设置header位置
function nav(move) {
  if (isshowmenu === 1) {
    var currentIndex = document.activeElement.tabIndex;
    var menulength = document.querySelectorAll('.menuitem').length;
    var next = currentIndex + move;
    if (next < 0) {
      next = menulength - 1;
    }
    else if (next >= menulength) {
      next = 0;
    }
    var items = document.querySelectorAll('.menuitem');
    var targetElement = items[next];
    if (targetElement) {
      targetElement.focus();
    }
  }
  else {
    var currentIndex = document.activeElement.tabIndex;
    var next = currentIndex + move;
    var items = document.querySelectorAll('.item');
    var targetElement = items[next];
    if (targetElement) {
      $('.item').removeClass('select');
      $(targetElement).addClass('select');
      targetElement.focus();
    }
    if (next == 0) {
      $('.items').scrollTop(0);
    }
  }
}
var day = 3;
function tab(move) {
  if (isshowmenu === 1) {
    return;
  }
  var currentIndex = parseInt($('.focus').attr('tabIndex')); //获取目前带有focus的元素的tabIndex
  if (currentIndex === 2) {
    lastLikeIndex = document.activeElement.tabIndex;
    lastOpened_VList = opened_VList;
    thisRef.tabIndex = document.activeElement.tabIndex;
  }
  else if (currentIndex === 1) {
    lastHotIndex = document.activeElement.tabIndex;
  }
  else if (currentIndex === 3) {
    lastliveIndex = document.activeElement.tabIndex;
  }
  else if (currentIndex === 4) {
    lastmoreIndex = document.activeElement.tabIndex;
  }
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
  load()
}
var ajax = null;
function load() {
  //关闭之前的ajax
  try {
    if (ajax) {
      ajax.abort();
    }
  } catch (e) { }
  var items = document.querySelectorAll('li'); //遍历所有的li元素
  var targetElement = items[tab_location]; //将位置与遍历结果对应
  if (targetElement != undefined) { //如果没有可供选择的目标
    $('.focus').attr("class", ""); //清除原有效果
    targetElement.className = "focus"; //设置新效果 
  }
  switch (tab_location) {
    case 0: //搜索 
      if (thisRef.searchdata) { //跳转的搜索数据 
        searchData();
      } else {
        loadSearch();
      }
      softkey('搜索', '播放', '下一页');
      break;
    case 1: //首页推荐
      $('.items').empty() //清空列已有的列表
      if (navigator.onLine == false) {
        $('.items').append('请连接互联网！');
        return;
      }
      $('.items').append('正在加载…') //展示加载信息 
      ajax = $.getJSON('https://api.bilibili.com/x/web-interface/ranking?/region?day=' + day, function (result) {
        if (result.code == 0) {
          getVList(false, result);
        } else {
          getVList(result.message, result);
        }
      })
      if (day === 3) {
        softkey('刷新', '播放', '七天热点');
      }
      else if (day === 7) {
        softkey('刷新', '播放', '三天热点');
      }
      break;
    case 2: //关注
      if (thisOpenVlist == true || lastOpened_VList) {
        ajax = $.getJSON('https://api.bilibili.com/x/space/arc/search?mid='
          + nowuserid
          + '&pn=' + nowpage, function (result) {
            if (result.code == 0) {
              getVList2(false, result);
            } else {
              getVList2(result.message, result);
            }
            thisOpenVlist = false;
            lastOpened_VList = false;
          })
        softkey('下一页', '播放', '返回');
        opened_VList = true
      } else {
        getAList()
        opened_VList = false //设置二级菜单状态
        softkey('刷新', '选择', '选项');
      }
      break;
    case 3: //直播
      getZList();
      softkey('刷新', '观看', '选项');
      break;
    case 4: {
      $('.items').empty();
      var rows = '<div tabIndex="0" class="item small">番剧</div>' +
        '<div tabIndex="1" class="item small">国创</div>' +
        '<div tabIndex="2" class="item small">直播分区</div>' +
        '<div tabIndex="3" class="item small">音乐</div>' +
        '<div tabIndex="4" class="item small">用户</div>' +
        '<div tabIndex="5" class="item small">设置</div>';
      $('.items').append(rows);
      softkey('选择', '', '选项');
      break;
    }
  }
}
function add() {
  switch (tab_location) {
    case 2: //关注
      var id = prompt('输入UID：') //弹框请用户输入数据
      if (id && id.match(/[a-z]/i) != null || id.match(/[`~!@#$%^&*()_\-+=<>?:"[]|,.\/;'\\[\]·~！@#￥%……&*（）——\-+=[]|《》？：“”【】、；‘'，。、]/i) != null) { //正则验证输入的内容 确保只输入数字
        alert('请输入数字！')
        return;
      }
      var data = localStorage.getItem('like'); //读取数据
      data = JSON.parse(data); //将字符串转换为JSON
      data.push({ uid: id }); //将数据添加到JSON
      localStorage.setItem('like', JSON.stringify(data)) //将数组转换后存储数据
      break;
    case 3: //直播
      var id = prompt('输入直播的房间号：') //弹框请用户输入数据
      if (id && id.match(/[a-z]/i) != null || id.match(/[`~!@#$%^&*()_\-+=<>?:"[]|,.\/;'\\[\]·~！@#￥%……&*（）——\-+=[]|《》？：“”【】、；‘'，。、]/i) != null) { //正则验证输入的内容 确保只输入数字
        alert('请输入数字！')
        return;
      }
      var data = localStorage.getItem('live'); //读取数据
      data = JSON.parse(data); //将字符串转换为JSON
      data.push({ room_id: id }); //将数据添加到JSON
      localStorage.setItem('live', JSON.stringify(data)) //将数组转换后存储数据
      break;
  }
  $('.items').empty() //展示加载信息
  $('.items').append('请等待…') //展示加载信息
  refresh(true) //及时刷新数据
  load()
}

function addByRoomID() {
  var id = prompt('输入直播的房间号：') //弹框请用户输入数据
  if (id && id.match(/[a-z]/i) != null || id.match(/[`~!@#$%^&*()_\-+=<>?:"[]|,.\/;'\\[\]·~！@#￥%……&*（）——\-+=[]|《》？：“”【】、；‘'，。、]/i) != null) { //正则验证输入的内容 确保只输入数字
    alert('请输入数字！')
    return;
  }
  var data = localStorage.getItem('live'); //读取数据
  data = JSON.parse(data); //将字符串转换为JSON
  data.push({ room_id: id }); //将数据添加到JSON
  localStorage.setItem('live', JSON.stringify(data)) //将数组转换后存储数据
  $('.items').empty() //展示加载信息
  $('.items').append('请等待…') //展示加载信息
  showhideMenu();
  refresh(true) //及时刷新数据
  load()
}
function addByUserId() {
  var id = prompt('输入直播的用户ID：') //弹框请用户输入数据
  if (id && id.match(/[a-z]/i) != null || id.match(/[`~!@#$%^&*()_\-+=<>?:"[]|,.\/;'\\[\]·~！@#￥%……&*（）——\-+=[]|《》？：“”【】、；‘'，。、]/i) != null) { //正则验证输入的内容 确保只输入数字
    alert('请输入数字！')
    return;
  }
  var data = localStorage.getItem('live'); //读取数据
  data = JSON.parse(data); //将字符串转换为JSON
  $.ajax({
    async: false,
    type: "GET",
    url: roominfourl + id,
    success: function (result) {
      if (result.data.roomid) {
        data.push({ room_id: result.data.roomid });
        localStorage.setItem('live', JSON.stringify(data)) //将数组转换后存储数据
        $('.items').empty() //展示加载信息
        $('.items').append('请等待…') //展示加载信息
        showhideMenu();
        refresh(true) //及时刷新数据
        load()
      }
      else {
        alert("该用户没有直播间！");
      }
    },
    error: function (result) {
      alert(JSON.stringify(result));
    },
    headers: {
      "Cookie": "bsource=search_baidu",
      "Referrer-Policy": "origin",
      "Referer": "https://www.bilibili.com"
    }
  });
}

var searchPage = 1;
var searchdata = "";
function searchData() {
  if (thisRef.searchPage) {
    searchPage = thisRef.searchPage;
    thisRef.searchPage = 0;
  }
  if (thisRef.searchdata) {
    searchdata = thisRef.searchdata;
    thisRef.searchdata = '';
  }
  if (searchPage === 1) {
    if (searchdata) { }
    else {
      if ($('#searchInput').val()) {
        var searchtext = $('#searchInput').val();
        if (searchtext == '') {
          alert("请输入搜索关键字");
          return;
        }
        else {
          searchdata = searchtext;
        }
      }
      else {
        load();
        return;
      }
    }
  }
  else {
    if (searchdata) { }
    else {
      searchPage = 1;
      var searchtext = $('#searchInput').val();
      if (searchtext == '') {
        alert("请输入搜索关键字");
        return;
      }
      else {
        searchdata = searchtext;
      }
    }
  }
  var searchurl = "https://api.bilibili.com/x/web-interface/search/type?keyword=" + searchdata + "&search_type=video&page=" + searchPage;
  ajax = $.getJSON(searchurl, function (result) {
    if (result.data.result) {
      $('.items').empty() //清空列已有的列表  
      $.each(result.data.result, function (r, item) {
        if (item.pic.substr(0, 2) == '//') {
          item.pic = 'http:' + item.pic;
        }
        appendV(item, r + '');
      })
      //对焦
      if (
        document.querySelectorAll('.item')[lastSearchIndex]) {
        document.querySelectorAll('.item')[lastSearchIndex].focus();
        lastSearchIndex = 0;
      }
      else {
        document.querySelectorAll('.item')[0].focus();
      }
    }
    else {
      alert("没有更多内容");
    }
  })
}

function refreshLive() {
  $.ajaxSettings.async = false; //临时设置为同步请求
  var data = localStorage.getItem('live'); //读取数据
  data = JSON.parse(data); //将字符串转换为JSON
  $.each(data, function (r, item) { //给每一个uid更新数据 
    ajax = $.getJSON(roominiturl + item.room_id, function (result) {  //获取房间信息
      if (result.code != 0) {
        data[r].uid = 0;
        data[r].nick = result.message;
        data[r].pic = '';
        data[r].sub = '0';
        return;
      }
      data[r].uid = result.data.uid;
      ajax = $.ajax({
        async: false,
        type: "GET",
        url: roominfourl + result.data.uid,
        success: function (result) {
          data[r].title = result.data.title;
          data[r].pic = result.data.cover;
          data[r].online = result.data.online;
        },
        headers: {
          "Cookie": "bsource=search_baidu"
        }
      });
    })
  })
  localStorage.setItem('live', JSON.stringify(data)) //将数组转换后存储数据
  $.ajaxSettings.async = true; //记得改回来
}

function refreshLike() {
  $.ajaxSettings.async = false; //临时设置为同步请求
  var data = localStorage.getItem('like'); //读取数据
  data = JSON.parse(data); //将字符串转换为JSON
  $.each(data, function (r, item) { //给每一个uid更新数据
    ajax = $.getJSON('https://api.bilibili.com/x/space/acc/info?mid=' + item.uid, function (result) {
      data[r].pic = result.data.face //头像
      data[r].nick = result.data.name //昵称
    })
    ajax = $.getJSON('https://api.bilibili.com/x/relation/stat?vmid=' + item.uid, function (result) {
      data[r].sub = result.data.follower //粉丝数
    })
  })
  localStorage.setItem('like', JSON.stringify(data)) //将数组转换后存储数据
  $.ajaxSettings.async = true; //记得改回来

}

function refresh(ignoremenu) {
  if (ignoremenu) {

  }
  else {
    if (isshowmenu) {
      selectMenu();
      return;
    }
    switch (tab_location) {
      case 1:
        lastHotIndex = 0;
        break;
      case 2:
        if ($('#softkey-left').text() === "刷新") {
          lastLikeIndex = 0;
          nowpage = 1;
          nowuserid = "";
        }
        break;
      case 0:
        searchdata = "";
        searchPage = 1;
        break;
    }
  }
  switch (tab_location) {
    case 0: //搜索
      searchPage = 1;
      searchData();
      break;
    case 1: //首页推荐
      load();
      break;
    case 2: //关注
      if ($('#softkey-left').text() === "刷新") {
        refreshLike();
        load();
      } else if ($('#softkey-left').text() === "下一页") {
        nowpage++;
        ajax = $.getJSON('https://api.bilibili.com/x/space/arc/search?mid='
          + nowuserid
          + '&pn=' + nowpage, function (result) {
            if (result.data.list.vlist.length > 0) {
              if (result.code == 0) {
                getVList2(false, result);
              } else {
                getVList2(result.message, result);
              }
            } else {
              alert("没有下一页了！");
              nowpage--;
            }
          })
        softkey('下一页', '播放', '返回');
      }
      break;
    case 3: //直播
      refreshLive();
      load();
      break;
  }
}

var nowuserid = "";
var nowpage = 1;
//最后选择的那个UP主
var lastLikeIndex = 0;
var lastOpened_VList = false;
//最后查看的热门视频
var lastHotIndex = 0;
var lastliveIndex = 0;
var lastmoreIndex = 0;

function enter() {
  if (isshowmenu) {
    selectMenu();
    return;
  }
  switch (tab_location) {
    case 0: //搜索
      var items = document.querySelectorAll(".item");
      if (items.length === 0 || document.activeElement.tabIndex < 0) {
        alert("请先选择一个视频！");
        return;
      };
      openV();
      break;
    case 1: //首页推荐
      var currentIndex = document.activeElement.tabIndex;
      if (currentIndex < 0) {
        alert("请先选择一个视频！");
        return;
      };
      lastHotIndex = currentIndex;
      openV();
      break;
    case 2: //关注 
      if (opened_VList == false) {
        var currentIndex = document.activeElement.tabIndex;
        lastLikeIndex = currentIndex;
        if (currentIndex < 0) {
          alert("请先选择一个UP主！");
          return;
        };
        nowuserid = $(document.querySelectorAll(".item")[currentIndex]).data("uid");
        nowpage = 1;
        ajax = $.getJSON('https://api.bilibili.com/x/space/arc/search?mid='
          + nowuserid
          + '&pn=' + nowpage, function (result) {
            if (result.code == 0) {
              getVList2(false, result);
            } else {
              getVList2(result.message, result);
            }
          })
        softkey('下一页', '播放', '返回');
        opened_VList = true
      } else {
        openV()
      }
      break;
    case 3: //直播
      var currentIndex = document.activeElement.tabIndex;
      if (currentIndex < 0) {
        alert("请选择一个直播再进行观看！");
        return;
      }
      var ref = {
        tab_location: tab_location,
        tabIndex: document.activeElement.tabIndex,
        nowuserid: nowuserid,
        opened_VList: opened_VList,
        lastLikeIndex: lastLikeIndex,
        nowpage: nowpage,
        searchdata: searchdata,
        searchPage: searchPage
      }
      var link = './live/index.html?uid=' + $(document.querySelectorAll(".item")[currentIndex]).data("uid") + '&ref=' + escape(JSON.stringify(ref));
      window.location.href = link;
      break;
  }
}
var isshowmenu = 0;
var lastl = "";
var lastm = "";
var lastr = "";
var lastindex = 0;
function setLastindex() {
  lastindex = document.activeElement.tabIndex;
  if (lastindex < 0) {
    lastindex = 0;
  }
}
function showhideMenu(menu) {
  if (isshowmenu === 0) {
    setLastindex();
    getById("menu").style.display = "block";
    lastl = $('#softkey-left').text();
    lastm = $('#softkey-center').text();
    lastr = $('#softkey-right').text();
    var str = "";
    for (var i = 0; i < menu.length; i++) {
      str += '<li class="menuitem" tabIndex="' + i + '">' + menu[i] + '</li>';
    }
    getById("menucontainer").innerHTML = str;
    var items = document.querySelectorAll('.menuitem');
    items[0].focus();
    softkey("选择", "确认", "返回");
    isshowmenu = 1;
  }
  else {
    try {
      isshowmenu = 0;
      getById("menu").style.display = "none";
      softkey(lastl, lastm, lastr);
      var items = document.querySelectorAll('.item');
      if (items[lastindex]) {
        items[lastindex].focus();
        items[lastindex].scrollIntoView(true);
      }
    }
    catch (err) {
      alert(err);
    }
  }
}
function ClearLike() {
  if (confirm('确定清空所有关注吗？')) {
    var result = result = [];
    localStorage.setItem('like', JSON.stringify(result)) //将数组转换后存储数据
    showhideMenu();
    load();
  }
}
function ClearLive() {
  if (confirm('确定清空所有直播吗？')) {
    var result = result = [];
    localStorage.setItem('live', JSON.stringify(result)) //将数组转换后存储数据
    showhideMenu();
    load();
  }
}
//取消关注用户
function UnLikeUser() {
  var item = $(document.querySelectorAll('.item')[lastindex]);
  if (item) {
    var uid = item.data('uid');
    var nick = item.data('nick');

    if (confirm('确定取消关注"' + nick + '"吗？')) {
      var result = localStorage.getItem('like') //从本地获取信息 
      try {
        result = JSON.parse(result)
      } catch (e) {
        result = [];
      }
      for (var i = 0; i < result.length; i++) {
        if (result[i].uid == uid) {
          result.splice(i, 1);
          i--;
        }
      }
      localStorage.setItem('like', JSON.stringify(result)) //将数组转换后存储数据
      showhideMenu();
      load();
    }
  }
}
//取消关注直播
function UnLikeLive() {
  var item = $(document.querySelectorAll('.item')[lastindex]);
  if (item) {
    var uid = item.data('uid');
    var title = item.data('title');

    if (confirm('确定取消关注"' + title + '"吗？')) {
      var result = localStorage.getItem('live') //从本地获取信息 
      try {
        result = JSON.parse(result)
      } catch (e) {
        result = [];
      }
      for (var i = 0; i < result.length; i++) {
        if (result[i].uid == uid) {
          result.splice(i, 1);
          i--;
        }
      }
      localStorage.setItem('live', JSON.stringify(result)) //将数组转换后存储数据
      showhideMenu();
      load();
    }
  }
}
function selectMenu() {
  var index = document.activeElement.tabIndex;
  var items = document.querySelectorAll('.menuitem');
  var item = items[index];
  if (item) {
    var menuname = $(item).text();//选中的菜单名称
    if (tab_location == 2) { //关注列表的菜单
      switch (menuname) {
        case "用户":
          LoginPage();
          break;
        case "添加":
          showhideMenu();
          add();
          break;
        case "删除":
          UnLikeUser();
          break;
        case "清空":
          ClearLike();
          break;
      }
    }
    else if (tab_location == 3) { //直播列表的菜单
      switch (menuname) {
        case "添加直播间":
          addByRoomID();
          break;
        case "添加直播用户":
          addByUserId();
          break;
        case "删除":
          UnLikeLive();
          break;
        case "清空":
          ClearLive();
          break;
        case "用户":
          LoginPage();
          break;
      }
    }
    tab_location
  }
}
function LoginPage() {
  window.location.href = './user/index.html';
}
function SoftRight() {
  switch (tab_location) {
    case 0: //搜索
      searchPage++;
      searchData()
      break;
    case 1: //首页推荐
      if (day === 3) {
        day = 7;
        load();
      }
      else if (day === 7) {
        day = 3;
        load();
      }
      break;
    case 2: //关注
      if (opened_VList) {
        load()
      } else {
        showhideMenu(menulike);
      }
      break;
    case 3: //直播
      showhideMenu(menulive);
      break;
  }
}
//设置触发器
document.activeElement.addEventListener('keydown', handleKeydown);

/*  刚开应用该干啥  */
//若第一次安装则初始化关注列表等信息
if (localStorage.getItem('like') == null || localStorage.getItem('live') == null) {
  localStorage.setItem('like', '')
  localStorage.setItem('live', '')
}

try {
  var subscription = localStorage.getItem('subscription')
  if (subscription) {
    //有旧版关注列表
    subscription = JSON.parse(subscription);
    var savesub = []
    for (var i = 0; i < subscription.uid.length; i++) {
      savesub.push({ uid: subscription.uid[i] });
    }
    localStorage.setItem('like', JSON.stringify(savesub));
    localStorage.setItem('subscription', '')
    refreshLike();
  }
  var studio = localStorage.getItem('studio')
  if (studio) {
    //有旧版直播列表
    studio = JSON.parse(studio);
    var savestu = []
    for (var i = 0; i < studio.uid.length; i++) {
      $.ajax({
        async: false,
        type: "GET",
        url: roominfourl + studio.uid[i],
        success: function (result) {
          if (result.data.roomid) {
            savestu.push({ room_id: result.data.roomid });
          }
        },
        headers: {
          "Cookie": "bsource=search_baidu"
        }
      });
    }
    localStorage.setItem('live', JSON.stringify(savestu)) //将数组转换后存储数据 
    localStorage.setItem('studio', '')
    refreshLive();
  }
}
catch (err) {
  alert(err);
}

thisRef = {}
thisOpenVlist = false;
thisrefLiveIndex = 0;
var lastSearchIndex = 0;
function parseRef() {
  thisRef = $.getQueryVar("ref")
  if (thisRef) {
    thisRef = JSON.parse(unescape(thisRef));
  }
  else {
    thisRef = {
      tab_location: tab_location,
      tabIndex: document.activeElement.tabIndex,
      nowuserid: nowuserid,
      opened_VList: opened_VList,
      lastLikeIndex: lastLikeIndex,
      nowpage: nowpage,
      searchdata: searchdata,
      searchPage: searchPage
    }
  }
  tab_location = thisRef.tab_location;
  lastHotIndex = thisRef.tabIndex;
  lastLikeIndex = thisRef.lastLikeIndex;
  nowpage = thisRef.nowpage;
  nowuserid = thisRef.nowuserid;
  thisOpenVlist = thisRef.opened_VList;
  thisrefLiveIndex = thisRef.tabIndex;
  lastSearchIndex = thisRef.tabIndex;
}
//检查更新
//check_update('app://kai.baiyang.bilibili', '1.6')  
parseRef()
//获取首页推荐 
load()
