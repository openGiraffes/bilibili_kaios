var thisRef = {};
var thisrefLiveIndex = 0, lastSearchIndex = 0, day = 3, nowpage = 1, lastHotIndex = 0;
var lastliveIndex = 0, lastmoreIndex = 0, isshowmenu = 0, lastindex = 0, searchPage = 1, tab_location = 1;
var lastl = "", lastm = "", lastr = "",  searchdata = "";
var ajax = null;
var roominfourl = "https://api.live.bilibili.com/room/v1/Room/getRoomInfoOld?mid=";
var setCookieUrl = "https://data.bilibili.com/v/web/web_page_view";
var menu = ["用户", "设置", "退出"];
$(function () {
  document.activeElement.addEventListener("keydown", handleKeydown);
  thisRef = $.getQueryVar("ref");
  if (thisRef) {
    thisRef = JSON.parse(unescape(thisRef));
  }
  else {
    thisRef = {
      tab_location: tab_location,
      tabIndex: document.activeElement.tabIndex,
      nowpage: nowpage,
      searchdata: searchdata,
      searchPage: searchPage,
    };
  }
  tab_location = thisRef.tab_location;
  lastHotIndex = thisRef.tabIndex;
  nowpage = thisRef.nowpage;
  thisrefLiveIndex = thisRef.tabIndex;
  lastSearchIndex = thisRef.tabIndex;
  load();
});

function appendV(item, tabIndex) {
  $(".items").append(
    "<div class='item' tabIndex='" +
    tabIndex +
    "' data-aid='" +
    item.aid +
    "' data-bvid='" +
    item.bvid +
    "' data-title='" +
    item.title +
    "' data-cid='" +
    item.cid +
    "'><img class='cover' src='" +
    item.pic +
    "@96w_60h.jpg" +
    "'/><div class='title'>" +
    item.title +
    "</div><div class='imgUP'>UP</div><div class='author'>" +
    item.author +
    "</div></div>"
  );
}
//添加直播
function appendZ(uid, nick, title, image, sub, tabIndex) {
  $(".items").append(
    "<div class='item' tabIndex='" +
    tabIndex +
    "' data-uid='" +
    uid +
    "' data-title='" +
    title +
    "'><img class='head2' src='" +
    image +
    "@100w_60h.jpg" +
    "'/><div class='title' style='left: 110px'>" +
    title +
    "</div><div class='author' style='left: 106px'>" +
    nick +
    "&nbsp;&nbsp;在线：" +
    sub +
    "</div></div>"
  );
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
    var cid = item.data("cid");
    var ref = {
      tab_location: tab_location,
      tabIndex: document.activeElement.tabIndex,
      nowpage: nowpage,
      searchdata: searchdata,
      searchPage: searchPage,
    };
    window.location.href = "./player/index.html?aid=" + aid + "&cid=" + cid + "&bvid=" + bvid + "&ref=" + escape(JSON.stringify(ref));
  }
  else {
    alert("读取不到选择的视频！");
    return;
  }
}

//加载搜索框
function loadSearch() {
  $(".items").empty();
  $(".items").append("<input id='searchInput' class='input' type='text' tabIndex='0' />");
  document.querySelectorAll("#searchInput")[0].focus();
}

//设置导航栏
function softkey(left, center, right) {
  $("#softkey-left").text(left);
  $("#softkey-center").text(center);
  $("#softkey-right").text(right);
}

//获取视频列表
function getVList(error, data) {
  if (error) {
    alert(error);
  }
  else {
    if (data.code != 0) {
      alert(data.message);
      return;
    }
    $(".items").empty();
    $.each(data.data.list, function (r, item) {
      if (item.pic.substr(0, 2) == "//")
        item.pic = "http:" + item.pic;
      appendV(item, r + "");
    });
    try {
      if (document.querySelectorAll(".item")[lastHotIndex]) {
        document.querySelectorAll(".item")[lastHotIndex].focus();
      }
      else {
        document.querySelectorAll(".item")[0].focus();
      }
    } catch (err) {
      console.log(errr);
    }
  }
}

//获取视频列表
function getVList2(error, data) {
  if (error) {
    alert(error);
  } else {
    if (data.code != 0) {
      alert(data.message);
    }
    else {
      $(".items").empty();
      $.each(data.data.list.vlist, function (r, item) {
        if (item.pic.substr(0, 2) == "//")
          item.pic = "http:" + item.pic;
        appendV(item, r + "");
      });
      if (document.querySelectorAll(".item")[0]) {
        document.querySelectorAll(".item")[0].focus();
      }
    }
  }
}

