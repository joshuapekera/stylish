$(function() {
	
	navInit();
	
	var dl = document.location,
		hash = dl.hash.substr(1),
		w = window;

	getSearchResults(hash);
	
	initPopup();
	
	$('.style-install').live('click',function() {
		var t = $(this).attr('disabled','disabled').text('Downloading'),
			s = t.parent();
			id = t.attr('rel'),
			options = false;
		s.addClass('busy');
		
		$.get('http://userstyles.org/styles/'+id+'?v='+Math.random(), function(html) {
			options = $('#style-options',html).length ? true : false;
			if (options) {
				options = '?';
				$('#style-options li', html).each(function(i,e) {
					e = $('select, input', e);
					options += (i?'&':'')+e.attr('name')+'='+e.val().replace('#','%23');
				});
			} else {
				options = '';
			}
			
			$.getJSON('http://userstyles.org/styles/chrome/'+id+'.json'+options,function(json) {
				t.text('Installed');
				s.removeClass('busy').addClass('installed');
				json.enabled = true;
				ping("saveStyle",{"id":id,"json":json});
			});
			
		});
	});
	
	$('.pagination a').live('click',function(event) {
		event.preventDefault();
		var a = $(this),
			href = a.attr('href'),
			content = $('#searchresult dd');
		if (href!='NaN') {
			
			$('#searchresult').addClass('busy');
			
			$('body').animate({scrollTop:0},function() {
				content.slideUp(function() {
					content.empty().show();
					getSearchResults(hash,a.attr('href'));
				})	
			});

		}
		return false;
	})
	
	$('#ssearch').live('change',function() {
		hash = $(this).val();
		if (hash!='') getSearchResults(hash);
	})
	
	$('#subcategory-list li').live('click',function() {
		hash = $(this).attr('tname');
		$('#ssearch').val(hash).trigger('change');
	});
	
	$('.screenshot').live('click',function() {
		var i = $(this),
			src = i.attr('src').replace('_thumbnails','s'),
			img = new Image(),
			w,h;
		$('#popup')
			.trigger('show')
			.append(
				$('<img>', {src: src, 'class': 'after'}),
				$('<img>', {src: src.replace('_after','_before'), 'class':'before'}).error(function() {$(this).remove()})
			);			
	});
});

function initPopup() {
	$('body').append(
		$('<div/>', {id:'popup'})
			.hide()
			.bind('hide',function() {
				$(this).fadeOut(function() {
					$(this).empty();
				});
			})
			.bind('show', function() {
				$(this).fadeIn();
			})
			.bind('click', function() {
				$(this).trigger('hide');
			})
	);
	
	$(document).keyup(function(e) {
		if (e.keyCode == 27) {
			$('#popup').trigger('hide');
		}
	});
	
};

function renderList(html,host) {
	$('#content dt input').val(host);
	var content = $('#searchresult dd').empty();
	if ($('.style-brief',html).length) {
		html = $('#main-article',html).html();
		content.append(html);
		$('a',content).each(function(n,a) {
			var a = $(a);
			if (a.hasClass('delete-link')) {
				a.parent().parent().parent().attr('id',a.attr('href').replace('/styles/delete/',''));
			}
			a.not('.pagination a').replaceWith(a.html());
		});
		$('.style-brief-control-links, div[style="clear:left"], .ad').remove();
		$('.style-brief-stats').each(function() {
			var d = $(this), s = d.parent().parent(), a = s.attr('average-rating'),
				r = Math.round(a*2)*10;
			d.html(
				$('<span/>',{class:'ratio'}).append(
					$('<span/>',{title:'Average rating: '+a}).css('width',r+'%')
				)
			);
		});
		
		imgSize();
		
		$('.style-brief').each(function() {
			var s = $(this).addClass('cln'), id = s.attr('id');
			s.append(
				$('<button/>',{text:'Install',rel:id, class:'style-install'})
			);
		})
	
		renderNav();
	
		ping("getInstalledStyles",'');
	} else {
		content.html('No styles found');
	}
}

function imgSize() {
	$('.screenshot').each(function() {
		$(this).load(function() {
			var i = $(this),
				src = i.attr('src'),
				img = new Image(),
				w, h, p;
			img.src = src;
			h = img.height;
			w = img.width;
			p = 145/83;
			if (w/h > p) {
				w = (w/h)*83;
				h = 83;
			} else {
				w = 146;
				h = 'auto';
			}
			i.css({
				left: (146-w)/2,
				top: (84-h)/2,
				height: h,
				width: w
			});
		});
	});
};

function renderNav() {
	
	$('.pagination a').each(function() {
		var a = $(this),
			href = a.attr('href');
		a.attr('href', href.split('?')[1].replace('page=','') )
	})
	
	
	var nav = $('.pagination'),
		total = parseInt(nav.children().last().prev().text()),
		current = parseInt($('.current',nav).text()),
		next = parseInt($('.next_page',nav).attr('href')),
		prev = parseInt($('.prev_page',nav).attr('href'));
		content = $('#searchresult dd');
//	console.log(total,current,next,prev);
	nav.empty().append($('<a/>',{href:prev,class:'prev'}));
	for (var i=1; i <= total ; i++) {
		var c = (i==current);
		nav.append($('<a/>',{href:i,class:'point'+(c?' active':'')})); // ○
	};
	nav.append($('<a/>',{href:next,class:'next'}));
	
//	nav.clone().prependTo(content);
}

function renderSitesList(html) {
	var content = $('#searchresult dd').empty();
	html = $('#subcategory-list', html);
	content.append(html);
	$('a', content).each(function() {
		var a = $(this), li = a.parent(),
			n = a.attr('href').replace('/styles/browse/','').replace('/styles/browse?category=',''),
			c = /(\d+)/.exec(li.text().replace(',',''))[0];
		li.attr({
			'tname': n,
			'tcount': c 
		}).html(n+'<i>'+c+'</i>')
	})
};

function getSearchResults(host,page) {
	$('#searchresult').addClass('busy');
	if (host) {
		document.title = 'Usertyles for «'+host+'»';
//		var usss = 'http://userstyles.org/styles/browse/';
		var usss = 'http://userstyles.org/styles/browse/site?search_terms=';
		$.get(usss+host+'&per_page=22'+(page?'&page='+page:''), function(html) {
			$('#searchresult').removeClass('busy');
			renderList(html,host);
		})
	} else {
		document.title = 'Search Usertyles';
		var usss = 'http://userstyles.org/categories/site';
		$.get(usss, function(html) {
			$('#searchresult').removeClass('busy');
			renderSitesList(html);
		})
	}
}

function log(l) {
	console.log(l);
}

function ping(name,data) {
	safari.self.tab.dispatchMessage(name,data);
}

function pong(event) {
	var n = event.name,
		m = event.message,
		t = event.target;
	switch(n) {
		case 'setInstalledStyles':
			$('.style-brief').removeClass('installed');
			$.each(m,function(i,el) {
				$('#'+el.id).addClass('installed');
				$('button[rel="'+el.id+'"]').attr('disabled','disabled').text('installed');
			});
		break;
	}
}

safari.self.addEventListener("message", pong, true);