( function( $ ) {

	'use strict';
	
	$.fn.paperSwipe = function( option ){
		option.$list = option.$list ? option.$list : $( this ).find( '> ul > li' );
		option.$wrap = option.$wrap ? option.$wrap : $( this ).find( '> ul' );
		option.list = option.$list ? option.$list.toArray() : [];
		option.wrap = option.$wrap ? option.$wrap.toArray() : [];
		option.pages = option.$pages ? option.$pages.toArray() : [];
		option.toStart = option.$toStart ? option.$toStart.toArray() : [];
		option.toStop = option.$toStop ? option.$toStop.toArray() : [];
		option.toPrev = option.$toPrev ? option.$toPrev.toArray() : [];
		option.toNext = option.$toNext ? option.$toNext.toArray() : [];

		return this.each( function(){
			$( this ).data( 'slideSwipe', new PaperSwipe( option ) );
		});
	};

	/**
	 * @method: 슬라이더쇼 시작 플러그인
	 */
	$.fn.paperSwipe2start = function() {
		return this.each( function() {
			$( this ).data( 'paperSwipe' ).startSlideShow();
		});
	};

	/**
	 * @method: 슬라이더쇼 정지 플러그인
	 */
	$.fn.paperSwipe2stop = function() {
		return this.each( function() {
			$( this ).data( 'paperSwipe' ).stopSlideShow();
		});
	};

	/**
	 * @method: 이전 슬라이더 이동 플러그인
	 */
	$.fn.paperSwipe2prev = function() {
		return this.each( function() {
			$( this ).data( 'paperSwipe' ).toPrev();
		});
	};

	/**
	 * @method: 다음 슬라이더 이동 플러그인
	 */
	$.fn.paperSwipe2next = function() {
		return this.each( function() {
			$( this ).data( 'paperSwipe' ).toNext();
		});
	};

	/**
	 * @method: 특정 슬라이더 이동 플러그인
	 */
	$.fn.paperSwipe2slide = function( _idx ) {
		return this.each( function() {
			$( this ).data( 'paperSwipe' ).toSlide( _idx );
		});
	};
}( jQuery ));


// TODO, item의 width값이 다를 경우에 대해서 

 /*!*
 * @method: SlideSwipe 플러그인
 * @autor: Blim - Koo Chi Hoon(kkh975@naver.com)
 * @license http://blim.mit-license.org/
 */
