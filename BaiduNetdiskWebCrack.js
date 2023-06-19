// ==UserScript==
// @name        百度网盘破解SVIP&&倍速播放&&文稿字幕
// @namespace   http://tampermonkey.net/
// @match       https://pan.baidu.com/pfile/video
// @grant       unsafeWindow
// @grant       GM_setValue
// @grant       GM_getValue
// @run-at      document-start
// @connect     pan.baidu.com
// @require     https://lib.baomitu.com/hls.js/latest/hls.js
// @version     1.2
// @license     MIT
// @author      Gwen
// @downloadURL https://greasyfork.org/scripts/468982-%E7%99%BE%E5%BA%A6%E7%BD%91%E7%9B%98%E7%A0%B4%E8%A7%A3svip-%E5%80%8D%E9%80%9F%E6%92%AD%E6%94%BE-%E6%96%87%E7%A8%BF%E5%AD%97%E5%B9%95/code/%E7%99%BE%E5%BA%A6%E7%BD%91%E7%9B%98%E7%A0%B4%E8%A7%A3SVIP%E5%80%8D%E9%80%9F%E6%92%AD%E6%94%BE%E6%96%87%E7%A8%BF%E5%AD%97%E5%B9%95.user.js
// @homepageURL https://greasyfork.org/zh-CN/scripts/468982-%E7%99%BE%E5%BA%A6%E7%BD%91%E7%9B%98%E7%A0%B4%E8%A7%A3svip-%E5%80%8D%E9%80%9F%E6%92%AD%E6%94%BE-%E6%96%87%E7%A8%BF%E5%AD%97%E5%B9%95
// @description 百度网盘视频完全破解SVIP。电脑用户使用新版火狐或安插件设置UserAgent:Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0) Gecko/20100101 Firefox/110.0。iPad用户（我iOS15.7）：①使用Safari，在AppStore安装Stay后安装使用脚本。缺点-无Svip快速加载视频。②安装Focus浏览器，登录即为Svip。缺点-Focus无法分屏。
// ==/UserScript==

