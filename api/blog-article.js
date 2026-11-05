'use strict';
const blog=require('../lib/blog-publication.cjs');const fs=require('node:fs/promises');const path=require('node:path');
module.exports=async function(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end();}
 const slug=Array.isArray(req.query?.slug)?null:req.query?.slug;
 if(!blog.validSlug(slug)){res.statusCode=404;return res.end('Not found');}
 try{
  const config=await blog.configuration();const rows=await blog.readPublic('blog_posts',{select:'id,title,slug,seo_title,meta_description,seo_payload,published_at,content_modified_at,source_links',slug:'eq.'+slug,limit:'1'});
  if(!rows[0]){const redirects=await blog.readPublic('blog_slug_redirects',{select:'new_slug',old_slug:'eq.'+slug,limit:'1'});if(redirects[0]&&blog.validSlug(redirects[0].new_slug)&&redirects[0].new_slug!==slug){res.statusCode=301;res.setHeader('Location',config.origin+'/blog/'+encodeURIComponent(redirects[0].new_slug));return res.end();}res.statusCode=404;return res.end('Not found');}
  const page=blog.render(rows[0],config.origin),template=await fs.readFile(path.join(config.root,'blog-article.html'),'utf8');
  const html=template.replace('<!--ARTICLE_HEAD-->',page.head).replace('<!--ARTICLE_BODY-->',page.body).replace('<meta name="robots" content="noindex">','<meta name="robots" content="index,follow">');
  res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','public,max-age=0,must-revalidate');res.statusCode=200;return res.end(req.method==='HEAD'?'':html);
 }catch{res.setHeader('Cache-Control','no-store');res.statusCode=503;return res.end('Blog temporarily unavailable');}
};