var PaperSwipe = function( __setting ) {

    "use strict";

	var MAX_TOUCH_MOVE = 100,
		DISTANCE = 100,
		setting = null,
		D_Wrap = null,
		D_Plist = null,
		D_List = null,
		D_To_Pages = null,
		D_To_Start = null,
		D_To_Stop = null,
		D_To_Prev = null,
		D_To_Next = null,
		slide_Show_Timer = null,
		is_Slide_Show = false,
		is_Move = false,
		is_Snap = false,
		list_Width = 0,
		list_Len = 0,
		list_Pos = 0,
		list_Pos_Arr = [],
		item_Width = 0,
		now_Idx = 0,
		to_Idx = 0,
		browser_Prefix = {};

	var list_time = 0;

	var default_Option = {
		wrap: null,					// require, 리스트 감싸는 태그
		list: null,					// require, 리스트
		pages: null,				// 슬라이더 페이징 이동
		toStart: null,				// 애니메이션 시작 버튼
		toStop: null,				// 애니메이션 멈춤 버튼
		toPrev: null,				// 이전 이동 버튼
		toNext: null,				// 다음 이동 버튼
		startEvents: 'click',		// 슬라이드쇼 시작 이벤트
		stopEvents: 'click',		// 슬라이드쇼 정지 이벤트
		moveEvents: 'click',		// 이동 작동 이벤트
		pageEvents: 'click',		// 페이징 작동 이벤트
		slideShowTime: 3000,		// 슬라이드쇼 시간
		touchMinumRange: 10,		// 터치시 최소 이동 거리
		firstItemMinPos: 50,		// 처음 아이템의 최소 위치(퍼센트)
		lastItemMaxPos: 50,			// 마지막 아이템의 최대 위치(퍼센트)
		loop: true,					// 무한 여부
		isSnap: false,				// 스냅 여부
		duration: 500,				// 애니메이션 시간
		create: null,				// 생성 후 콜백함수
		before: null,				// 액션 전 콜백함수
		active: null				// 액션 후 콜백함수
	};

	/**
	 * 보조 함수
	 *
	 * @namespace helper
	 */
	var helper = {

		/**
		 * @method: jQuery extend 기능
		 * @param: {Object} 복사 기준
		 * @param: {Object} 복사 대상
		 * @return: {Object} 
		 */
		extend: function( _target, _object ) {
			var prop = null,
				return_obj = {};

			for( prop in _target ) {
				return_obj[ prop ] = prop in _object ? _object[ prop ] : _target[ prop ];
			}

			return return_obj;
		},

		/**
		 * @method: 배열 여부
		 */
		isArray: function( _arr ) {
			if ( _arr ) {
				return Object.prototype.toString.call( _arr ) === '[object Array]';
			}

			return false;
		},

		/**
		 * @method: string trim
		 */
		trim: function( _txt ) {
			return _txt.replace( /(^\s*)|(\s*$)/gi, '' );
		},

		/**
		 * @method: DOM에서 배열변환
		 */
		dom2Array: function( _dom ) {
			var return_arr = [],
				len = 0,
				i = 0;

			for ( i = 0; i < _dom.length; i++ ) {
				return_arr.push( _dom[ i ] );
			};

			return return_arr;
		},

		/**
		 * @method: css3의 transition 접미사
		 * @return: {Boolean or String}
		 */
		getCssPrefix: function() {
			var transitionsCss = [ '-webkit-transition', 'transition' ],
				transformsCss = [ '-webkit-transform', 'transform' ],
				transitionsJs = [ 'webkitTransition', 'transition' ],
				transformsJs = [ 'webkitTransform', 'transform' ],
				transitionsendJs = [ 'webkitTransitionEnd', 'transitionend' ],
				styles = window.getComputedStyle( document.body, '' ),
				prefixCss = ( Array.prototype.slice.call( styles ).join('').match( /-(webkit|moz|ms|o)-/ ) || (styles.OLink === '' && [ '', 'o' ]) )[ 1 ],
				prefixJs = ( 'WebKit|Moz|MS|O' ).match( new RegExp('(' + prefixCss + ')', 'i' ) )[ 1 ],
				isWebkit = prefixCss === 'webkit';

			return {
				'prefixCss': prefixCss,
				'prefixJs': prefixJs,
				'transitionsCss': transitionsCss[ isWebkit ? 0 : 1 ],
				'transformsCss': transformsCss[ isWebkit ? 0 : 1 ],
				'transformsJs': transformsJs[ isWebkit ? 0 : 1 ],
				'transitionsJs': transitionsJs[ isWebkit ? 0 : 1 ],
				'transitionsendJs': transitionsendJs[ isWebkit ? 0 : 1 ]
			};
		},

		/**
		 * @method: css3 animation 지원 여부
		 * @return: {Boolean}
		 */
		hasCss3Animation: function() {
			var Ddiv = document.createElement( 'div' );

			return browser_Prefix.transitionsJs in Ddiv.style;
		},

		/**
		 * @method: 전체 애니메이션 설정
		 */
		setListTransition: function( _speed, _add_pos, _is_set ) {
			var this_style = null,
				pos = list_Pos + _add_pos;

			if ( _is_set ) {

				// 현재 위치가 처음 슬라이더 위치를 벗어날 때
				if ( pos > 0 ) {
					pos = 0;
				}

				// 현재 위치가 마지막 슬라이더 위치를 벗어날 때
				else if ( Math.abs( pos ) > item_Width * list_Len ) {
					pos = list_Width * list_Len;
				}

				/*

				// 스냅기능 비활성화시, 현재 위치가 정확하게 떨어지지 않을 때 교정
				else if ( pos % list_Width !== 0 ) {

					// 실제 위치해야할 위치값과 현재값의 차이를 더하거나 뻄
					// 현재 슬라이드보다 작은 슬라이더 이동시는 더함
					diff = Math.abs( pos ) - ( list_Width * _to_idx );
					pos = diff < 0 ? pos + diff : pos - diff;
				}
				*/

				list_Pos = pos;
			}

			console.log( 'check: ' + pos );

			this_style = D_Plist.style;
			this_style[ browser_Prefix.transitionsJs ] = _speed + 'ms';
			this_style[ browser_Prefix.transformsJs ] = "translateX(" + pos + "px)";
		},

		/**
		 * @method: 버튼 이벤트 설정
		 */
		setBtnEvent: function( _doms, _evts, _callback ) {
			var evt_arr = _evts.split( ',' ),
				evt_idx = evt_arr.length,
				idx = _doms.length,
				evt = '';

			while( --evt_idx > -1 ) {
				while( --idx > -1 ) {
					evt = helper.trim( evt_arr[ evt_idx ] );

					( function( __idx ) {
						_doms[ idx ].addEventListener( evt, function( e ) {
							_callback( __idx );
							e.preventDefault();
						});
					}( idx ) );
				}
			}
		}
	};

	/**
	 * 이벤트 함수
	 *
	 * @namespace event
	 */
	var touchEvents = {
		is_touch_start: false,
		touch_start_x: 0,
		touch_start_y: 0,
		move_dx: 0,

		/**
		 * @method: 변수 초기화
		 */
		setInitVar: function() {
			touchEvents.is_touch_start = false;
			touchEvents.touch_start_x = 0;
			touchEvents.touch_start_y = 0;
			touchEvents.move_dx = 0;
		},

		/**
		 * @method: 터치 시작 이벤트
		 * @param: {Object} 이벤트 객체
		 */
		setStart: function( e ) {

			if ( touchEvents.is_touch_start || is_Move ) {
				return false;
			}

			setTransitionBefore();

			if ( !touchEvents.is_touch_start && e.type === "touchstart" && e.touches.length === 1 ) {
				touchEvents.is_touch_start = true;
				touchEvents.touch_start_x = e.touches[ 0 ].pageX;
				touchEvents.touch_start_y = e.touches[ 0 ].pageY;
				e.preventDefault();
			}
		},

		/**
		 * @method: 터치 중 이벤트
		 * @param: {Object} 이벤트 객체
		 */
		setMove: function( e ) {
			var drag_dist = 0,
				scroll_dist = 0;

			if ( touchEvents.is_touch_start && e.type === "touchmove" && e.touches.length === 1 ) {
				drag_dist = e.touches[ 0 ].pageX - touchEvents.touch_start_x;		// 가로 이동 거리
				scroll_dist = e.touches[ 0 ].pageY - touchEvents.touch_start_y;		// 세로 이동 거리
				touchEvents.move_dx = ( drag_dist / list_Width ) * 100;				// 가로 이동 백분률
				
				if ( Math.abs( drag_dist ) > Math.abs( scroll_dist ) ) { // 드래그길이가 스크롤길이 보다 클때
					// touchEvents.move_dx = Math.max( -MAX_TOUCH_MOVE, Math.min( MAX_TOUCH_MOVE, touchEvents.move_dx ) );
					helper.setListTransition( 0, touchEvents.move_dx );
				}
				
				e.preventDefault();
			}
		},

		/**
		 * @method: 터치 완료 이벤트
		 * @param: {Object} 이벤트 객체
		 */
		setEnd: function( e ) {
			var to_idx = 0,
				to_slide = 0,
				tmp_now_pos = 0;

			if ( touchEvents.is_touch_start && is_Move && e.type === "touchend" && e.touches.length < 1 ) {
				tmp_now_pos = list_Pos + touchEvents.move_dx;
				to_idx = Math.round( tmp_now_pos / list_Width );
				to_idx = to_idx * -1;

				// 이전이나 이후로 가려면 is_Move해제 후 이동
				is_Move = false;

				// 스냅기능 활성화시
				if ( is_Snap ) {

					// 이동할 거리가 기준보다 클때
					if ( Math.abs( touchEvents.move_dx ) > setting.touchMinumRange ) {
						toSlide( to_idx );
					} else {
						toSlideTransition();
					}
				} else {
					setNowIdx( to_idx );
					helper.setListTransition( 0, touchEvents.move_dx, true );
				}

				touchEvents.setInitVar();
			}
		}
	};

	/**
	 * @method: 생성자
	 */
	function constructor() {
		var tmp_dom = null,
			css_dom = null,
			css_txt = '',
			evt_arr = [],
			evt_idx = 0,
			idx = 0,
			evt = '';

		// 플러그인에서 배열로 넘겨줄때 패스, javascrit로 바로 들어오면 dom2Array로..
		setting = helper.extend( default_Option, __setting );
		D_Plist = helper.isArray( setting.wrap ) ? setting.wrap : helper.dom2Array( setting.wrap ); 
		D_List = helper.isArray( setting.list ) ? setting.list : helper.dom2Array( setting.list ); 
		D_To_Pages = helper.isArray( setting.pages ) ? setting.pages : helper.dom2Array( setting.pages );
		D_To_Start = helper.isArray( setting.toStart ) ? setting.toStart : helper.dom2Array( setting.toStart );
		D_To_Stop = helper.isArray( setting.toStop ) ? setting.toStop : helper.dom2Array( setting.toStop );
		D_To_Prev = helper.isArray( setting.toPrev ) ? setting.toPrev : helper.dom2Array( setting.toPrev );
		D_To_Next = helper.isArray( setting.toNext ) ? setting.toNext : helper.dom2Array( setting.toNext );
		
		browser_Prefix = helper.getCssPrefix();
		list_Len = D_List.length;
		D_Plist = D_Plist[ 0 ];
		D_Wrap = D_Plist.parentNode;
		setting.touchMinumRange = Math.max( 1, Math.min( 100, setting.touchMinumRange ) );

		if ( !( helper.hasCss3Animation() && 'addEventListener' in window ) ) {
			return false;
		}

		if ( setting.slideShowTime ) { // 슬라이드쇼 옵션 존재
			if ( typeof setting.slideShowTime === 'boolean' ) {
				is_Slide_Show = setting.slideShowTime;

				if ( is_Slide_Show ) { // true일때, 숫자값 대입
					setting.slideShowTime = default_Option.slideShowTime;
				}
			}

			if ( typeof setting.slideShowTime === 'string' ) {
				setting.slideShowTime = parseInt( setting.slideShowTime, 10 );
			}

			if ( isNaN( setting.slideShowTime ) ) { // 타입이 숫자가 아니면
				is_Slide_Show = false;
			} else {
				is_Slide_Show = true;

				if ( setting.duration * 2 >= setting.slideShowTime ) { // 슬라이드쇼가 애니메이션 시간보다 짧을때
					setting.slideShowTime = setting.duration * 2;
				}
			}
		}

		if ( D_To_Start ) { // 애니메이션 시작 버튼
			helper.setBtnEvent( D_To_Start, setting.startEvents, startSlideShow );
		}

		if ( D_To_Stop ) { // 애니메이션 멈춤 버튼
			helper.setBtnEvent( D_To_Stop, setting.stopEvents, stopSlideShow );
		}

		if ( D_To_Prev ) { // 왼쪽 버튼
			helper.setBtnEvent( D_To_Prev, setting.moveEvents, toPrev );
		}

		if ( D_To_Next ) { // 오른쪽 버튼
			helper.setBtnEvent( D_To_Next, setting.moveEvents, toNext );
		}

		if ( D_To_Pages ) { // 페이징 이동
			helper.setBtnEvent( D_To_Pages, setting.moveEvents, function( _idx ) {
				toSlide( _idx ); 
			});
		}

		window.addEventListener( 'load', setInitStyle, false );
		D_Wrap.addEventListener( 'touchstart', touchEvents.setStart );
		D_Wrap.addEventListener( 'touchmove', touchEvents.setMove );
		D_Wrap.addEventListener( 'touchend', touchEvents.setEnd );
		D_Plist.addEventListener( browser_Prefix.transitionsendJs, toSlideTransitionAfter, false );

		while( --idx > -1 ) {

			// 포커스시 애니메이션 on/off
			Dlist[ idx ].addEventListener( 'focus', stopSlideShow, false );
			Dlist[ idx ].addEventListener( 'blur', startSlideShow, false );
		}

		return true;
	}

	/**
	 * 초기 정보 및 스타일
	 * @param: {Boolean} css3 지원 여부
	 */
	function setInitStyle( e ) {
		var css_text = '',
			len = 0,
			i = 0;

		// 전역 설정 및 기타
		list_Width = D_Wrap.offsetWidth;

		css_text = "position: relative; ";
		css_text += e.is_not_support ? "overflow-x: scroll; overflow-y: hidden;" : "overflow: hidden; ";
		D_Wrap.style.cssText = css_text;

		css_text = "position: absolute; ";
		css_text += "width: " + list_Width + "px; ";
		D_Plist.style.cssText = css_text;

		startSlideShow();

		if ( typeof setting.create === 'function' ) { // 생성 후 콜백
			setting.create( getNowIdx() );
		}
	}

	/**
	 * @method: 애니메이션 시작
	 */
	function startSlideShow() {
		if ( is_Slide_Show && slide_Show_Timer === null ) {
			slide_Show_Timer = setInterval( toNext, setting.slideShowTime );
		}
	}

	/**
	 * @method: 애니메이션 멈춤
	 */
	function stopSlideShow() {
		clearInterval( slide_Show_Timer );
		slide_Show_Timer = null;
	}

	/**
	 * @method: 화면 리사이즈
	 */
	function resizeView() {
		list_Width = D_Wrap.offsetWidth;	
		item_Width = D_List[ 0 ].offsetWidth;	
	}

	/**
	 * @method: 현재 슬라이드 번호 가져오기
	 * @return: {Number}
	 */
	function getNowIdx() {
		return now_Idx;
	}

	/**
	 * @method: 현재 슬라이드 번호 설정하기
	 */
	function setNowIdx( _now_idx ) {
		now_Idx = _now_idx;
	}

	/**
	 * @method: 이전 슬라이드 이동
	 */
	function toPrev() {
		var now_idx = getNowIdx();

		toSlide( --now_idx );
	}

	/**
	 * @method: 이후 슬라이드 이동
	 */
	function toNext() {
		var now_idx = getNowIdx();
		
		toSlide( ++now_idx );
	}

	/**
	 * 해당 슬라이드로 이동
	 * @param: {Number} 이동할 슬라이드
	 */
	function toSlide( _to_idx ) {
		var pos = 0,
			diff = 0,
			now_idx = getNowIdx(),
			gap = _to_idx - now_idx;
		
		if ( is_Move ) { // 이동중이면 함수 종료
			return false;
		}

		if ( _to_idx === now_idx ) { // 현재 슬라이면 종료
			return false;
		}

		if ( _to_idx < 0 || _to_idx > list_Len - 1 ) { // 범위 초과면 종료
			return false;
		}

		// 현재 위치에 이동할 위치
		pos = gap * item_Width;
		pos = pos * -1;

		setNowIdx( _to_idx );
		toSlideTransitionBefore();
		toSlideTransition( setting.duration, pos );
	}

	/**
	 * @method: 이동 전 이벤트
	 */
	function toSlideTransitionBefore() {
		setTransitionBefore();

		if ( typeof setting.before === 'function' ) {
			setting.before( getNowIdx() );
		}
	}

	/**
	 * @method: 애니메이션 설정, 스피드 기본값은 0
	 * @param {Number} 추가 위치
	 * @param {Number} 속도
	 */
	function toSlideTransition( _speed, _add_pos ) {
		helper.setListTransition( _speed, _add_pos, true );
	}

	/**
	 * @method: 이동 후 이벤트
	 * @param {Number} 속도
	 */
	function toSlideTransitionAfter( e ) {
		setTransitionAfter();

		if ( typeof setting.active === 'function' ) {
			setting.active( getNowIdx() );
		}
	}

	/**
	 * 애니메이션 이전
	 */
	function setTransitionBefore() {
		is_Move = true;
		stopSlideShow();
	}

	/**
	 * 애니메이션 이후
	 */
	function setTransitionAfter() {
		is_Move = false;
		startSlideShow();
	}

	if ( constructor() ) {

		// 공개 API
		return {
			startSlideShow: startSlideShow,
			stopSlideShow: stopSlideShow,
			resizeView: resizeView,
			getIdx: getNowIdx,
			toNext: toNext,
			toPrev: toPrev,
			toSlide: toSlide
		};
	} else { // 미지원시
		setInitStyle({
			is_not_support: true
		});
	}
};