'use strict';
const blog=require('../lib/blog-publication.cjs');
module.exports=async function(req,res){
 if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;return res.end();}
 try{const config=await blog.configuration(),rows=await blog.readPublic('blog_posts',{select:'slug,content_modified_at',slug:'not.is.null',order:'id.asc',limit:'10000'});
 const pages=['/','/about.html','/vision.html','/cataract.html','/glaucoma.html','/retina.html','/myopia.html','/blog.html'];
 const urls=pages.map(p=>'<url><loc>'+blog.escape(config.origin+p)+'</loc></url>');
 for(const row of rows)if(blog.validSlug(row.slug)&&!Number.isNaN(Date.parse(row.content_modified_at)))urls.push('<url><loc>'+blog.escape(config.origin+'/blog/'+encodeURIComponent(row.slug))+'</loc><lastmod>'+blog.escape(row.content_modified_at)+'</lastmod></url>');
 res.setHeader('Content-Type','application/xml; charset=utf-8');res.setHeader('Cache-Control','public,max-age=0,must-revalidate');res.statusCode=200;res.end(req.method==='HEAD'?'':'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.join('')+'</urlset>');
 }catch{res.setHeader('Cache-Control','no-store');res.statusCode=503;res.end('Sitemap temporarily unavailable');}
};