//获取直播列表
function getZList() {
  $(".items").empty();
  if (navigator.onLine == false) {
    $(".items").append("请连接互联网！");
    return;
  }
  $(".items").append("正在加载…");
  try {
    var url =
      "https://api.live.bilibili.com/xlive/app-interface/v1/relation/liveAnchor?actionKey=appkey&device=android&qn=0&sortRule=0&filterRule=0";
    var data = $.getApi(url, "text");
    $(".items").empty();
    if (data != null && data.code == 0) {
      var result = data.data.rooms;
      if (result != null && result.length > 0) {
        //建立列表
        $.each(result, function (r, i) {
          appendZ(i.uid, i.uname, i.title, i.cover, i.online, r + "");
        });
        var index = 0;
        if (thisrefLiveIndex) {
          index = thisrefLiveIndex;
          thisrefLiveIndex = 0;
        }
        else if (lastliveIndex) {
          index = lastliveIndex;
        }
        if (document.querySelectorAll(".item")[index]) {
          document.querySelectorAll(".item")[index].focus();
        }
        else {
          if ($(".item").length > 0)
            document.querySelectorAll(".item")[0].focus();
        }
      }
      else {
        $(".items").append("关注的UP没有一个在直播qaq~");
      }
    }
  } catch (e) {
    console.log(e);
    getZList();
  }
}

function handleKeydown(e) {
  if (e.key != "EndCall") {
    e.preventDefault();
  }
  switch (e.key) {
    case "ArrowUp":
      nav(-1);
      break;
    case "ArrowDown":
      nav(1);
      break;
    case "ArrowRight":
      tab(1);
      break;
    case "ArrowLeft":
      tab(-1);
      break;
    case "Enter":
      enter();
      break;
    case "Backspace":
      if (isshowmenu) {
        showhideMenu();
        return;
      }
      if (confirm("是否退出哔哩哔哩?"))
        window.close();
      break;
    case "Q":
    case "SoftLeft":
      if (tab_location != 3)
        refresh();
      else {
        var item = $(".item.select").attr("tabIndex");
        item = parseInt(item);
        switch (item) {
          case 0: {
            window.location.href = "./bangmi/index.html?type=0";
            break;
          }
          case 1: {
            window.location.href = "./bangmi/index.html?type=1";
            break;
          }
          case 2: {
            window.location.href = "./livelist/index.html";
            break;
          }
          case 3: {
            window.location.href = "./music/index.html";
            break;
          }
          case 4: {
            window.location.href = "./user/index.html";
            break;
          }
          case 5: {
            window.location.href = "./setting/index.html";
            break;
          }
        }
      }
      break;
    case "E":
    case "SoftRight":
      SoftRight();
      break;
    case "#":
      window.location.href = "./about/index.html";
      break;
  }
}

//设置导航键函数
function nav(move) {
  if (isshowmenu === 1) {
    var currentIndex = document.activeElement.tabIndex;
    var menulength = document.querySelectorAll(".menuitem").length;
    var next = currentIndex + move;
    if (next < 0) {
      next = menulength - 1;
    } else if (next >= menulength) {
      next = 0;
    }
    var items = document.querySelectorAll(".menuitem");
    var targetElement = items[next];
    if (targetElement) {
      targetElement.focus();
    }
  } else {
    var currentIndex = document.activeElement.tabIndex;
    var next = currentIndex + move;
    var items = document.querySelectorAll(".item");
    var targetElement = items[next];
    if (targetElement) {
      $(".item").removeClass("select");
      $(targetElement).addClass("select");
      targetElement.focus();
    }
    if (next == 0) {
      $(".items").scrollTop(0);
    }
  }
}


function tab(move) {
  if (isshowmenu === 1) {
    return;
  }
  var currentIndex = parseInt($(".focus").attr("tabIndex"));
  if (currentIndex === 1) 
    lastHotIndex = document.activeElement.tabIndex;
  else if (currentIndex === 2) 
    lastliveIndex = document.activeElement.tabIndex;
  var next = currentIndex + move;
  if (next > 3) 
    next = 0;
  if (next < 0) 
    next = 3;
  var items = document.querySelectorAll("li");
  var targetElement = items[next];
  if (targetElement != undefined) {
    $(".focus").attr("class", "");
    targetElement.className = "focus";
    tab_location = next;
    load();
  }
}

