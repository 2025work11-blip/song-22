'use strict';
const fs=require('node:fs/promises');const path=require('node:path');
function escape(value){return String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
let configPromise;
async function configuration(){
 if(!configPromise)configPromise=(async()=>{const root=process.env.BLOG_PROJECT_ROOT||process.cwd();const client=await fs.readFile(path.join(root,'js/supabase-client.js'),'utf8'),config=await fs.readFile(path.join(root,'js/config.js'),'utf8');
  const url=process.env.SUPABASE_URL||client.match(/var\s+projectUrl\s*=\s*['"]([^'"]+)['"]/)?.[1];
  const key=process.env.SUPABASE_ANON_KEY||client.match(/var\s+publishableKey\s*=\s*['"]([^'"]+)['"]/)?.[1];
  let allowed=!!key?.startsWith('sb_publishable_');if(key?.startsWith('eyJ')){try{allowed=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role==='anon';}catch{}}
  const site=safeUrl(process.env.BLOG_CANONICAL_ORIGIN||config.match(/publicSiteUrl\s*:\s*['"]([^'"]+)['"]/)?.[1]||'https://jeileye.vercel.app');
  if(!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url||'')||!allowed||!site)throw new Error('Public blog configuration unavailable');
  return {root,url:url.replace(/\/$/,''),key,origin:new URL(site).origin};})();return configPromise;
}
async function readPublic(table,query){if(!['blog_posts','blog_slug_redirects'].includes(table))throw new Error('Invalid public table');const config=await configuration();const target=new URL(config.url+'/rest/v1/'+table);target.search=new URLSearchParams(query).toString();const response=await fetch(target,{headers:{apikey:config.key},signal:AbortSignal.timeout(15000),redirect:'error'});if(!response.ok)throw new Error('Public blog read unavailable');const data=await response.json();if(!Array.isArray(data))throw new Error('Invalid public blog response');return data;}
function validSlug(value){return typeof value==='string'&&value.length<=100&&/^[a-z0-9가-힣]+(?:-[a-z0-9가-힣]+)*$/.test(value)&&!['admin','api','signin','settings','preview'].includes(value);}
function displayDate(value){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
function paragraph(text){return '<p>'+escape(text).replace(/\n/g,'<br>')+'</p>';}
function renderManual(row,origin){
 const id=String(row.id);if(!/^[1-9]\d{0,17}$/.test(id))throw new Error('Invalid post id');
 const date=/^\d{4}-\d{2}-\d{2}$/.test(row.post_date||'')?row.post_date:'';
 const canonical=origin+'/blog/id/'+id,description=String(row.content||'').replace(/\s+/g,' ').trim().slice(0,160);
 const sources=(Array.isArray(row.source_links)?row.source_links:[{text:row.source,url:row.source_url}]).filter(s=>s&&(s.text||safeUrl(s.url)));
 let body='<article class="blog-post-body blog-article"><h1>'+escape(row.title)+'</h1>'+(date?'<p class="blog-article-date">포스팅 날짜 <time datetime="'+escape(date)+'">'+escape(date)+'</time></p>':'')+'<div data-manual-blog-content="'+id+'">'+paragraph(row.content||'')+'</div>';
 if(sources.length)body+='<section><h2>출처</h2><ul>'+sources.map(s=>'<li>'+escape(s.text||'')+(safeUrl(s.url)?' <a href="'+escape(safeUrl(s.url))+'" target="_blank" rel="noopener noreferrer">원문 보기 ↗</a>':'')+'</li>').join('')+'</ul></section>';
 body+='<p><a href="/blog.html">QnA 블로그 목록</a></p></article>';
 const ld={'@context':'https://schema.org','@type':'BlogPosting',headline:row.title,description,inLanguage:'ko-KR',mainEntityOfPage:{'@type':'WebPage','@id':canonical}};if(date)ld.datePublished=date;
 const json=JSON.stringify(ld).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 const head='<title>'+escape(row.title)+' | 연세제일안과</title><meta name="description" content="'+escape(description)+'"><link rel="canonical" href="'+escape(canonical)+'"><meta property="og:type" content="article"><meta property="og:title" content="'+escape(row.title)+'"><meta property="og:description" content="'+escape(description)+'"><meta property="og:url" content="'+escape(canonical)+'"><script type="application/ld+json">'+json+'</script>';
 return {head,body,canonical,ld};
}
function render(row,origin){
 if(!validSlug(row.slug)||!row.published_at||!row.content_modified_at||Number.isNaN(Date.parse(row.published_at))||Number.isNaN(Date.parse(row.content_modified_at)))throw new Error('Published metadata incomplete');
 const data=row.seo_payload;if(!data||!Array.isArray(data.blocks))throw new Error('Public article content incomplete');
 const canonical=origin+'/blog/'+encodeURIComponent(row.slug),sources=(row.source_links||[]).filter(s=>safeUrl(s.url));
 const assets=(Array.isArray(data.assets)?data.assets:[]).filter(a=>safeUrl(a.public_url));
 let body='<article class="blog-post-body blog-article"><h1>'+escape(row.title)+'</h1><p class="blog-article-date">포스팅 날짜 <time datetime="'+escape(row.published_at)+'">'+displayDate(row.published_at)+'</time></p>'+paragraph(data.answer_summary||'')+(data.answer_summary&&data.blocks.length?'<hr class="blog-intro-divider">':'');
 for(const block of data.blocks){body+='<section>'+(block.heading?'<h2>'+escape(block.heading)+'</h2>':'')+paragraph(block.text);for(const a of assets.filter(a=>a.block_id===block.id))body+='<figure><img src="'+escape(safeUrl(a.public_url))+'" alt="'+escape(a.alt||'')+'" loading="lazy">'+(a.caption?'<figcaption>'+escape(a.caption)+'</figcaption>':'')+'</figure>';body+='</section>';}
 for(const faq of data.faq||[])body+='<section><h2>'+escape(faq.question)+'</h2>'+paragraph(faq.answer)+'</section>';
 if(data.medical_commentary)body+='<section>'+paragraph(data.medical_commentary)+'</section>';
 body+='<section><h2>출처</h2><ul>'+sources.map(s=>'<li>'+escape(s.text)+'<a class="blog-source-url" href="'+escape(safeUrl(s.url))+'" target="_blank" rel="noopener noreferrer">'+escape(safeUrl(s.url))+'</a></li>').join('')+'</ul></section>';
 const links=(data.suggested_internal_links||[]).filter(link=>{const url=safeUrl(link.url);return url&&new URL(url).origin===origin&&!/(?:^|\/)(admin|api|signin|preview)(?:\/|$)/i.test(new URL(url).pathname);});
 const credits=[];for(const [label,person] of [['작성',data.author],['의료 검토',data.reviewer]])if(person?.name){const url=safeUrl(person.profile_url);credits.push(label+': '+(url?'<a href="'+escape(url)+'">'+escape(person.name)+'</a>':escape(person.name)));}credits.push('수정일 <time datetime="'+escape(row.content_modified_at)+'">'+displayDate(row.content_modified_at)+'</time>');body+='<p class="blog-editorial-credit">'+credits.join(' · ')+'</p>';
 if(links.length)body+='<nav aria-label="관련 정보"><ul>'+links.map(link=>'<li><a href="'+escape(safeUrl(link.url))+'">'+escape(link.anchor)+'</a></li>').join('')+'</ul></nav>';
 body+='<p><a href="/blog.html">QnA 블로그 목록</a></p></article>';
 const ld={'@context':'https://schema.org','@type':'BlogPosting',headline:row.title,description:row.meta_description,inLanguage:'ko-KR',mainEntityOfPage:{'@type':'WebPage','@id':canonical},datePublished:row.published_at,dateModified:row.content_modified_at,citation:sources.map(s=>({'@type':'CreativeWork',name:s.text,url:safeUrl(s.url)}))};
 if(data.author?.name){ld.author={'@type':data.author.type==='Person'?'Person':'Organization',name:data.author.name};const authorUrl=safeUrl(data.author.profile_url);if(authorUrl)ld.author.url=authorUrl;}
 if(assets.length)ld.image=assets.map(a=>safeUrl(a.public_url));
 const json=JSON.stringify(ld).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 const head='<title>'+escape(row.seo_title||row.title)+' | 연세제일안과</title><meta name="description" content="'+escape(row.meta_description||'')+'"><link rel="canonical" href="'+escape(canonical)+'"><meta property="og:type" content="article"><meta property="og:title" content="'+escape(row.seo_title||row.title)+'"><meta property="og:description" content="'+escape(row.meta_description||'')+'"><meta property="og:url" content="'+escape(canonical)+'">'+(assets[0]?'<meta property="og:image" content="'+escape(safeUrl(assets[0].public_url))+'">':'')+'<script type="application/ld+json">'+json+'</script>';
 return {head,body,canonical,ld};
}
module.exports={configuration,readPublic,validSlug,render,renderManual,escape,safeUrl};
