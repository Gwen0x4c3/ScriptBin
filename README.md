# 自用脚本

为了方便自己和朋友，写了一些脚本（一但开始写，不写完它就浑身难受），给大伙分享一下，别嫌弃。

> 已发脚本

- 百度网盘破解



## 百度网盘破解Svip

![image-20230619152121873](https://jigoku.top/d/Onedrive/script/assets/image-20230619152121873.png)

思路：hook一下XMLHttpRequest，修改用户身份的响应结果为Svip的身份（iPad Safari无此功能）。修改部分Css，使其样式兼容iPad分屏播放。

**Tips：若视频加载失败，点击左下角重新加载或刷新页面即可。**

### 功能概览

#### PC（火狐）

完全解锁Svip的权限

- 倍速播放
- 解锁所有画质
- 字幕
- 文稿

#### iPad（Safari）

复现Svip功能，点击视频下方的按钮进行使用。解锁画质正在做！！

- 倍速播放
- 字幕
- 文稿跟随
- 左右滑调整视频进度
- 双击暂停、长按倍速

### 使用方法

访问网页版百度网盘https://pan.baidu.com/，进入视频页面，如果URL是https://pan.baidu.com/pfile/video?path=xxx 就可以用，如果跳转https://pan.baidu.com/play/video#/video?path=xxx ，请更换浏览器

#### PC

使用新版火狐浏览器，或在Chrome上安装User-Agent Switcher扩展程序，修改User-Agent为Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0) Gecko/20100101 Firefox/110.0。

#### iPad

两种推荐方法：1、安装Stay，在里面安装脚本。2、使用Focus浏览器（免费但有时候有毛病总跳转）。

测试不支持Via，不知道什么情况。

### 可修改配置项

> **settings.solve_subtitle**

默认为true：是否解析字幕文件。若开启脚本后右上角显示自己是Svip可将该选项改为false，使用自带的字幕功能。

> **settings.longPressRate**

默认为2：长按视频倍速播放速度，受浏览器限制，不同浏览器最高支持的倍速可能不同，我的只支持2倍速。

> **settings.failCountThreshold**

默认为15：页面载入几秒后视频仍未加载则手动获取视频资源。如果网速较慢或电脑较慢可以调大该数值。



有问题提Issue
