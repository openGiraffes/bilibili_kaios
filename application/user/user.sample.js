/**
 * 安全的测试方式：
 * 
 * 如需测试，请在这里填写账号和密码，
 * 并将文件名修改为 user.js
 */


function loaduserfromfile() {
    var user = {
        "user": "",
        "pwd": ""
    };
    document.getElementById('name').value = user.user;
    document.getElementById('pwd').value = user.pwd;
}