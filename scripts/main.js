'use strict';

(function() {

//------------------------------------------------------------------------------
//
//  Canvans と PixiJS レンダラーを初期化
//
//------------------------------------------------------------------------------

// Canvas を生成
var canvas = document.createElement('canvas');
document.getElementById('canvas-container').appendChild(canvas);

// PixiJS レンダラーを初期化（Canvas のサイズが「スクリーンサイズ x 端末のピクセル比」になる）
var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {view: canvas, resolution: window.devicePixelRatio});

// 端末のピクセル比に合わせて Canvas 縮小
if(navigator.isCocoonJS) {
  // CocoonJS の ScreenCanvas（Canvas+ 用の爆速 Canvas）を オン
  canvas.screencanvas = true;
  // CocoonJS ならこれでスクリーンにフィットされる
  canvas.style.cssText = 'idtkscale:ScaleToFill';
} else {
  // ブラウザでは CSS Transform でフィットさせる（縮小）
  var canvasScale = 1 / window.devicePixelRatio;
  canvas.style.webkitTransform = 'scale3d(' + canvasScale + ',' + canvasScale + ',' + canvasScale + ')';
  canvas.style.webkitTransformOrigin = '0 0';
  canvas.style.transform = 'scale3d(' + canvasScale + ',' + canvasScale + ',' + canvasScale + ')';
  canvas.style.transformOrigin = '0 0';
}

// PixiJS ステージ生成（ここに追加された要素が画面に表示される）
var stage = new PIXI.Stage(0x263332);

// 毎フレームごとに画面を描画するように設定
var renderPerFrame = function() {
  window.requestAnimFrame(renderPerFrame);
  renderer.render(stage);
};
renderPerFrame();

//------------------------------------------------------------------------------
//
//  表示要素を生成（画像リソース系）
//
//------------------------------------------------------------------------------

// 表示要素（タイトル）
var title;

// 表示要素（フルスクリーンモード切り替えボタン）
var screenModeFullButton;
var screenModeNormalButton;

// デバイスのピクセル比から最適な画像 URL を判定
var suffix = '';
if(window.devicePixelRatio > 2) {
  suffix = '@3x';
} else if(window.devicePixelRatio > 1) {
  suffix = '@2x';
}
var titleImageUrl = 'images/title' + suffix + '.png';
var screenModeFullButtonImageUrl = 'images/screen-mode-full-button' + suffix + '.png';
var screenModeNormalButtonImageUrl = 'images/screen-mode-normal-button' + suffix + '.png';

// 画像リソースをロード
var assetLoader = new PIXI.AssetLoader([
  titleImageUrl,
  screenModeFullButtonImageUrl,
  screenModeNormalButtonImageUrl
]);
assetLoader.load();

// 画像リソースのロードが完了したら PIXI 表示要素を生成
assetLoader.on('onComplete', function() {
  // 画像リソースからテクスチャー生成
  var titleTexture = PIXI.Texture.fromImage(titleImageUrl);
  var screenModeFullButtonTexture = PIXI.Texture.fromImage(screenModeFullButtonImageUrl);
  var screenModeNormalButtonTexture = PIXI.Texture.fromImage(screenModeNormalButtonImageUrl);

  // テクスチャーのデバイスピクセル比対応
  titleTexture.baseTexture.resolution = window.devicePixelRatio;
  screenModeFullButtonTexture.baseTexture.resolution = window.devicePixelRatio;
  screenModeNormalButtonTexture.baseTexture.resolution = window.devicePixelRatio;

  // 表示要素を生成
  title = new PIXI.Sprite(titleTexture);
  screenModeFullButton = new PIXI.Sprite(screenModeFullButtonTexture);
  screenModeNormalButton = new PIXI.Sprite(screenModeNormalButtonTexture);

  // タイトルを左上に配置
  title.x = 20;
  title.y = 20;

  // フルスクリーン表示ボタンを右上に配置
  screenModeFullButton.anchor.x = 1;
  screenModeFullButton.x = window.innerWidth - 20;
  screenModeFullButton.y = 20;
  screenModeFullButton.visible = isFullScreenEnabled() && !isFullScreen();
  screenModeFullButton.buttonMode = true;
  screenModeFullButton.interactive = true;
  screenModeFullButton.click = screenModeFullButton.tap = function() {
    requestFullScreen();
  };

  // フルスクリーン解除ボタンを右上に配置
  screenModeNormalButton.anchor.x = 1;
  screenModeNormalButton.x = window.innerWidth - 20;
  screenModeNormalButton.y = 20;
  screenModeNormalButton.visible = isFullScreenEnabled() && isFullScreen();
  screenModeNormalButton.buttonMode = true;
  screenModeNormalButton.interactive = true;
  screenModeNormalButton.click = screenModeFullButton.tap = function() {
    exitFullScreen();
  };

  // ステージに配置して表示
  stage.addChild(title);
  stage.addChild(screenModeFullButton);
  stage.addChild(screenModeNormalButton);
});

//------------------------------------------------------------------------------
//
//  表示要素を生成（グラフィック系）
//
//------------------------------------------------------------------------------

// 指定した範囲内のランダム数値を返す
var getRandomArbitrary = function(min, max) {
  return Math.random() * (max - min) + min;
};

// 指定した範囲内のランダム数値（整数）を返す
var getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

// 矩形を雨の様に落とす
var animateDropTween = function(element) {
  var fromX = getRandomInt(5, window.innerWidth - 10);
  var fromY = getRandomInt(0, window.innerHeight / 4);
  var distY = getRandomArbitrary(100, window.innerHeight);

  var duration = getRandomArbitrary(0.5, 1);
  var delay = getRandomArbitrary(0.3, 0.9);

  var timeline = new TimelineLite({
    delay: delay,
    paused: true,
    onComplete: function() {
      animateDropTween(element)
    }
  });

  timeline.add(
    TweenMax.fromTo(element, duration, {
      alpha: 0,
      x: fromX,
      y: fromY
    }, {
      alpha: 1,
      y: fromY + distY / 2,
      ease: Linear.easeNone,
    })
  );

  timeline.add(
    TweenMax.to(element, duration, {
      alpha: 0,
      y: fromY + distY,
      ease: Linear.easeNone,
    })
  );

  timeline.play();
};

var colors = [
  0x1abc9c, 0x16a085,
  0x2ecc71, 0x27ae60,
  0x3498db, 0x2980b9,
  0x9b59b6, 0x8e44ad,
  0xf1c40f, 0xf39c12,
  0xe67e22, 0xd35400,
  0xe74c3c, 0xc0392b,
  0xecf0f1, 0xbdc3c7,
  0x95a5a6, 0x7f8c8d
];

for(var i = 0; i < colors.length; i++) {
  // 矩形グラフィック要素を生成
  var rectangle = new PIXI.Graphics();
  rectangle.beginFill(colors[i]);
  rectangle.drawRect(-5, 0, 5, 100);
  rectangle.alpha = 0;

  stage.addChild(rectangle);

  animateDropTween(rectangle);
}

//------------------------------------------------------------------------------
//
//  フルスクリーン API 対応
//
//------------------------------------------------------------------------------

// フルスクリーン機能が使えるかどうか
var isFullScreenEnabled = function() {
  return document.fullScreenEnabled
      || document.mozFullScreenEnabled
      || document.webkitFullscreenEnabled;
};

// フルスクリーンモードがアクティブ中かどうか
var isFullScreen = function() {
  return document.fullScreenElement
      || document.mozFullScreen
      || document.webkitIsFullScreen;
};

// フルスクリーンモードにする
var requestFullScreen = function() {
  if (document.documentElement.requestFullScreen) {
    document.documentElement.requestFullScreen();
  } else if (document.documentElement.mozRequestFullScreen) {
    document.documentElement.mozRequestFullScreen();
  } else if (document.documentElement.webkitRequestFullScreen) {
    document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
  }
};

// フルスクリーンモードを解除する
var exitFullScreen = function() {
  if (document.cancelFullScreen) {
    document.cancelFullScreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitCancelFullScreen) {
    document.webkitCancelFullScreen();
  }
};

// フルスクリーンモード切り替えボタンの状態を更新
var updateScreenModeButton = function() {
  screenModeFullButton.visible = !isFullScreen();
  screenModeNormalButton.visible = isFullScreen();
};

// フルスクリーンモードが切り替わた時
window.addEventListener('fullscreenchange', updateScreenModeButton, false);

// フルスクリーンモードが切り替わた時（WebKit系）
window.addEventListener('webkitfullscreenchange', updateScreenModeButton, false);

// フルスクリーンモードが切り替わた時（Mozilla系）
window.addEventListener('mozfullscreenchange', updateScreenModeButton, false);

//------------------------------------------------------------------------------
//
//  リサイズ対応
//
//------------------------------------------------------------------------------

// スクリーンサイズが変更されたら配置を更新
var updateLayout = function() {
  if(title) {
    title.x = 20;
    title.y = 20;
  }

  if(screenModeFullButton) {
    screenModeFullButton.x = window.innerWidth - 20;
    screenModeFullButton.y = 20;
  }

  if(screenModeNormalButton) {
    screenModeNormalButton.x = window.innerWidth - 20;
    screenModeNormalButton.y = 20;
  }
};

// スクリーンがリサイズされた時
window.addEventListener('resize', function() {
  // PixiJS のレンダラーをスクリーンサイズにフィット
  renderer.resize(window.innerWidth, window.innerHeight);

  // 表示要素の配置を更新
  updateLayout();
}, false);

// 画面向きが変わった時
window.addEventListener('orientationchange', function() {
  if(90 === window.orientation || -90 === window.orientation) {
    // iOS Safari の Landcape バグ対応
    document.body.scrollTop = 0;
  }

  // PixiJS のレンダラーをスクリーンサイズにフィット
  renderer.resize(window.innerWidth, window.innerHeight);

  // 表示要素の配置を更新
  updateLayout();
}, false);

})();