(function() {

  var settings = {
    solve_subtitle: true, //处理文稿字幕
    subtitles: null,
    subtitle_enabled: false,
    longPressRate: 2, //长按加速倍速，Safari受设备影响，我的设备最高只能2倍速
    lastPlaybackRate: GM_getValue('lastPlaybackRate', 1),
    resolution: null,
    failCountThreshold: 15, //视频加载几秒仍未加载插件则手动发送获取视频m3u8的请求
    path: null,
    isSvip: null,
    adToken: null,
    bdstoken: null,
    globalVideo: null,
    hls: null,
  }

  //兼容某些浏览器无GMapi
  function GM_setValue(key, value) {
    settings[key] = value
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      localStorage.setItem(key, value.toString());
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
  function GM_getValue(key, defaultValue = null) {
    const value = localStorage.getItem(key);
    if (value === null || value === undefined) {
      return defaultValue;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      alert(`Error parsing stored value for key '${key}': ${error}`);
      return defaultValue;
    }
  }
  function throttle(fn, delay) {
    var ctx;
    var args;
    var previous = Date.now();
    var later = function () {
      fn.apply(ctx, args);
    };
    return function () {
      ctx = this;
      args = arguments;
      var now = Date.now();
      var diff = now - previous - delay;
      if (diff >= 0) {
        previous = now;
        setTimeout(later, delay);
      }
    };
  }

  function useMessage(){function n(n){for(var o=10,e=0;e<f.length;e++){var t=f[e];if(n&&n===t)break;o+=t.clientHeight+20}return o}function o(o){for(var e=0;e<f.length;e++){if(f[e]===o){f.splice(e,1);break}}o.classList.add(a.hide),f.forEach(function(o){o.style.top=n(o)+"px"})}function e(e){function i(){p.removeEventListener("animationend",i),setTimeout(o,x||t.duration||3e3,p)}function s(){"0"===getComputedStyle(p).opacity&&(p.removeEventListener("transitionend",s),p.remove())}var d=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"info",x=arguments[2],p=r.createElement("div");p.className=a.box+" "+d,p.style.top=n()+"px",p.style.zIndex=c,p.innerHTML='\n    <span class="'+a.icon+'"></span>\n    <span class="'+a.text+'">'+e+"</span>\n    ",c++,f.push(p),r.body.appendChild(p),p.addEventListener("animationend",i),p.addEventListener("transitionend",s)}var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},r=document,i="__"+Math.random().toString(36).slice(2,7),a={box:"msg-box"+i,hide:"hide"+i,text:"msg-text"+i,icon:"msg-icon"+i},s=r.createElement("style");s.textContent=("\n  ."+a.box+", ."+a.icon+", ."+a.text+" {\n    padding: 0;\n    margin: 0;\n    box-sizing: border-box;\n  }\n  ."+a.box+" {\n    position: fixed;\n    top: 0;\n    left: 50%;\n    display: flex;\n    padding: 12px 16px;\n    border-radius: 2px;\n    background-color: #fff;\n    box-shadow: 0 3px 3px -2px rgba(0,0,0,.2),0 3px 4px 0 rgba(0,0,0,.14),0 1px 8px 0 rgba(0,0,0,.12);\n    white-space: nowrap;\n    animation: "+a.box+"-move .4s;\n    transition: .4s all;\n    transform: translate3d(-50%, 0%, 0);\n    opacity: 1;\n    overflow: hidden;\n  }\n  ."+a.box+'::after {\n    content: "";\n    position: absolute;\n    left: 0;\n    top: 0;\n    height: 100%;\n    width: 4px;\n  }\n  @keyframes '+a.box+"-move {\n    0% {\n      opacity: 0;\n      transform: translate3d(-50%, -100%, 0);\n    }\n    100% {\n      opacity: 1;\n      transform: translate3d(-50%, 0%, 0);\n    }\n  }\n  ."+a.box+"."+a.hide+" {\n    opacity: 0;\n    /* transform: translate3d(-50%, -100%, 0); */\n    transform: translate3d(-50%, -100%, 0) scale(0);\n  }\n  ."+a.icon+" {\n    display: inline-block;\n    width: 18px;\n    height: 18px;\n    border-radius: 50%;\n    overflow: hidden;\n    margin-right: 6px;\n    position: relative;\n  }\n  ."+a.text+" {\n    font-size: 14px;\n    line-height: 18px;\n    color: #555;\n  }\n  ."+a.icon+"::after,\n  ."+a.icon+'::before {\n    position: absolute;\n    content: "";\n    background-color: #fff;\n  }\n  .'+a.box+".info ."+a.icon+", ."+a.box+".info::after {\n    background-color: #1890ff;\n  }\n  ."+a.box+".success ."+a.icon+", ."+a.box+".success::after {\n    background-color: #52c41a;\n  }\n  ."+a.box+".warning ."+a.icon+", ."+a.box+".warning::after {\n    background-color: #faad14;\n  }\n  ."+a.box+".error ."+a.icon+", ."+a.box+".error::after {\n    background-color: #ff4d4f;\n  }\n  ."+a.box+".info ."+a.icon+"::after,\n  ."+a.box+".warning ."+a.icon+"::after {\n    top: 15%;\n    left: 50%;\n    margin-left: -1px;\n    width: 2px;\n    height: 2px;\n    border-radius: 50%;\n  }\n  ."+a.box+".info ."+a.icon+"::before,\n  ."+a.box+".warning ."+a.icon+"::before {\n    top: calc(15% + 4px);\n    left: 50%;\n    margin-left: -1px;\n    width: 2px;\n    height: 40%;\n  }\n  ."+a.box+".error ."+a.icon+"::after, \n  ."+a.box+".error ."+a.icon+"::before {\n    top: 20%;\n    left: 50%;\n    width: 2px;\n    height: 60%;\n    margin-left: -1px;\n    border-radius: 1px;\n  }\n  ."+a.box+".error ."+a.icon+"::after {\n    transform: rotate(-45deg);\n  }\n  ."+a.box+".error ."+a.icon+"::before {\n    transform: rotate(45deg);\n  }\n  ."+a.box+".success ."+a.icon+"::after {\n    box-sizing: content-box;\n    background-color: transparent;\n    border: 2px solid #fff;\n    border-left: 0;\n    border-top: 0;\n    height: 50%;\n    left: 35%;\n    top: 13%;\n    transform: rotate(45deg);\n    width: 20%;\n    transform-origin: center;\n  }\n  ").replace(/(\n|\t|\s)*/gi,"$1").replace(/\n|\t|\s(\{|\}|\,|\:|\;)/gi,"$1").replace(/(\{|\}|\,|\:|\;)\s/gi,"$1"),r.head.appendChild(s);var c=t.zIndex||1e3,f=[];return{show:e,info:function(n){e(n,"info")},success:function(n){e(n,"success")},warning:function(n){e(n,"warning")},error:function(n){e(n,"error")}}}
  var $msg=useMessage();
  $msg.success('脚本开始运行')

  //为解决某些我无法解决的视频加载错误或手机端插件各种bug的循环检错器
  var failCount = 0
  var failChecker = null
  //手动请求视频资源
  function fetchVideoM3U8() {
    let xhr = new XMLHttpRequest()
    let url = `https://pan.baidu.com/api/streaming?app_id=250528&clienttype=0&channel=chunlei&web=1&isplayer=1&check_blue=1&type=M3U8_AUTO_${settings.resolution?settings.resolution:'480'}&trans=&vip=0` +
          `&bdstoken=${settings.bdstoken||unsafeWindow.locals.bdstoken}&path=${settings.path}&jsToken=${unsafeWindow.jsToken}`
    xhr.open("GET", url)
    xhr.fromScript = true
    xhr.callback = function() {
      $msg.success('开始获取m3u8')
      if (settings.globalVideo) {
        if(this.playFlag) 	// 暂停
          settings.globalVideo.pause()
        settings.hls.detachMedia(settings.globalVideo)
        settings.hls.destroy()
      }
      fetchVideoM3U8()
    }
    xhr.send()
  }
  function startFailChecker() {
    if (failChecker != null) {
      $msg.error('failChecker已在启动')
      return
    }
    failChecker = setInterval(() => {
      if (settings.globalVideo.readyState == 0) { //视频未成功加载
        failCount++
        if (failCount == settings.failCountThreshold) {
          $msg.error('视频未成功加载')
          clearInterval(failChecker)
          fetchVideoM3U8()
          failCount = 0
        }
      } else {
        $msg.success('视频成功加载')
        clearInterval(failChecker)
      }
    }, 1000)
  }

  function init() {
    let video = document.querySelector('video')
    if (!video) {
      console.log('still loading...')
      setTimeout(init, 400)
    } else if (video.id == 'vjs_video_3_html5_api') {
      video.remove()
      console.log('%removed beforeplay animation', 'color:blue')
      setTimeout(init, 400)
    } else {
      console.log('%cloaded!', 'color:red')
      $msg.success('加载成功')
      settings.globalVideo = video
      settings.path = new URLSearchParams(new URL(location.href).search).get('path');
      settings.isSvip = settings.isSvip || document.querySelector('.vp-personal-userinfo__vip-icon').src.indexOf('svip') != -1

      video.parentElement.onselectstart = function(){return false;};
      video.autoplay = 'true'
      var scrubber = document.createElement("div");
      scrubber.style = 'text-align: center; width: 100%; z-index: 1000; color: white; font-weight: bold; text-shadow: black 0px 0px 10px;position: absolute;top: 50%;font-size: 30px;'
      var speedAlert = document.createElement('div')
      speedAlert.innerText = settings.longPressRate + '倍速播放中'
      speedAlert.style = 'text-align: center; width: 100%;position: absolute; top: 20px;z-index: 100; font-size: 30px;color: orange; text-shadow: black 0px 0px 20px;'
      speedAlert.style.display = 'none'
      video.parentElement.appendChild(scrubber);
      video.parentElement.appendChild(speedAlert)

      let scrubbing = false;
      let scrubStartX = 0;
      let scrubStartTime = 0;
      let deltaX = 0

      function updateScrubber() {
          var currentTime = video.currentTime;
          var duration = video.duration;
          scrubber.textContent = formatTime(currentTime) + " / " + formatTime(duration);
      }

      function formatTime(time) {
          var hours = Math.floor(time / 3600);
          var minutes = Math.floor((time % 3600) / 60);
          var seconds = Math.floor(time % 60);
          return (hours > 0 ? hours + ":" : "") + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
      }

      let isLongPress = false
      let longPressTimer;
      let longPressThreshold = 1000; // milliseconds

      video.addEventListener("touchstart", function(event) {
          if (event.touches.length == 1) {
              isLongPress = false;
              scrubbing = true;
              scrubStartX = event.touches[0].pageX;
              scrubStartTime = video.currentTime;

              longPressTimer = setInterval(function() {
                  GM_setValue('lastPlaybackRate', video.playbackRate)
                  video.playbackRate = settings.longPressRate;
                  speedAlert.style.display = 'block'
                  isLongPress = true;
                  clearInterval(longPressTimer);
              }, longPressThreshold);
          }
      });

      video.addEventListener("touchmove", function(event) {
          if (scrubbing && event.touches.length == 1 && !isLongPress) {
              deltaX = event.touches[0].pageX - scrubStartX;
              var scrubTime = scrubStartTime + deltaX * video.duration / video.clientWidth * 0.08;
              if (scrubTime < 0) {
                  scrubTime = 0;
              } else if (scrubTime > video.duration) {
                  scrubTime = video.duration;
              }
              clearInterval(longPressTimer)
              scrubber.style.display = "block";
              scrubber.textContent = formatTime(scrubTime) + " / " + formatTime(video.duration);
          }
      });

      video.addEventListener("touchend", function(event) {
          if (scrubbing && event.touches.length == 0) {
              scrubbing = false;
              if (!isLongPress) {
                deltaX = event.changedTouches[0].pageX - scrubStartX;
                if (deltaX != 0) {
                  var scrubTime = scrubStartTime + deltaX * video.duration / video.clientWidth * 0.08;
                  if (scrubTime < 0) {
                      scrubTime = 0;
                  } else if (scrubTime > video.duration) {
                      scrubTime = video.duration;
                  }
                  video.currentTime = scrubTime;
                  scrubber.style.display = "none";
                }
              }

              clearInterval(longPressTimer);
              isLongPress = false
              speedAlert.style.display = 'none'
              video.playbackRate = settings.lastPlaybackRate;
          }
      });

      video.addEventListener("touchcancel", function(event) {
          if (scrubbing && event.touches.length == 0) {
              scrubbing = false;
              scrubber.style.display = "none";

              clearInterval(longPressTimer);
              isLongPress = false
              speedAlert.style.display = 'none'
              video.playbackRate = settings.lastPlaybackRate;
          }
      });

      //FIX: 替换自带progressBar修复手动使用Hls播放高清视频后的点击bug
      let progressBarHtml = `<div class="vjs-progress-control vjs-control vp-video-progress-control"><div tabindex="0" class="vjs-progress-holder vjs-slider vjs-slider-horizontal" role="slider" aria-valuenow="0.00" aria-valuemin="0" aria-valuemax="100" aria-label="进度条" aria-valuetext="2:01/-:-">
<div class="vjs-play-progress vjs-slider-bar" aria-hidden="true" style="width: 0%;"><div class="vjs-time-tooltip" aria-hidden="true" style="right: -18.5px;">0:00</div></div>
</div></div>`
      let progressParent = document.querySelector('.vjs-progress-control').parentElement
      progressParent.children[0].remove()
      progressParent.insertAdjacentHTML('afterbegin', progressBarHtml)
      let progressHolder = progressParent.children[0].children[0]
      let progressBar = progressHolder.children[0]
      let progressToolTip = progressBar.children[0]
      let subtitleElement = document.querySelector('.vp-video__subtitle-text-first')
      let subtitleTab = null
      let subtitleWrapper = null
      let subtitleContent = null
      let subtitleInitTimer = setInterval(() => {
        if (!subtitleTab) {
          const elements = document.querySelectorAll('.vp-tabs__header-item');
          elements.forEach(elem => {
            if (elem.innerText.trim() == '文稿') {
              console.log('已获取到文稿元素')
              subtitleTab = elem
            }
          })
        } else {
          if (subtitleTab.className.indexOf('active')) {
            if (!subtitleWrapper) {
              subtitleWrapper = document.querySelector('.ai-draft__wrap-list')
            } else {
              console.log('%c加载文稿列表', 'color:pink;')
              subtitleContent = subtitleWrapper.parentElement
              clearInterval(subtitleInitTimer)
            }
          }
        }
      }, 400)

      progressHolder.addEventListener('click', updateProgress);
      progressHolder.addEventListener('touchstart', updateProgress);
      subtitleElement.style.fontSize = '20px'

      //点击更新进度条位置
      function updateProgress(event) {
        var totalWidth = progressHolder.offsetWidth;
        var offsetX = 0;
        if (event.type === 'click') {
          offsetX = event.offsetX;
        } else if (event.type === 'touchstart') {
          offsetX = event.touches[0].clientX - progressHolder.getBoundingClientRect().left;
        }
        var percentage = (offsetX / totalWidth) * 100;
        progressBar.style.width = percentage + '%';
        let currentTime = (percentage / 100) * video.duration;
        progressToolTip.innerText = formatTime(currentTime)
        video.currentTime = currentTime;
      }
      progressHolder.addEventListener('touchmove', function(event) {
        event.preventDefault();
      });
      //寻找字幕
      function showSubtitle(subtitles, currentTime) {
        let left = 0;
        let right = subtitles.length - 1;
        while (left <= right) {
          let middle = Math.floor((left + right) / 2);
          let subtitle = subtitles[middle];
          if (currentTime >= subtitle.startTime && currentTime <= subtitle.endTime) {
            subtitleElement.innerHTML = subtitle.text;
            return;
          } else if (currentTime < subtitle.startTime) {
            right = middle - 1;
          } else {
            left = middle + 1;
          }
        }
        subtitleElement.innerHTML = '';
      }
      //video时间变化执行内容
      function videoTimeUpdate() {
        let currentTime = video.currentTime;
        // 更新自定义进度条的位置
        let percentage = (currentTime / video.duration) * 100;
        progressBar.style.width = percentage + '%';
        //如果开启了字幕，显示字幕
        if (settings.subtitle_enabled && settings.subtitles) {
          if (settings.subtitles) {
            showSubtitle(settings.subtitles, this.currentTime);
          } else {
            subtitleElement.innerText = '字幕正在加载中...'
          }
        }
        //破解Svip打开文稿后同步显示字幕位置
        if (!settings.isSvip && subtitleTab && subtitleTab.className.indexOf('active') != -1 && subtitleWrapper) {
          const paragraphs = subtitleWrapper.children
          let currentIndex = 0
          for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i]
            if (currentTime * 1000 >= paragraph.dataset.starttime) {
              currentIndex = i
            } else {
              break;
            }
          }
          //取消当前高亮
          try {
            subtitleWrapper.querySelectorAll('.ai-draft__p-sentence--fouce').forEach(node => node.className = 'ai-draft__p-sentence')
          } catch(err) {}
          const subtitles = settings.subtitles
          for (let i = currentIndex * 15; i < (currentIndex + 1) * 15 && i < settings.subtitles.length; i++) {
            if (currentTime > subtitles[i].startTime && currentTime < subtitles[i].endTime) {
              let paragraph = paragraphs[currentIndex].children[i % 15]
              paragraph.className = 'ai-draft__p-sentence ai-draft__p-sentence--fouce'
              paragraph.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
              break;
            }
          }
        }
      }
      video.addEventListener('timeupdate', throttle(videoTimeUpdate, 500));

      //前进后退倍速字幕
      //TODO FIX: 尝试修复替换进度条后键盘控制 but TMD怎么没用啊
      document.addEventListener('keyup', function(event) {
        if (event.key === 'ArrowLeft') {
        } else if (event.key === 'ArrowRight') {
          e.stopPropagation()
          e.preventDefault()
          if (video.currentTime + 15 < video.duration) {
            video.currentTime += 15;
          } else {
            video.currentTime = video.duration;
          }
        }
      });
      let toolBox = document.createElement('div')
      toolBox.style='width:100%;margin:10px 0;display:flex;justify-content:space-between;'
      let reloadBtn = createButton('重新加载', e => {
        fetchVideoM3U8()
      })
      let subtitleBtn = createButton(settings.subtitle_enabled ? '关闭字幕' : '开启字幕', e => {
        if (settings.subtitle_enabled) { //已经开启了，点击关闭
          subtitleBtn.textContent = '开启字幕'
          document.querySelector('.vp-video__subtitle-text').style.display = 'none'
        } else { //点击开启字幕
          subtitleBtn.textContent = '关闭字幕'
          document.querySelector('.vp-video__subtitle-text').style = 'display: block;opacity: 0.8;pointer-events:none'
          if (!settings.subtitles) {
            $msg.info('开始加载字幕文件')
            document.querySelector('.vp-video__subtitle-text-first').innerText = '字幕正在加载中...'
            document.querySelector('.vp-tabs__header-item:nth-child(2)').click();
          }
        }
        settings.subtitle_enabled = !settings.subtitle_enabled
      })
      let rewindBtn = createButton('←15s', e => {
        video.currentTime = video.currentTime + 15
      })
      let forwardBtn = createButton('15s→', e => {
        if (video.currentTime + 15 < video.duration) {
          video.currentTime += 15;
        } else {
          video.currentTime = video.duration;
        }
      })
      toolBox.appendChild(reloadBtn)
      toolBox.appendChild(subtitleBtn)
      toolBox.appendChild(rewindBtn)
      toolBox.appendChild(forwardBtn)
      let speedBox = document.createElement('select')
      speedBox.value = settings.lastPlaybackRate
      let speeds = [3, 2, 1.75, 1.5, 1, 0.75]
      speeds.forEach(speed => {
        const option = document.createElement('option');
        option.textContent = speed == 1 ? '正常' : (speed + 'X'); // 设置option的文本值
        option.value = speed;
        speedBox.appendChild(option);
      });
      speedBox.addEventListener('change', event => {
        const selectedSpeed = event.target.value;
        settings.globalVideo.playbackRate = selectedSpeed;
        GM_setValue('lastPlaybackRate', selectedSpeed)
      });
      toolBox.appendChild(speedBox)
      let resolutionBox = document.createElement('select')
      resolutionBox.id = 'resolution-box'
      resolutionBox.addEventListener('change', event => {
        const selectedResolution = event.target.value;
        if (selectedResolution == '1080') {
          alert('1080无法播放好像。。。')
          settings.resolution = '720'
        } else {
          settings.resolution = selectedResolution;
        }
        fetchVideoM3U8()
      })
      toolBox.appendChild(resolutionBox)
      //FIX: 修改部分css修复宽度小时无法显示全的问题
      video.parentElement.parentElement.parentElement.appendChild(toolBox)
      document.getElementById('app').style.width = '90%'
      document.querySelector('.vp-toolsbar').remove()
      document.querySelector('.vp-header').style.minWidth = '0'
      document.querySelector('.vp-personal-video-play').style.minWidth = '0'
      document.querySelector('.vp-personal-home-layout__video').style.minWidth = '60vw'
      document.querySelector('.vp-tabs').style.width = '36vw'

      let rateOptions = document.querySelector('.vp-video__control-bar--playback-rates').children
      for (let i = 0; i < rateOptions.length; i++) {
        let option = rateOptions[i]
        if (option.classList[1] != 'is-svip-guide') {
          option.onclick = function(e) {
            e.stopPropagation()
            GM_setValue('lastPlaybackRate', Number.parseFloat(option.innerText.replace('X', '')))
            video.playbackRate = settings.lastPlaybackRate
          }
        }
      }

      //双击暂停
      let container = video.parentElement;
      let pauseThreshold = 500; // milliseconds
      let lastClickTime = 0;
      let pauseTimer;
      container.addEventListener("touchstart", function(event) {
        let currentTime = new Date().getTime();
        if (currentTime - lastClickTime < pauseThreshold) {
          clearTimeout(pauseTimer);
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        } else {
          lastClickTime = currentTime;
          pauseTimer = setTimeout(function() {
            lastClickTime = 0;
          }, pauseThreshold);
        }
      });

      //FIX: 替换自带全屏修复Focus浏览器全屏使用iOS默认播放器
      let vpVideo = document.querySelector('.vp-video')
      let controllBar = document.querySelector('.vp-video__control-bar--setup')
      controllBar.children[4].remove()
      controllBar.insertAdjacentHTML('beforeend', `<div class="vp-video__control-bar--button-group">
  <div class="vp-video__control-bar--button is-icon">
    <i class="u-icon-screen"></i></div></div>`)
      let fullScreenBtn = controllBar.children[4]
      let fullScreenIcon = fullScreenBtn.children[0].children[0]
      fullScreenBtn.onclick = e => {
        if (fullScreenIcon.className == 'u-icon-screen') {
          //点击全屏
          vpVideo.style.zIndex = '99999'
          vpVideo.style.position = 'fixed';
          vpVideo.style.top = '0';
          vpVideo.style.left = '0';
          fullScreenIcon.className = 'u-icon-exit-screen'
        } else {
          vpVideo.style.position = 'unset';
          fullScreenIcon.className = 'u-icon-screen'
        }
      }

      //准备完毕，开始检查视频状态
      startFailChecker()
    }
  }

  function createButton(textContent, callback) {
    let btn = document.createElement('div')
    btn.style = 'padding: 10px 10px; text-align: center; background: rgb(6, 167, 255); color: white;font-size: 14px;cursor:pointer'
    btn.textContent = textContent
    if (callback) {
      btn.onclick = e => {
        callback(e)
      }
    }
    return btn;
  }

  function hookRequest() {
      var originOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url) {
        if (url.indexOf('netdisk-subtitle') != -1 && settings.solve_subtitle) { //获取字幕信息
          this.addEventListener('readystatechange', function() {
            if (this.readyState == 4) {
              var blobData = this.response;
              var reader = new FileReader();
              reader.onloadend = function() {
                var textContent = reader.result;
                let arr = textContent.split('\n')
                setTimeout(() => {
                  let wrapper = document.querySelector('.ai-draft__wrap-list')
                  try {
                    document.querySelector('.ai-draft__svip-guide').remove()
                    document.querySelector('.ai-draft__filter').remove()
                  } catch(err) {
                  }
                  let subtitles = []
                  let paragraph
                  console.log('开始解析字幕')
                  for (let i = 1; i < arr.length / 4; i++) {
                    if (arr[i * 4] == '')
                      break;
                    let lines = [arr[i * 4], arr[i * 4 + 1], arr[i * 4 + 2]]
                    let timeParts = lines[1].split(' --> ');
                    let startTime = srtTimeToSeconds(timeParts[0].trim());
                    let endTime = srtTimeToSeconds(timeParts[1].trim());
                    if (!settings.isSvip && i >= 15 * 3 + 1) {
                      if (i % 15 == 1) {
                        paragraph = document.createElement('p')
                        paragraph.className = 'ai-draft__p-paragraph'
                        paragraph.setAttribute('data-starttime', startTime * 1000)
                      } else if (i % 15 == 0) {
                        wrapper.appendChild(paragraph)
                      }
                      let span = document.createElement('span')
                      span.className = 'ai-draft__p-sentence'
                      span.setAttribute('data-index', i - 1)
                      span.innerText = lines[2]
                      span.onclick = e => {
                        settings.globalVideo.currentTime = startTime
                      }
                      paragraph.appendChild(span)
                    }
                    subtitles.push({
                      index: i - 1,
                      startTime: startTime,
                      endTime: endTime,
                      text: lines[2]
                    })
                  }
                  settings.subtitles = subtitles
                }, 1000)
              };
              reader.readAsText(blobData);
            }
          });
          originOpen.apply(this, arguments);
        } else if (url.indexOf('/api/loginStatus') != -1) { //伪造svip信息
          this.addEventListener('readystatechange', function() {
            if (this.readyState == 4) {
              let res = JSON.parse(this.responseText)
              settings.isSvip = res.login_info.vip_type == '21'
              res.login_info.vip_type = '21'
              res.login_info.vip_identity = '21'
              res.login_info.vip_level =  8
              res.login_info.vip_point = 99999
              res.login_info.username = 'sout(\'GwenCrack\')'
              settings.bdstoken = res.login_info.bdstoken
              Object.defineProperty(this, "responseText", {
                  writable: true,
              });
              this.responseText = JSON.stringify(res)
            }
          })
          originOpen.apply(this, arguments);
        } else if (url.indexOf('/api/streaming') != -1 && url.indexOf('M3U8_SUBTITLE_SRT') == -1) { //获取视频m3u8接口
          let modifiedUrl = url.replace(/vip=2/, 'vip=0')
                  // .replace(/M3U8_.*?&/, 'M3U8_AUTO_1080&')
          if (settings.adToken) {
            modifiedUrl += ('&adToken=' + encodeURIComponent(settings.adToken))
            settings.adToken = null
          }
          originOpen.call(this, method, modifiedUrl);
          this.addEventListener('readystatechange', function() {
            if (this.readyState == 4) {
              if (this.responseText[0] == '{') {
                let res = JSON.parse(this.responseText)
                settings.adToken = res.adToken
                if (this.callback) {
                  this.callback()
                }
              } else {
                // if (!this.fromScript) {
                //   return;
                // }
                let m3u8Content = this.responseText
                let blob = new Blob([this.responseText], { type: 'application/vnd.apple.mpegurl' });
                let url = URL.createObjectURL(blob);
                if (!Hls.isSupported()) {
                  $msg.error('浏览器不支持播放')
                  return
                }
                settings.hls = new Hls({
                  autoStartLoad: true,
                  autoplay: true
                })
                let hls = settings.hls
                let video = settings.globalVideo
                let vpError = document.querySelector('.vp-error')
                if (vpError) {
                  vpError.remove()
                }
                hls.on(Hls.Events.MEDIA_ATTACHED, function() {
                  hls.loadSource(url);
                });
                hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
                  video.play();
                  video.playbackRate = settings.lastPlaybackRate
                  let checkDurationTimer = setInterval(() => {
                    if (video.readyState > 0) {
                      document.querySelector('.vp-video__control-bar--play-time-all>div').innerText = formatTime(video.duration)
                      clearInterval(checkDurationTimer)
                    }
                  }, 100)
                });
                hls.attachMedia(video);
              }
            }
          })
        } else if (url.indexOf('/api/filemetas') != -1) {
          this.addEventListener('readystatechange', function() {
            if (this.readyState == 4) {
              let res = JSON.parse(this.responseText)
              if (res.info.length != 1)
                return
              let resolution = res.info[0].resolution
              console.log('分辨率'+ resolution)
              let resolutionOptions = []
              switch(resolution) {
                case 'width:1920,height:1080':
                  resolutionOptions.push('1080')
                case 'width:1280,height:720':
                  resolutionOptions.push('720')
                case 'width:720,height:480':
                  resolutionOptions.push('480')
                default:
                  resolutionOptions.push('360')
              }
              console.log(resolutionOptions)
              let waitTimer = setInterval(() => {
                let box = document.getElementById('resolution-box')
                if (box) {
                  clearInterval(waitTimer)
                  resolutionOptions.forEach(resolution => {
                    const option = document.createElement('option')
                    option.textContent = resolution + 'P'
                    option.value = resolution
                    box.appendChild(option)
                  })
                }
              }, 400)
            }
          })
          originOpen.apply(this, arguments);
        } else {
          originOpen.apply(this, arguments);
        }
      }
    }

  function srtTimeToSeconds(timeString) {
    var timeParts = timeString.split(':');
    var hours = parseInt(timeParts[0]);
    var minutes = parseInt(timeParts[1]);
    var secondsAndMilliseconds = timeParts[2].split('.');
    var seconds = parseInt(secondsAndMilliseconds[0]);
    var milliseconds = parseInt(secondsAndMilliseconds[1]);

    var totalSeconds = (hours * 3600) + (minutes * 60) + seconds + (milliseconds / 1000);
    return totalSeconds;
  }

  function formatTime(totalSeconds) {
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = Math.floor(totalSeconds % 60);
    var formattedTime = hours.toString().padStart(2, '0') + ':' +
                        minutes.toString().padStart(2, '0') + ':' +
                        seconds.toString().padStart(2, '0');
    return formattedTime;
  }

  hookRequest()
  init()
  let lastUrl = location.href
  setInterval(() => {
    if (lastUrl != location.href) {
      lastUrl = location.href
      console.log('%cURL变化为' + location.href, 'color:purple;')
      settings.path = new URLSearchParams(new URL(lastUrl).search).get('path');
      setTimeout(() => {
        $msg.info('重新加载字幕')
        settings.subtitles = null
        document.querySelector('.vp-tabs__header-item:nth-child(2)').click();
        setTimeout(() => {
          document.querySelector('.vp-tabs__header-item:nth-child(1)').click();
        }, 500)
      }, 2500)

    }
  }, 500)
})()
