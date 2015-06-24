/*!*
 * @autor: Blim - Koo Chi Hoon(kkh975@naver.com)
 * @license http://blim.mit-license.org/
 */
( function( $ ){

	'use strict';
	
	/**
	 * @method: 슬라이더 플러그인
	 */
	$.fn.swipePaper = function( option ){
		option         = option || {};
		option.$list   = option.$list || $( this ).find( '> ul > li' );
		option.$wrap   = option.$wrap || $( this ).find( '> ul' );
		option.wrap    = option.$wrap.toArray() || [];
		option.list    = option.$list.toArray() || [];
		option.pages   = ( option.$pages && option.$pages.toArray ) ? option.$pages.toArray() : [];
		option.toStart = ( option.$toStart && option.$toStart.toArray ) ? option.$toStart.toArray() : [];
		option.toStop  = ( option.$toStop && option.$toStop.toArray ) ? option.$toStop.toArray() : [];
		option.toPrev  = ( option.$toPrev && option.$toPrev.toArray ) ? option.$toPrev.toArray() : [];
		option.toNext  = ( option.$toNext && option.$toNext.toArray ) ? option.$toNext.toArray() : [];

		return this.each( function(){
			$( this ).data( 'SwipePaper', new SwipePaper( option ));
		});
	};

	/**
	 * @method: 슬라이더쇼 시작 플러그인
	 */
	$.fn.swipePaper2start = function(){
		return this.each( function(){
			$( this ).data( 'SwipePaper' ).startSlideShow();
		});
	};

	/**
	 * @method: 슬라이더쇼 정지 플러그인
	 */
	$.fn.swipePaper2stop = function(){
		return this.each( function(){
			$( this ).data( 'SwipePaper' ).stopSlideShow();
		});
	};

	/**
	 * @method: 이전 슬라이더 이동 플러그인
	 */
	$.fn.swipePaper2prev = function(){
		return this.each( function(){
			$( this ).data( 'SwipePaper' ).toPrev();
		});
	};

	/**
	 * @method: 다음 슬라이더 이동 플러그인
	 */
	$.fn.swipePaper2next = function(){
		return this.each( function(){
			$( this ).data( 'SwipePaper' ).toNext();
		});
	};

	/**
	 * @method: 특정 슬라이더 이동 플러그인
	 */
	$.fn.swipePaper2slide = function( _idx ){
		return this.each( function(){
			$( this ).data( 'SwipePaper' ).toSlide( _idx );
		});
	};
}( jQuery ));

 /*!*
 * @method: SwipePaper 함수
 */
