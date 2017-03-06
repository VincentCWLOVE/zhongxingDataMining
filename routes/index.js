var express = require('express');
var router = express.Router();

function getData(reCall){
	// 引入依赖
	var request = require('request');
	var cheerio = require('cheerio');

	var options = {
	  method: 'GET',
	  url: 'http://weixin.sogou.com/weixin',  // 主机地址
	  qs: { 
	    query: 'gzcsnet', //公司公众号名称
	    
	  },
	  headers: {
	     'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
	     'Cache-control': 'no-cache' 

	   },
	};
	function callback(error, response, body) {

	    if (!error) {
	      var $ = cheerio.load(body);

	      var url = $(".img-box>a").attr("href");
	      console.log(url);

	      var new_options = {
	        method: 'GET',
	        url: url,  // 主机地址
	        qs: { 
	        },
	        headers: {
	           'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36'

	         },
	      };
	      request(new_options,function(err, res, result){
	          var new_cheerio = cheerio.load(result);
	          var length = new_cheerio("script").length;
	          for(var i = 0 ; i < length ; i++){
	            var text = new_cheerio(new_cheerio("script")[i]).text();
	            if (text.indexOf("msgList") > -1) {
	              text = text.replace(/<\/?[^>]*>/g,''); //去除HTML tag
	              text = text.replace(/[ | ]*\n/g,'\n'); //去除行尾空白
	              text = text.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
	              text=text.replace(/ /ig,'');//去掉 
	              text=text.replace(/^[\s　]+|[\s　]+$/g, "");//去掉全角半角空格
	              text=text.replace(/[\r\n]/g,"");//去掉回车换行

	              //获取截取范围
	              var start = text.indexOf("msgList=");
	              var end = text.indexOf(";seajs.use");
	              text = text.slice(start+8,end);


	              //将字符串截取成对象
	              var msgList = JSON.parse(text);


	              //当天发布的文章
	              var cur_lists = msgList.list[0].app_msg_ext_info.multi_app_msg_item_list;

	              var toutiao = {};
	              toutiao['author'] = msgList.list[0].app_msg_ext_info.author;
	              toutiao['content_url'] = msgList.list[0].app_msg_ext_info.content_url;
	              toutiao['cover'] = msgList.list[0].app_msg_ext_info.cover;
	              toutiao['digest'] = msgList.list[0].app_msg_ext_info.digest;
	              toutiao['title'] = msgList.list[0].app_msg_ext_info.title;

	              cur_lists.splice(0,0,toutiao);

	             

	              
	              for (var i = 0; i < cur_lists.length; i++) {
	              	//去除amp的多余字符
	              	while(cur_lists[i].content_url.indexOf("amp;") > -1){
	              		cur_lists[i].content_url = cur_lists[i].content_url.replace("amp;","");
	              	}
	              	//拼接文章具体地址
	                cur_lists[i].content_url = "https://mp.weixin.qq.com"+cur_lists[i].content_url;
	              };
	              reCall(cur_lists,text);
	              break;
	            };

	          }
	      });
	     
	   
	    }else {
	      console.log("occur some error："+ error);
	    }
	}


	request(options, callback);
}

/* GET home page. */
router.get('/', function(req, res, next) {

	getData(function(cur_lists,text){
	  	res.render('index', { 
	  		title: '中星公众号自动转发系统',
	  		cur_lists: cur_lists,
	  		text:text
	  	});
	});


});

module.exports = router;