function load() {
  try {
    if (ajax) {
      ajax.abort();
    }
  } catch (e) { }
  var items = document.querySelectorAll("li");
  var targetElement = items[tab_location];
  if (targetElement != undefined) {
    $(".focus").attr("class", "");
    targetElement.className = "focus";
  }
  switch (tab_location) {
    case 0: {
      if (thisRef.searchdata) {
        searchData();
      } else {
        loadSearch();
      }
      softkey("搜索", "播放", "下一页");
      break;
    }
    case 1: {
      $(".items").empty();
      if (navigator.onLine == false) {
        $(".items").append("请连接互联网！");
        return;
      }
      $(".items").append("正在加载…");
      ajax = $.getJSON("https://api.bilibili.com/x/web-interface/ranking?/region?day=" + day,
        function (result) {
          if (result.code == 0) {
            getVList(false, result);
          }
          else {
            getVList(result.message, result);
          }
        }
      );
      if (day === 3) {
        softkey("刷新", "播放", "七天热点");
      }
      else if (day === 7) {
        softkey("刷新", "播放", "三天热点");
      }
      break;
    }
    case 2: {
      getZList();
      softkey("刷新", "观看", "选项");
      break;
    }
    case 3: {
      $(".items").empty();
      var rows =
        '<div tabIndex="0" class="item small">番剧</div>' +
        '<div tabIndex="1" class="item small">国创</div>' +
        '<div tabIndex="2" class="item small">直播分区</div>' +
        '<div tabIndex="3" class="item small">音乐</div>' +
        '<div tabIndex="4" class="item small">用户</div>' +
        '<div tabIndex="5" class="item small">设置</div>';
      $(".items").append(rows);
      softkey("选择", "", "选项");
      break;
    }
  }
}

function searchData() {
  if (thisRef.searchPage) {
    searchPage = thisRef.searchPage;
    thisRef.searchPage = 0;
  }
  if (thisRef.searchdata) {
    searchdata = thisRef.searchdata;
    thisRef.searchdata = "";
  }
  if (searchPage === 1) {
    if (searchdata) {
    } else {
      if ($("#searchInput").val()) {
        var searchtext = $("#searchInput").val();
        if (searchtext == "") {
          alert("请输入搜索关键字");
          return;
        } else {
          searchdata = searchtext;
        }
      } else {
        load();
        return;
      }
    }
  } else {
    if (searchdata) {
    } else {
      searchPage = 1;
      var searchtext = $("#searchInput").val();
      if (searchtext == "") {
        alert("请输入搜索关键字");
        return;
      } else {
        searchdata = searchtext;
      }
    }
  }
  var searchurl =
    "https://api.bilibili.com/x/web-interface/search/type?keyword=" +
    searchdata +
    "&search_type=video&page=" +
    searchPage;

  $.ajax({
    url: searchurl,
    type: "GET",
    beforeSend: function (request) {
      request.setRequestHeader("cookie", "buvid3=qwerty")
    },
    success: function (result) {
      if (result.data.result) {
        $(".items").empty();
        $.each(result.data.result, function (r, item) {
          if (item.pic.substr(0, 2) == "//") {
            item.pic = "http:" + item.pic;
          }
          appendV(item, r + "");
        });
        if (document.querySelectorAll(".item")[lastSearchIndex]) {
          document.querySelectorAll(".item")[lastSearchIndex].focus();
          lastSearchIndex = 0;
        } else {
          document.querySelectorAll(".item")[0].focus();
        }
      } else {
        alert("没有更多内容");
      }
    },
    error: function () {},
    complete: function () {}
  })
}

function refreshLive() {
  $.ajaxSettings.async = false;
  var data = localStorage.getItem("live");
  data = JSON.parse(data);
  $.each(data, function (r, item) {
    ajax = $.getJSON("https://api.live.bilibili.com/room/v1/Room/room_init?id=" + item.room_id, function (result) {
      if (result.code != 0) {
        data[r].uid = 0;
        data[r].nick = result.message;
        data[r].pic = "";
        data[r].sub = "0";
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
          Cookie: "bsource=search_baidu",
        },
      });
    });
  });
  localStorage.setItem("live", JSON.stringify(data)); //将数组转换后存储数据
  $.ajaxSettings.async = true; //记得改回来
}

