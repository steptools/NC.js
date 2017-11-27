function EmbedFeed(feed, elemid) {
    $.ajax(feed, {
        accepts:{ xml:"application/rss+xml" },
        dataType:"xml",
        success:function(data) {
  	    $(data).find("item").each(function () {
		// or "item" or whatever suits your feed
                var el = $(this);
 		var ln = $('<div>');
		var datestr = new Date(el.find("pubDate").text()).
		    toISOString().slice(0,10);
		
		var tag = $('<a>');
		tag[0].href = el.find("link").text();
		tag[0].innerText = datestr +' - '+ el.find("title").text();
		ln.append(tag);

		tag = $('<div>');
		tag.last().addClass("small");
		tag[0].innerHTML = el.find("description").text();
		ln.append(tag);

		$('#'+elemid).append(ln);
            });
        }   
    });
    
}


function EmbedFeedHeaders(feed, elemid) {
    $.ajax(feed, {
        accepts:{ xml:"application/rss+xml" },
        dataType:"xml",
        success:function(data) {
  	    $(data).find("item").each(function () {
		// or "item" or whatever suits your feed
                var el = $(this);
 		var ln = $('<div>');
		var datestr = new Date(el.find("pubDate").text()).
		    toISOString().slice(0,10);
		
		var tag = $('<a>');
		tag[0].href = el.find("link").text();
		tag[0].innerText = datestr +' - '+ el.find("title").text();
		ln.append(tag);
		$('#'+elemid).append(ln);
            });
        }   
    });
    
}
