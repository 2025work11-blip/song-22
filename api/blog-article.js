'use strict';
const blog=require('../lib/blog-publication.cjs');const fs=require('node:fs/promises');const path=require('node:path');
module.exports=async function(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end();}
 const slug=Array.isArray(req.query?.slug)?null:req.query?.slug, id=Array.isArray(req.query?.id)?null:req.query?.id;
 const byId=typeof id==='string'&&/^[1-9]\d{0,17}$/.test(id);
 if(!byId&&!blog.validSlug(slug)){res.statusCode=404;return res.end('Not found');}
 try{
  const config=await blog.configuration();const query={select:'id,title,post_date,content,source,source_url,slug,seo_title,meta_description,seo_payload,published_at,content_modified_at,source_links',limit:'1'};query[byId?'id':'slug']='eq.'+(byId?id:slug);const rows=await blog.readPublic('blog_posts',query);
  if(!rows[0]){if(!byId){const redirects=await blog.readPublic('blog_slug_redirects',{select:'new_slug',old_slug:'eq.'+slug,limit:'1'});if(redirects[0]&&blog.validSlug(redirects[0].new_slug)&&redirects[0].new_slug!==slug){res.statusCode=301;res.setHeader('Location',config.origin+'/blog/'+encodeURIComponent(redirects[0].new_slug));return res.end();}}res.statusCode=404;return res.end('Not found');}
  const structured=rows[0].seo_payload&&Array.isArray(rows[0].seo_payload.blocks)&&rows[0].published_at&&rows[0].content_modified_at;
  if(byId&&structured&&blog.validSlug(rows[0].slug)){res.statusCode=301;res.setHeader('Location',config.origin+'/blog/'+encodeURIComponent(rows[0].slug));return res.end();}
  if(!byId&&!structured){res.statusCode=301;res.setHeader('Location',config.origin+'/blog/id/'+encodeURIComponent(rows[0].id));return res.end();}
  const page=byId?blog.renderManual(rows[0],config.origin):blog.render(rows[0],config.origin),template=await fs.readFile(path.join(config.root,'blog-article.html'),'utf8');
  const html=template.replace('<!--ARTICLE_HEAD-->',page.head).replace('<!--ARTICLE_BODY-->',page.body).replace('<meta name="robots" content="noindex">','<meta name="robots" content="index,follow">');
  res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','public,max-age=0,must-revalidate');res.statusCode=200;return res.end(req.method==='HEAD'?'':html);
 }catch{res.setHeader('Cache-Control','no-store');res.statusCode=503;return res.end('Blog temporarily unavailable');}
};
