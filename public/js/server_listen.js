$(document).ready(function() {

	function sendMessage() {
		var post = $("#content-post");
		var page_request = $('#form-post').attr('action');
		
		$.ajax({
			type: 'POST',
			dataType: 'html', //dataType: 'json', //'application/json; charset=utf-8',
			url: page_request,
			data: { 'content': stripTags(post.val()) },
			/*beforeSend: function() {
				console.log('user is sending: ' + this.data);
			},*/
			success: function(response) {
				//console.log("success handler with return: " + response);
				post.val('');
				post.focus();
			},
			/*error: function(xhr, ajaxOptions, thrownError) {
				console.log(xhr.status);
				console.log(thrownError);
			}*/
		});
	}

	function disable_user(user) {
		$(user)
		.addClass('inactive-user', 500)
		/*.animate({
			backgroundColor: '#999'
		}, 500, 'linear', function() {
			$(this).addClass('inactive-user');
		})*/
		.delay(1000*60*1)
		.fadeOut("normal", function() {
			$(this).remove();
		});
	}

	function enable_user(user) {
		$(user)
		.stop(true, true)
		.removeClass('inactive-user', 500);
	}

	// Socket.IO: the cross-browser WebSocket for realtime apps.
	window.io = io.connect();

	io.on('connect', function() { //console.log('Connecting to server...');
		io.emit('hello-server?', function(data) { //console.log(data.success);

			// recarga el chat cada un minuto para mostrar el timeago actual de los mensajes
			var reload_page = setInterval(function() {

				io.emit('update-posts', function(posts) {
					if (posts) {
						var all_post = '';
						var position_scroll = $(".messages").scrollTop();

						$(posts).each(function(i, post) {						
							all_post += '<div class="post">' +
							'<div class="user"><img src="'+post.user.avatar+'" alt="'+post.user.displayname+'"></div>' +
							'<div class="message">'+post.content+'</div>' +
							'<div class="timeago">'+post.date_post.timeago+'</div>' +
							'</div>';
						});

						if ( !empty(all_post) ) {
							$(".messages").html(all_post).scrollTop(position_scroll);
						}
					} else {
						clearInterval(reload_page);
					}
				});

			}, 1000*60*2);

			$(".messages").scrollTop($(".messages")[0].scrollHeight); //$(".messages").scrollTop($(".messages").prop('scrollHeight'));

		});
	});

	io.on('login-user', function(user) {
		var new_user = 'li#' + user._id;

		if ( $(new_user).length > 0 && $(new_user).hasClass('inactive-user') ) {
			enable_user(new_user);
		} else {
			new_user = '<li id="'+user._id+'" class="active-user hidden">' +
			'<div class="avatar"><img src="'+user.avatar+'" title="'+user.displayname+'"></div>' +
			'<div class="user-info">' +
			'<div class="username"><a href="/user/'+user.username+'">'+user.displayname+'</a></div>' +
			'<div class="last-logon">'+moment(user.last_logon).format("dddd D, [a las] h:mm a")+'</div>' +
			'</div>' +
			'</li>';

			$('#users-online ul.users').append(new_user);
			$('#' + user._id).fadeIn("normal").removeClass("hidden");
		}
	});

	io.on('logout-user', function(user) {
		$('#users-online ul.users li').each(function(i, item) {
			if (item.id === user._id) {
				disable_user(item);
			}
		});
	});

	io.on('new-post', function(post) {
		if (!post.error) {
			var new_post = '<div class="post">' +
			'<div class="user"><img src="'+post.user.avatar+'" alt="'+post.user.username+'"></div>' +
			'<div class="message">'+post.content+'</div>' +
			'<div class="timeago">'+moment(post.date_post).fromNow()+'</div>' +
			'</div>';

			$('#chat .chaton .messages').append(new_post);

			var $elem = $('.messages'); // the element inside of which we want to scroll
			$($elem).animate({
				scrollTop: $elem.prop('scrollHeight') //$elem[0].scrollHeight
			}, 800);
		} else {
			$('.msgbox').html(post.error);
		}
	});

	io.on('change-user-status', function(data) {
		$('#users-online ul.users li').each(function(i, item) {
			if (item.id === data.user._id) {
				if (data.action == 'enable' && ($(item).length > 0 && $(item).hasClass('inactive-user'))) {
					enable_user(item);
				} else if (data.action == 'disable' && $(item).length > 0) {
					disable_user(item);
					$(item).stop(true, true);
				}
			}
		});
	});


	//$('.write-post').on('click', '#send-post', function(event) { //$("#send-post").click(function(event) {
	$('.write-post').on('submit', '#form-post', function(event) {
		event.preventDefault();
		var post = $("#content-post");

		if ( !empty(post.val().trim()) ) {
			sendMessage();
		}

		post.focus();
	});
	$("#content-post").keyup(function(event) {
		if ( (event.keyCode == 13) && ( !empty($(this).val().trim()) ) ) {
			event.preventDefault();
			sendMessage();
		}
	});


	$(window).on('beforeunload', function() {
		var e = $.Event('webapp:page:closing');
		$(window).trigger(e); // let other modules determine whether to prevent closing
		if(e.isDefaultPrevented()) {
			// e.message is optional
			return e.message || '¿Desea cerrar la página?';
		}
	});
	$(window).on('webapp:page:closing', function(e) {
		if( !empty($("#content-post").val().trim()) ) {
			e.preventDefault();
			e.message = 'El mensaje no enviado se perderá, ¿desea continuar y cerrar la página?';
		} else {
			io.emit('page-closing');
		}
	});

});