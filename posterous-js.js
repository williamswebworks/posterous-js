// posterous-js.js
// Created by Bryan Grohman
// bgrohman@gmail.com

//This file is part of posterous-js.
//
//posterous-js is free software: you can redistribute it and/or modify
//it under the terms of the GNU General Public License as published by
//the Free Software Foundation, either version 3 of the License, or
//(at your option) any later version.
//
//posterous-js is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//GNU General Public License for more details.
//
//You should have received a copy of the GNU General Public License
//along with posterous-js.  If not, see <http://www.gnu.org/licenses/>.


if (!posterousjs) { var posterousjs = {}; }
if (!posterousjs.reading) { posterousjs.reading = {}; }


/**
 *  posterousjs.reading.getSites
 *
 *  Returns an array of objects containing information for
 *  the caller's posterous sites.
 *
 *  Site information objects will have the following members:
 *  id, name, url, is_private, is_primary, comments_enabled, num_posts
 *
 *  NOTE: This requires Posterous authentication through HTTP.
 *
 */
posterousjs.reading.getSites = function(callback) {
    
    var parse = function(xml) {
        var s = [];
        var sites = $(xml).find('rsp:first').find('site'); 
        for (var i = 0; i < sites.length; i++) {
            var id = $(sites[i]).find('id:first').text();
            var name = $(sites[i]).find('name:first').text();
            var url = $(sites[i]).find('url:first').text();
            var is_private = $(sites[i]).find('private:first').text();
            var is_primary = $(sites[i]).find('primary:first').text();
            var comments_enabled = $(sites[i]).find('commentsenabled:first').text();
            var num_posts = parseInt( $(sites[i]).find('num_posts:first').text() );
            s.push({
                'id': id,
                'name': name,
                'url': url,
                'is_private': (is_private == 'true') ? true : false,
                'is_primary': (is_primary == 'true') ? true : false,
                'comments_enabled': (comments_enabled == 'true') ? true : false,
                'num_posts': num_posts
            });
        }
        if (callback != undefined && callback != null) {
            callback(s);
        }
    };

    $.ajax({
        type: 'GET',
        url: 'http://posterous.com/api/getsites',
        dataType: 'xml',
        success: parse,
        error: function() {
            alert('posterousjs.reading.getSites error');
        }
    });

};


/**
 *  posterousjs.reading.getImages
 *
 *  Returns an array of objects containing information for the images
 *  from a posterous site.
 *  
 *  Image information objects will have the following members:
 *  id, url, width, height, post_link, post_title, date
 *
 */
posterousjs.reading.getImages = function(site_id, callback, options) {

    var opts = options;
    // Possible options:
    // num_posts (integer, default 1)
    // num_images ('all', or an integer, default 1)
    // image_size ('medium' or 'thumb', default 'medium')
    // tag (tag name to filter posts, default is not present)
    var defaults = {
        num_posts: 1,
        num_images: 1, // number of images per post
        image_size: 'medium' // can be 'medium' or 'thumb'
    };
    var attr = function(a) {
        if (opts) {
            return opts[a] ? opts[a] : defaults[a];
        }
        else {
            return defaults[a];
        }
    };

    var parse = function(xml) {
        var images = [];
        var posts = $(xml).find('rsp:first').find('post');
        for (var j = 0; j < posts.length && j < attr('num_posts'); j++) {
            var link = $(posts[j]).find('link:first').text();
            var title = $(posts[j]).find('title:first').text();
            var date_str = $(posts[j]).find('date:first').text();
            var media_tags = $(posts[j]).find('media');
            for (var i = 0; i < media_tags.length && (attr('num_images') == 'all' || i < attr('num_images')); i++) {
                var media_type = $(media_tags[i]).find('type:first').text();
                if (media_type == 'image') {
                    var img = $(media_tags[i]).find(attr('image_size')+':first');
                    var u = $(img).find('url:first').text();
                    var w = $(img).find('width:first').text();
                    var h = $(img).find('height:first').text();
                    images.push({
                        'id': 'post_'+j+'_image_'+i, 
                        'url':u, 
                        'width': w, 
                        'height': h, 
                        'post_link': link, 
                        'post_title': title, 
                        'date': date_str
                    });
                }
            }
        };
        if (callback != undefined || callback != null) {
            callback(images);    
        }
    };

    var request_opts = {'site_id':site_id, 'num_posts':attr('num_posts')};
    if (attr('tag')) {
        request_opts['tag'] = attr('tag');
    }
    $.ajax({
        type: 'GET',
        url: 'http://posterous.com/api/readposts',
        data: request_opts,
        dataType: 'xml',
        success: parse,
        error: function() {
            alert('posterousjs.reading.getImages error');
        }
    });

};