function refreshLike() {
  $.ajaxSettings.async = false;
  var data = localStorage.getItem("like");
  data = JSON.parse(data);
  $.each(data, function (r, item) {
    ajax = $.getJSON(
      "https://api.bilibili.com/x/space/acc/info?mid=" + item.uid,
      function (result) {
        data[r].pic = result.data.face;
        data[r].nick = result.data.name;
      }
    );
    ajax = $.getJSON(
      "https://api.bilibili.com/x/relation/stat?vmid=" + item.uid,
      function (result) {
        data[r].sub = result.data.follower;
      }
    );
  });
  localStorage.setItem("like", JSON.stringify(data));
  $.ajaxSettings.async = true;
}

function refresh(ignoremenu) {
  if (!ignoremenu) {
    if (isshowmenu) {
      selectMenu();
      return;
    }
    switch (tab_location) {
      case 0:
        searchdata = "";
        searchPage = 1;
        break;
      case 1:
        lastHotIndex = 0;
        break;
    }
  }
  switch (tab_location) {
    case 0:
      searchPage = 1;
      searchData();
      break;
    case 1:
      load();
      break;
    case 2:
      refreshLive();
      load();
      break;
  }
}

function enter() {
  if (isshowmenu) {
    selectMenu();
    return;
  }
  switch (tab_location) {
    case 0:
      var items = document.querySelectorAll(".item");
      if (items.length === 0 || document.activeElement.tabIndex < 0) {
        alert("请先选择一个视频！");
        return;
      }
      openV();
      break;
    case 1:
      var currentIndex = document.activeElement.tabIndex;
      if (currentIndex < 0) {
        alert("请先选择一个视频！");
        return;
      }
      lastHotIndex = currentIndex;
      openV();
      break;
    case 2:
      var currentIndex = document.activeElement.tabIndex;
      if (currentIndex < 0) {
        alert("请选择一个直播再进行观看！");
        return;
      }
      var ref = {
        tab_location: tab_location,
        tabIndex: document.activeElement.tabIndex,
        nowpage: nowpage,
        searchdata: searchdata,
        searchPage: searchPage,
      };
      var link = "./live/index.html?uid=" + $(document.querySelectorAll(".item")[currentIndex]).data("uid") + "&ref=" + escape(JSON.stringify(ref));
      window.location.href = link;
      break;
  }
}

function setLastindex() {
  lastindex = document.activeElement.tabIndex;
  if (lastindex < 0)
    lastindex = 0;
}

function showhideMenu(menu) {
  if (isshowmenu === 0) {
    setLastindex();
    $.getById("menu").style.display = "block";
    lastl = $("#softkey-left").text();
    lastm = $("#softkey-center").text();
    lastr = $("#softkey-right").text();
    var str = "";
    for (var i = 0; i < menu.length; i++)
      str += '<li class="menuitem" tabIndex="' + i + '">' + menu[i] + "</li>";
    $.getById("menucontainer").innerHTML = str;
    var items = document.querySelectorAll(".menuitem");
    items[0].focus();
    softkey("选择", "确认", "返回");
    isshowmenu = 1;
  }
  else {
    try {
      isshowmenu = 0;
      $.getById("menu").style.display = "none";
      softkey(lastl, lastm, lastr);
      var items = document.querySelectorAll(".item");
      if (items[lastindex]) {
        items[lastindex].focus();
        items[lastindex].scrollIntoView(true);
      }
    } catch (err) {
      alert(err);
    }
  }
}

function selectMenu() {
  var index = document.activeElement.tabIndex;
  var items = document.querySelectorAll(".menuitem");
  var item = items[index];
  if (item) {
    var menuname = $(item).text();
    switch (menuname) {
      case "用户":
        window.location.href = "./user/index.html";
        break;
      case "设置":
        window.location.href = "./setting/index.html";
        break;
      case "退出":
        if (confirm('是否退出？'))
          window.close();
        break;
    }
  }
}

function SoftRight() {
  switch (tab_location) {
    case 0:
      searchPage++;
      searchData();
      break;
    case 1:
      if (day === 3)
        day = 7;
      else if (day === 7)
        day = 3;
      load();
      break;
    default:
      showhideMenu(menu);
      break;
  }
}