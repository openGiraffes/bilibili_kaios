const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../application/app.js'), 'utf8');

function boot({ system = false, hostname = '', protocol = 'app:', throws = false } = {}) {
    const filters = [];
    const warnings = [];
    const $ = {
        ajaxSettings: {},
        ajaxPrefilter: filter => filters.push(filter),
        extend: function (target, ...others) {
            return others.length ? Object.assign(target, ...others) : Object.assign(this, target);
        }
    };
    function XMLHttpRequest(options) {
        if (throws && options) throw new Error('Unsupported constructor options');
        this.mozSystem = system && !!(options && options.mozSystem);
    }
    vm.runInNewContext(source, {
        $, XMLHttpRequest, window: { location: { hostname, protocol } },
        console: { warn: message => warnings.push(message) }
    });
    return { $, filters, warnings, filter: filters[0] };
}

test('System XHR keeps signed URLs and POST bodies and supplies Bilibili headers', () => {
    const { $, filter, filters } = boot({ system: true });
    const url = 'https://passport.bilibili.com/login?sign=abc&keyword=a%26b';
    const beforeSend = () => false;
    const options = { url, data: 'auth_code=a%2Bb&sign=xyz', type: 'POST', beforeSend,
        headers: { Cookie: 'session=test', 'User-Agent': 'custom-client' } };
    filter(options);
    assert.equal(options.url, url);
    assert.equal(options.data, 'auth_code=a%2Bb&sign=xyz');
    assert.equal(options.headers.Referer, 'https://www.bilibili.com/');
    assert.equal(options.headers.Origin, 'https://www.bilibili.com');
    assert.equal(options.headers['User-Agent'], 'custom-client');
    assert.equal(options.headers.Cookie, 'session=test');
    assert.equal(options.beforeSend, beforeSend);
    assert.equal($.ajaxSettings.xhr().mozSystem, true);
    $.initApi();
    assert.equal(filters.length, 1);
});

test('default User-Agent is present for bare getJSON requests', () => {
    const { filter } = boot({ system: true });
    const options = { url: 'https://api.live.bilibili.com/room/v1/Room/room_init?id=1' };
    filter(options);
    assert.match(options.headers['User-Agent'], /Mozilla/);
});

test('actual System XHR capability takes priority over localhost URL', () => {
    const { filter } = boot({ system: true, hostname: 'localhost', protocol: 'http:' });
    const options = { url: 'https://api.bilibili.com/x/web-interface/nav' };
    filter(options);
    assert.match(options.url, /^https:/);
    assert.ok(options.headers.Referer);
});

test('local browser preserves query, cookie forwarding, callback context and cancellation', () => {
    const { $, filter } = boot({ hostname: '127.0.0.1', protocol: 'http:', throws: true });
    const context = {};
    const options = {
        url: 'https://api.bilibili.com/search?keyword=a%26b&sign=abc',
        beforeSend(request, settings) {
            assert.equal(this, context);
            assert.equal(settings, options);
            request.setRequestHeader('Cookie', 'buvid3=test');
            request.setRequestHeader('User-Agent', 'client');
            return false;
        }
    };
    filter(options);
    assert.equal(options.url, '/__bili_proxy__/api.bilibili.com/search?keyword=a%26b&sign=abc');
    assert.equal(options.crossDomain, false);
    assert.equal($.ajaxSettings.xhr().mozSystem, false);
    const headers = {};
    const request = { setRequestHeader(name, value) { headers[name] = value; return this; } };
    assert.equal(options.beforeSend.call(context, request, options), false);
    assert.deepEqual(headers, { 'X-Bili-Cookie': 'buvid3=test' });
});

test('missing app permission produces a diagnostic and no restricted headers', () => {
    const { filter, warnings } = boot();
    const options = { url: 'https://api.bilibili.com/x/web-interface/nav' };
    filter(options);
    assert.equal(options.headers, undefined);
    assert.equal(warnings.length, 1);
});

test('unrelated domains receive no Bilibili headers or proxy rewrite', () => {
    for (const system of [true, false]) {
        const { filter } = boot({ system, hostname: 'localhost', protocol: 'http:' });
        const options = { url: 'https://bilibili.com.example.org/api' };
        filter(options);
        assert.equal(options.headers, undefined);
        assert.equal(options.url, 'https://bilibili.com.example.org/api');
    }
});
