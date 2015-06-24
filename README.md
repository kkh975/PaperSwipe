SwipePaper
=========

##Introduce
구글 앱 스토어, 애플 앱 스토어 등에서 화면 미리보기 영역에서 주로 사용되는 플리킹 플러그인입니다. jQuery plugin을 지원하며 시작위치 지정, 슬라이더의 페이징 기능등이 있습니다.

[Demo](https://kkh975.github.io/SwipePaper)

##How to Use
####html
아래와 같이 감싸는 태그와 리스트 태그, 그리고 리스트의 아이템 태그로 작성합니다.
```html
<div class="listWrap">
  <ul class="list">
		<li><div style="background: red;">0</div></li>
		<li><div style="background: brown;">1</div></li>
		<li><div style="background: orange;">2</div></li>
	</ul>
</div>
```

####css
아래와 같이 길이와 높이값을 반드시 기입해야 합니다.
```css
.listWrap {
	width: 200px;
	height: 100px;
}
.list li {
	width: 200px;
	height: 100px;
}
```

####javascript
jquery 플러그인을 작성할 경우 아래와 같이 작성합니다.
```javascript
$( '.listWrap' ).swipePaper();
```

javascript으로 작성할 경우 아래와 같이 작성합니다.
```javascript
new SwipePaper({
	wrap: document.querySelectorAll( '.listWrap' )[ 0 ],
	list: document.querySelectorAll( '.listWrap li' ),
});
```

##method
+ startSlideShow: 슬라이더쇼 시작
+ stopSlideShow: 슬라이더쇼 정지
+ refreshSize: 크기 재반영
+ getIdx: {index} 현재 슬라이더 인덱스
+ toNext: 다음 슬라이더 이동
+ toPrev: 이전 슬라이더 이동
+ toSlide: 지정된 슬라이더 이동
+ destory: 제거

##option

####jquery option
+ $wrap: {jQuery Selector} (default: $( this ).find( 'ul' )) 리스트 감쌈
+ $list: {jQuery Selector} (default: $( this ).find( 'ul li' )) 리스트
+ $pages: {jQuery Selector} (default: null) 슬라이드 이동 버튼
+ $toStart: {jQuery Selector} (default: null) 슬라이드쇼 시작 버튼
+ $toStop: {jQuery Selector} (default: null) 슬라이드쇼 멈춤 버튼
+ $toPrev: {jQuery Selector} (default: null) 이전 이동 버튼
+ $toNext: {jQuery Selector} (default: null) 다음 이동 버튼
						
####javascript option
+ wrap: <u>required</u> {elements} (default: null) 리스트 감쌈
+ list: <u>required</u> {elements} (default: null) 리스트
+ pages: {elements} (default: null) 슬라이드 이동 버튼
+ toStart: {elements} (default: null) 슬라이드쇼 시작 버튼
+ toStop: {elements} (default: null) 슬라이드쇼 멈춤 버튼
+ toPrev: {elements} (default: null) 이전 이동 버튼
+ toNext: {elements} (default: null) 다음 이동 버튼

####common option
+ startEvents: {String} (default: 'click') toStart element 이벤트
+ stopEvents: {String} (default: 'click') toStop element 이벤트
+ moveEvents: {String} (default: 'click') toPrev and toNext element 이벤트
+ pageEvents: {String} (default: 'click') pages element 이벤트
+ touchMinumRange: {Integer} (default: 10) 사용자 터치시, 슬라이더로 넘어갈 기준값(백분율)
+ duration: {Integer} (default: 400) 애니메이션 시간
+ loop: {Boolean} (default: true) 루프 여부. false로 설정시 마지막 슬라이드에서 정지
+ slideShowTime: {Boolean or Integer} (default: 3000) 슬라이더쇼 시간
+ create: {Function} (default: null) 생성시 콜백 함수
+ before: {Function} (default: null) 슬라이더 이동 전 콜백 함수
+ active: {Function} (default: null) 슬라이더 이동 후 콜백 함수	

##Troubleshooting
[ISSUES](https://github.com/kkh975/SwipePaper/issues).

##History
+ 2015-06-02: 세로 스크롤 시 오류 수정.
+ 2015-06-19: 슬라이드 이동중 터치 방지.

Copyrights
----------
- license: http://blim.mit-license.org/
- site: http://www.blim.co.kr/
- email: kkh975@naver.com