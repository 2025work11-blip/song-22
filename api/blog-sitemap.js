'use strict';
const blog=require('../lib/blog-publication.cjs');
module.exports=async function(req,res){
 if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;return res.end();}
 try{const config=await blog.configuration(),rows=await blog.readPublic('blog_posts',{select:'id,slug,content_modified_at,post_date',order:'id.asc',limit:'10000'});
 const pages=['/','/about.html','/vision.html','/cataract.html','/glaucoma.html','/retina.html','/myopia.html','/blog.html'];
 const urls=pages.map(p=>'<url><loc>'+blog.escape(config.origin+p)+'</loc></url>');
 for(const row of rows){const slug=blog.validSlug(row.slug),id=String(row.id);if(!slug&&!/^[1-9]\d{0,17}$/.test(id))continue;const loc=slug?'/blog/'+encodeURIComponent(row.slug):'/blog/id/'+id;const date=row.content_modified_at||row.post_date;urls.push('<url><loc>'+blog.escape(config.origin+loc)+'</loc>'+(date&&!Number.isNaN(Date.parse(date))?'<lastmod>'+blog.escape(date)+'</lastmod>':'')+'</url>');}
 res.setHeader('Content-Type','application/xml; charset=utf-8');res.setHeader('Cache-Control','public,max-age=0,must-revalidate');res.statusCode=200;res.end(req.method==='HEAD'?'':'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.join('')+'</urlset>');
 }catch{res.setHeader('Cache-Control','no-store');res.statusCode=503;res.end('Sitemap temporarily unavailable');}
};