var SwipePaper = function( __setting ){

    "use strict";

	var MAX_TOUCH_MOVE   = 100,
		DISTANCE         = 100,
		setting          = null,
		D_Wrap           = null,
		D_Plist          = null,
		D_List           = null,
		D_To_Pages       = null,
		D_To_Start       = null,
		D_To_Stop        = null,
		D_To_Prev        = null,
		D_To_Next        = null,
		slide_Show_Timer = null,
		is_Slide_Show    = false,
		is_Move          = false,
		list_Width       = 0,
		list_Len         = 0,
		list_Pos         = 0,		// 현재 위치
		list_Pos_Arr     = [],		// 각자의 위치
		item_Width       = 0,
		now_Idx          = 0,
		to_Idx           = 0,
		browser_Prefix   = {};

	var default_Option = {
		wrap            : null,		// require, 리스트 감싸는 태그
		list            : null,		// require, 리스트
		pages           : null,		// 슬라이더 페이징 이동
		toStart         : null,		// 애니메이션 시작 버튼
		toStop          : null,		// 애니메이션 멈춤 버튼
		toPrev          : null,		// 이전 이동 버튼
		toNext          : null,		// 다음 이동 버튼
		startEvents     : 'click',	// 슬라이드쇼 시작 이벤트
		stopEvents      : 'click',	// 슬라이드쇼 정지 이벤트
		moveEvents      : 'click',	// 이동 작동 이벤트
		pageEvents      : 'click',	// 페이징 작동 이벤트
		slideShowTime   : 3000,		// 슬라이드쇼 시간
		touchMinumRange : 10,		// 터치시 최소 이동 거리
		firstItemMinPos : 50,		// 처음 아이템의 최소 위치(퍼센트)
		lastItemMaxPos  : 50,		// 마지막 아이템의 최대 위치(퍼센트)
		loop            : true,		// 무한 여부
		isSnap          : false,	// 스냅 여부
		duration        : 400,		// 애니메이션 시간
		create          : null,		// 생성 후 콜백함수
		before          : null,		// 액션 전 콜백함수
		active          : null		// 액션 후 콜백함수
	};

	var helper = { 
		/**
		 * @method: jQuery extend 기능
		 */
		extend: function( _target, _object ){
			var prop = null,
				return_obj = {};

			for( prop in _target ){
				return_obj[ prop ] = prop in _object ? _object[ prop ] : _target[ prop ];
			}

			return return_obj;
		},

		/**
		 * @method: 배열 여부
		 */
		isArray: function( _arr ){
			return _arr && Object.prototype.toString.call( _arr ) === '[object Array]';
		},

		/**
		 * @method: DOM에서 배열변환(Array.slice 안먹힘)
		 */
		dom2Array: function( _dom ){
			var arr = [],
				i = 0,
				len = 0;

			if ( _dom ){
				len = _dom.length;

				if ( len > 0 ){
					for ( i = 0; i < len; i++ ){
						arr.push( _dom[ i ] );
					}
				} else {
					arr.push( _dom );
				}

				return arr;
			} else {
				return null;
			}
		},

		/**
		 * @method: DOM에서 배열변환(Array.slice 안먹힘)
		 */
		object2Array: function( _obj ){
			var arr = [];

			for ( var key in _obj ){
				arr.push( _obj[ key ] );
			}

			return arr;
		},

		/**
		 * @method: css3의 transition 접미사
		 */
		getCssPrefix: function(){
			var transitionsCss   = [ '-webkit-transition', 'transition' ],
				transformsCss    = [ '-webkit-transform', 'transform' ],
				transitionsJs    = [ 'webkitTransition', 'transition' ],
				transformsJs     = [ 'webkitTransform', 'transform' ],
				transitionsendJs = [ 'webkitTransitionEnd', 'transitionend' ],
				styles           = window.getComputedStyle( document.body, '' ),
				prefixCss        = ( helper.object2Array( styles ).join('').match( /-(webkit|moz|ms|o)-/ ) || (styles.OLink === '' && [ '', 'o' ]))[ 1 ],
				prefixJs         = ( 'WebKit|Moz|MS|O' ).match( new RegExp('(' + prefixCss + ')', 'i' ))[ 1 ],
				isWebkit         = prefixCss === 'webkit';

			return {
				'prefixCss'        : prefixCss,
				'prefixJs'         : prefixJs,
				'transitionsCss'   : transitionsCss[ isWebkit ? 0 : 1 ],
				'transformsCss'    : transformsCss[ isWebkit ? 0 : 1 ],
				'transformsJs'     : transformsJs[ isWebkit ? 0 : 1 ],
				'transitionsJs'    : transitionsJs[ isWebkit ? 0 : 1 ],
				'transitionsendJs' : transitionsendJs[ isWebkit ? 0 : 1 ]
			};
		},

		/**
		 * @method: css3 animation 지원 여부
		 */
		hasCss3Animation: function(){
			return browser_Prefix.transitionsJs in document.createElement( 'div' ).style;
		},

		/**
		 * @method: 전체 애니메이션 설정
		 */
		setListTransition: function( _speed, _to_pos, _is_set ){
			// 현재 위치가 처음 슬라이더 위치를 벗어날 때
			/*if ( pos > 0 ){
				pos = 0;
			} else if ( Math.abs( pos ) > item_Width * list_Len ){ // 현재 위치가 마지막 슬라이더 위치를 벗어날 때
				pos = list_Width * list_Len;
			}*/

			/*
			// 스냅기능 비활성화시, 현재 위치가 정확하게 떨어지지 않을 때 교정
			else if ( pos % list_Width !== 0 ){

				// 실제 위치해야할 위치값과 현재값의 차이를 더하거나 뻄
				// 현재 슬라이드보다 작은 슬라이더 이동시는 더함
				diff = Math.abs( pos ) - ( list_Width * _to_idx );
				pos = diff < 0 ? pos + diff : pos - diff;
			}
			*/

			// list_Pos = pos;

			helper.setCss3Transition( D_Plist, _speed, _to_pos );

			if ( _is_set ){
				list_Pos = _to_pos;
			}
		},

		/**
		 * @method: 애니메이션 설정
		 */
		setCss3Transition: function( _dom, _speed, _pos ){
			helper.setCss3( _dom, 'transition', _speed + 'ms' );
			helper.setCss3( _dom, 'transform', 'translateX('+ _pos + '%)' );
		},

		/**
		 * @method: css3 설정
		 */
		setCss3: function( _dom, _prop, _value ){
			if ( _prop === 'transition' ){
				_dom.style[ browser_Prefix.transitionsJs ] = _value;
			} else if ( _prop === 'transform' ){
				_dom.style[ browser_Prefix.transformsJs ] = _value;
			} else {
				_dom.style[ _prop ] = _value;
				_dom.style[ '-' + browser_Prefix.prefixJs + '-' + _prop ] =  _value;
			}
		},

		/**
		 * @method: 버튼 이벤트 설정
		 */
		setBtnEvent: function( _doms, _evts, _callback ){
			var evt_arr = _evts.split( ',' ),
				evt_idx = evt_arr.length,
				idx = _doms.length;

			while( --evt_idx > -1 ){
				while( --idx > -1 ){
					( function( __idx ){
						_doms[ idx ].addEventListener( evt_arr[ evt_idx ], function( e ){
							_callback( __idx );
							e.preventDefault();
						});
					}( idx ));
				}
			}
		}
	};

	var touchEvents = { 
		is_touch_start : false,
		touch_start_x  : 0,
		touch_start_y  : 0,
		move_dx        : 0,

		/**
		 * @method: 변수 초기화
		 */
		setInitVaiable: function(){
			touchEvents.is_touch_start = false;
			touchEvents.touch_start_x  = 0;
			touchEvents.touch_start_y  = 0;
			touchEvents.move_dx        = 0;
		},

		/**
		 * @method: 터치 시작 이벤트
		 * @param: {Object} 이벤트 객체
		 */
		setStart: function( e ){
			// 이미 start된 동작이 있거나 움직이면 중복되지 않게 막음
			if ( touchEvents.is_touch_start || is_Move ){
				return false;
			}

			stopSlideShow();

			if ( !touchEvents.is_touch_start && e.type === "touchstart" && e.touches.length === 1 ){
				touchEvents.is_touch_start = true;
				touchEvents.touch_start_x = e.touches[ 0 ].pageX;
				touchEvents.touch_start_y = e.touches[ 0 ].pageY;
			}
		},

		/**
		 * @method: 터치 중 이벤트
		 * @param: {Object} 이벤트 객체
		 */
		setMove: function( e ){
			var drag_dist = 0,
				scroll_dist = 0,
				tmp_now_pos = 0;

			if ( is_Move ){
				return;
			}

			// 이미 start된 동작이 있어야만 작동
			if ( touchEvents.is_touch_start && e.type === "touchmove" && e.touches.length === 1 ){
				drag_dist = e.touches[ 0 ].pageX - touchEvents.touch_start_x;		// 가로 이동 거리
				scroll_dist = e.touches[ 0 ].pageY - touchEvents.touch_start_y;		// 세로 이동 거리
				touchEvents.move_dx = ( drag_dist / list_Width ) * 100;				// 가로 이동 백분률
				
				// 드래그길이가 스크롤길이 보다 클때
				if ( Math.abs( drag_dist ) > Math.abs( scroll_dist )){ 
					// TODO, 최소/최대 길이 생각하기
					// TODO, snap기능 -> 걸리는 느낌나게 하기
					touchEvents.move_dx = Math.max( -100, Math.min( 100, touchEvents.move_dx ));
					tmp_now_pos = list_Pos + touchEvents.move_dx;
					helper.setListTransition( 0, tmp_now_pos );
					e.preventDefault();
				}				
			}
		},

		/**
		 * @method: 터치 완료 이벤트
		 * @param: {Object} 이벤트 객체
		 */
		setEnd: function( e ){
			var to_idx = 0,
				tmp_now_pos = 0;

			if ( is_Move ){
				return;
			}

			if ( over_touch && can_move ){
				is_to_next ? toNext() : toPrev();
			} else {
				helper.setListTransition( setting.duration, 0 + space_Width );
			}

			if ( touchEvents.is_touch_start && e.type === 'touchend' ){
				tmp_now_pos = list_Pos + touchEvents.move_dx;
				to_idx = getNowIdxByPos( tmp_now_pos );

				// 이전이나 이후로 가려면 is_Move해제 후 이동
				is_Move = false;

				// 스냅기능 활성화시
				if ( setting.isSnap ){
					// 동일한 슬라이드내에서는 toSlide 작동하지 않아 바로 실행하도록
					if ( getNowIdx() === to_idx ){
						setToIdx( to_idx );
						toSlideAnimateBefore();
						toSlideAnimate( setting.duration );
					} else {
						toSlide( to_idx );
					}
				} else {
					helper.setListTransition( 0, tmp_now_pos, true );

					// trnstion이 0이기 때문에 toSlideAnimateAfter 발생안에서 강제 실행
					setToIdx( to_idx );
					toSlideAnimateAfter();
				}
			}

			if ( e.type === 'touchcancel' ){
				is_Move = false;
			}
			
			touchEvents.setInitVaiable();
		}
	};

	/**
	 * @method: 생성자
	 */
	function constructor(){
		// 플러그인에서 배열로 넘겨줄때 패스
		// javascrit로 바로 들어오면 dom2Array
		setting = helper.extend( default_Option, __setting );
		D_Plist = helper.isArray( setting.wrap ) ? setting.wrap : helper.dom2Array( setting.wrap ); 
		D_List  = helper.isArray( setting.list ) ? setting.list : helper.dom2Array( setting.list ); 

		// 필수요소 체크
		if ( !D_List || !D_Plist ){ 
			return false;
		}

		list_Len = D_List.length;
		D_Plist = D_Plist[ 0 ];
		D_Wrap = D_Plist.parentNode;

		browser_Prefix = helper.getCssPrefix();
		setting.touchMinumRange = Math.max( 1, Math.min( 100, setting.touchMinumRange ));

		// list이거나, 리스트가 1이하이면 함수 종료
		if ( list_Len < 2 ){ 
			return false;
		}

		// 필수 요소 체크
		if ( !( helper.hasCss3Animation() && 'addEventListener' in window && 'querySelector' in document )){
			return false;
		}

		// 슬라이드쇼 옵션 존재
		if ( setting.slideShowTime ){ 
			if ( typeof setting.slideShowTime === 'boolean' ){
				is_Slide_Show = setting.slideShowTime;

				// true일때, 숫자값 대입
				if ( is_Slide_Show ){ 
					setting.slideShowTime = default_Option.slideShowTime;
				}
			}

			if ( typeof setting.slideShowTime === 'string' ){
				setting.slideShowTime = parseInt( setting.slideShowTime, 10 );
			}

			// 타입이 숫자가 아니면
			if ( isNaN( setting.slideShowTime )){ 
				is_Slide_Show = false;
			} else {
				is_Slide_Show = true;

				// 슬라이드쇼가 애니메이션 시간보다 짧을때
				if ( setting.duration * 2 >= setting.slideShowTime ){ 
					setting.slideShowTime = setting.duration * 2;
				}
			}
		}

		// 애니메이션 시작 버튼
		if ( setting.toStart ){ 
			D_To_Start = helper.isArray( setting.toStart ) ? setting.toStart : helper.dom2Array( setting.toStart );
			helper.setBtnEvent( D_To_Start, setting.startEvents, startSlideShow );
		}

		// 애니메이션 멈춤 버튼
		if ( setting.toStop ){ 
			D_To_Stop  = helper.isArray( setting.toStop ) ? setting.toStop : helper.dom2Array( setting.toStop );
			helper.setBtnEvent( D_To_Stop, setting.stopEvents, stopSlideShow );
		}

		// 왼쪽 버튼
		if ( setting.toPrev ){ 
			D_To_Prev  = helper.isArray( setting.toPrev ) ? setting.toPrev : helper.dom2Array( setting.toPrev );
			helper.setBtnEvent( D_To_Prev, setting.moveEvents, toPrev );
		}

		// 오른쪽 버튼
		if ( setting.toNext ){ 
			D_To_Next  = helper.isArray( setting.toNext ) ? setting.toNext : helper.dom2Array( setting.toNext );
			helper.setBtnEvent( D_To_Next, setting.moveEvents, toNext );
		}

		// 페이징 이동
		if ( setting.pages ){ 
			D_To_Pages = helper.isArray( setting.pages ) ? setting.pages : helper.dom2Array( setting.pages );
			helper.setBtnEvent( D_To_Pages, setting.moveEvents, function( _idx ){
				toSlide( _idx );
			});
		}

		D_Wrap.addEventListener( 'touchstart', touchEvents.setStart );
		D_Wrap.addEventListener( 'touchmove', touchEvents.setMove );
		D_Wrap.addEventListener( 'touchend', touchEvents.setEnd );
		D_Wrap.addEventListener( 'touchcancel', touchEvents.setEnd );
		D_Plist.addEventListener( browser_Prefix.transitionsendJs, toSlideAnimateAfter, false );

		var idx = D_List.length;

		while( --idx > -1 ){
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
	function setInitStyle( e ){
		list_Width = D_Wrap.offsetWidth;
		
		D_Wrap.style.position  = 'relative';
		D_Wrap.style.overflowY = 'hidden';
		D_Wrap.style.overflowX = e.is_not_support ? 'scroll' : 'hidden';

		D_Plist.style.position   = 'absolute';
		D_Plist.style.width      = '100%';
		D_Plist.style.marginLeft = setting.firstItemMinPos + '%';

		for ( var i = 0, len = list_Len, sumW = 0, w = 0, ml = 0, mr = 0, css_text = ''; i < len; i++ ){
			w = D_List[ i ].offsetWidth;
			ml = parseFloat( window.getComputedStyle( D_List[ i ] ).marginLeft );
			mr = parseFloat( window.getComputedStyle( D_List[ i ] ).marginRight );

			list_Pos_Arr.push( (( sumW + ml ) / list_Width ) * 100 );

			D_List[ i ].style.position    = 'absolute';
			D_List[ i ].style.top         = '0px';
			D_List[ i ].style.left        = ( sumW + ml ) + 'px';
			D_List[ i ].style.width       = w + 'px';
			D_List[ i ].style.marginLeft  = '0px';
			D_List[ i ].style.marginRight = '0px';

			sumW += ( w + ml + mr );
		}

		startSlideShow();

		if ( typeof setting.create === 'function' ){ 
			setting.create( getNowIdx());
		}
	}

	/**
	 * @method: 제거
	 */
	function destory(){
		var idx = D_List.length;

		D_Wrap.removeEventListener( 'touchstart', touchEvents.setStart );
		D_Wrap.removeEventListener( 'touchmove', touchEvents.setMove );
		D_Wrap.removeEventListener( 'touchend', touchEvents.setEnd );
		D_Wrap.removeEventListener( 'touchcancel', touchEvents.setEnd );
		
		while( --idx > -1 ){
			// 포커스시 애니메이션 on/off
			D_List[ idx ].removeEventListener( 'focus', stopSlideShow, false );
			D_List[ idx ].removeEventListener( 'blur', startSlideShow, false );
		}
	}

	/**
	 * @method: 애니메이션 시작
	 */
	function startSlideShow(){
		if ( is_Slide_Show && slide_Show_Timer === null ){
			slide_Show_Timer = setInterval( toNext, setting.slideShowTime );
		}
	}

	/**
	 * @method: 애니메이션 멈춤
	 */
	function stopSlideShow(){
		clearInterval( slide_Show_Timer );
		slide_Show_Timer = null;
	}

	/**
	 * @method: 화면 리사이즈
	 */
	function resizeView(){
		list_Width = D_Wrap.offsetWidth;	

		for ( var i = 0, len = list_Len, w = 0, ml = 0, mr = 0; i < len; i++ ){
			w = D_List[ i ].offsetWidth;
			ml = parseFloat( window.getComputedStyle( D_List[ i ] ).marginLeft );
			mr = parseFloat( window.getComputedStyle( D_List[ i ] ).marginRight );

			list_Pos_Arr.push( (( sumW + ml ) / list_Width ) * 100 );

			D_List[ i ].style.left = ( sumW + ml ) + "px";
			D_List[ i ].style.width = w + "px";

			sumW += ( w + ml + mr );
		}
	}

	/**
	 * @method: 현재 슬라이드 번호 가져오기
	 * @return: {Number}
	 */
	function getNowIdx(){
		return now_Idx;
	}

	/**
	 * @method: 현재 슬라이드 번호 설정하기
	 */
	function setNowIdx( _now_idx ){
		now_Idx = _now_idx;
	}

	/**
	 * @method: 현재 슬라이드 번호 가져오기
	 */
	function getNowIdxByPos( _pos ){
		var idx = 0,
			pos = Math.abs( _pos ? _pos : list_Pos ),
			len = list_Pos_Arr.length;

		// 처음일경우
		if ( list_Pos_Arr[ 1 ] > pos ){
			return 0;
		}

		// 마지막일 경우
		if ( list_Pos_Arr[ len - 1 ] < pos ){
			return len - 1;
		}

		// 나머지는, 각 범위안에 들어가는지 
 		for ( var i = 1, len = len - 1; i < len; i++ ){
 			if ( list_Pos_Arr[ i ] <= pos && list_Pos_Arr[ i + 1 ] > pos ){
				return i;
 			}
		}
	}

	/**
	 * @method: 이동할 포지션 얻기
	 */
	function getToIdx(){
		return to_Idx;
	}

	/**
	 * @method: 이동할 포지션 셋팅
	 */
	function setToIdx( _to_idx ){
		to_Idx = _to_idx;
	}

	/**
	 * @method: 이전 인덱스 얻기
	 */
	function getPrevIdx(){
		var idx = getNowIdx();

		if ( --idx < 0 ){
			idx = setting.loop ? list_Len - 1 : -1;
		}

		return idx;
	}

	/**
	 * @method: 다음 인덱스 얻기
	 */
	function getNextIdx(){
		var idx = getNowIdx();

		if ( ++idx > list_Len - 1 ){
			idx = setting.loop ? 0 : -1;
		}

		return idx;
	}

	/**
	 * @method: 이전 슬라이드 이동
	 */
	function toPrev(){
		toSlide( getPrevIdx() );
	}

	/**
	 * @method: 이후 슬라이드 이동
	 */
	function toNext(){
		toSlide( getNextIdx() );
	}

	/**
	 * 해당 슬라이드로 이동
	 * @param: {Number} 이동할 슬라이드
	 */
	function toSlide( _to_idx ){
		var now_idx = getNowIdx(),
			gap = _to_idx - now_idx,
			is_direct_access = arguments.length === 1;
		
		// 이동중이면 함수 종료
		if ( is_Move ){ 
			return false;
		}

		// 현재 슬라이면 종료
		if ( _to_idx === now_idx ){ 
			return false;
		}

		// 범위 초과면 종료
		if ( _to_idx < 0 || _to_idx > list_Len - 1 ){ 
			return false;
		}

		setToIdx( _to_idx );
		toSlideAnimateBefore();
		toSlideAnimate( setting.duration );
	}

	/**
	 * @method: 이동 전 이벤트
	 */
	function toSlideAnimateBefore(){
		setAnimateBefore();

		if ( typeof setting.before === 'function' ){
			setting.before( getNowIdx());
		}
	}

	/**
	 * @method: 애니메이션 설정, 스피드 기본값은 0
	 * @param {Number} 추가 위치
	 * @param {Number} 속도
	 */
	function toSlideAnimate( _time ){
		helper.setListTransition( _time, list_Pos_Arr[ getToIdx() ] * -1, true );
	}

	/**
	 * @method: 이동 후 이벤트
	 * @param {Number} 속도
	 */
	function toSlideAnimateAfter( e ){
		setNowIdx( getToIdx() );
		setAnimateAfter();

		if ( typeof setting.active === 'function' ){
			setting.active( getNowIdx());
		}
	}

	/**
	 * 애니메이션 이전
	 */
	function setAnimateBefore(){
		is_Move = true;
		stopSlideShow();
	}

	/**
	 * 애니메이션 이후
	 */
	function setAnimateAfter(){
		is_Move = false;
		startSlideShow();
	}

	if ( constructor()){
		setInitStyle();
		
		return {
			startSlideShow : startSlideShow,
			stopSlideShow  : stopSlideShow,
			resizeView     : resizeView,
			getIdx         : getNowIdx,
			toNext         : toNext,
			toPrev         : toPrev,
			toSlide        : toSlide
		};
	} else { 
		// 미지원시, 최소한의 스크롤 보장
		setInitStyle({
			is_not_support: true
		});
	}
};