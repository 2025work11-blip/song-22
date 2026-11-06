(async function () {
 'use strict';
 if(!window.roleAccess||!await window.roleAccess.requireAdmin())return;
 var host=document.querySelector('[data-admin-panel="blog"]');if(!host)return;
 function el(tag,text,cls){var n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
 var section=el('section',undefined,'admin-card blog-workflow');section.appendChild(el('h3','자동 생성 글 가져오기'));
 section.appendChild(el('p','파일을 가져온 뒤 내용을 확인하고 홈페이지에 게시할 수 있습니다.','admin-description'));
 var actions=el('div',undefined,'blog-import-actions');section.appendChild(actions);
 var studio=el('a','자동 생성 스튜디오 열기','admin-button');studio.href='https://oculus-content-review.ax-2-7139.chatgpt.site/create';studio.target='_blank';studio.rel='noopener noreferrer';actions.appendChild(studio);
 var refresh=el('button','지우기','admin-button');refresh.type='button';actions.appendChild(refresh);
 var uploadBox=el('div',undefined,'blog-import-box');uploadBox.appendChild(el('strong','완성된 글 파일 가져오기'));uploadBox.appendChild(el('p','블로그 자동 생성 스튜디오에서 내보낸 홈페이지 전달 JSON v2 파일을 선택해 주세요. 선택한 글은 게시 버튼을 누르기 전까지 공개되지 않습니다.','admin-description'));
 var fileLabel=el('label','JSON 파일 선택 ','blog-import-file'),file=el('input');file.type='file';file.accept='.json,application/json';fileLabel.appendChild(file);uploadBox.appendChild(fileLabel);section.appendChild(uploadBox);
 var message=el('p','','admin-status');message.setAttribute('role','status');section.appendChild(message);var list=el('div');section.appendChild(list);host.appendChild(section);
 var working=false;
 async function client(){return window.adminStore.verifyBlogWrite();}
 function problem(error){var code=error&&error.code,detail=error&&error.message||'';message.textContent=code==='40001'?'기존 글과 파일의 버전이 다릅니다. 최신 파일을 확인해 주세요.':code==='23505'?'같은 슬러그의 글이 있습니다. 새 슬러그로 수정해 주세요.':code==='42501'?'관리자 권한을 확인해 주세요.':code==='PGRST202'||code==='42P01'?'블로그 게시 DB 업데이트를 먼저 적용해 주세요.':/Title and valid search metadata required/.test(detail)?'제목, SEO 제목, 검색 설명과 올바른 슬러그를 확인해 주세요.':/Content and source links required|Content and sources required|Valid source required/.test(detail)?'본문과 연결된 출처 정보를 확인해 주세요.':detail||'작업 결과를 확인하지 못했습니다.';}
 file.addEventListener('change',async function(){if(working||!file.files[0])return;working=true;file.disabled=true;refresh.disabled=true;message.textContent='파일을 가져오고 있습니다.';try{var selected=file.files[0];if(selected.size>1000000)throw new Error('1MB 이하 JSON 파일을 선택하세요.');var payload=await window.blogTransfer.validate(JSON.parse(await selected.text()));if(payload.mock)throw new Error('예시 파일은 게시할 수 없습니다. 완성된 글의 JSON을 선택해 주세요.');var db=await client();var old=await db.from('blog_content_drafts').select('*').eq('source_post_id',payload.source_post_id).maybeSingle();if(old.error)throw old.error;
  var result;if(old.data&&old.data.source_revision===payload.revision){result={data:old.data};}else{result=await db.rpc('import_blog_content',{p_payload:payload,p_expected_revision:old.data?old.data.revision:null});}if(result.error)throw result.error;list.replaceChildren();render(result.data);message.textContent='가져온 글을 확인한 뒤 홈페이지에 게시해 주세요.';
 }catch(error){problem(error);}finally{working=false;file.disabled=false;refresh.disabled=false;file.value='';list.querySelectorAll('.blog-draft-card').forEach(function(box){box.dispatchEvent(new Event('blog-working-changed'));});}});
 function field(parent,label,value,type){var wrap=el('label',label),input=el(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type||'text';input.value=value||'';wrap.appendChild(input);parent.appendChild(wrap);return input;}
 function render(initial){
  var current=initial,c=structuredClone(initial.payload.content),dirty=false;
  var box=el('details',undefined,'blog-draft-card'),summary=el('summary',c.title+(current.destination_post_id?' · 게시됨':' · 미게시'));box.appendChild(summary);var inner=el('div',undefined,'blog-draft-fields');box.appendChild(inner);list.appendChild(box);
  var title=field(inner,'제목',c.title),question=field(inner,'핵심 질문',c.primary_question),intro=field(inner,'도입의 직접 답변',c.answer_summary,'textarea');
  var blockInputs=c.content_blocks.map(function(block){var group=el('div');inner.appendChild(group);return {heading:field(group,'소제목',block.heading),text:field(group,'본문',block.text,'textarea')};});
  var seo=field(inner,'SEO 제목',c.seo_title),description=field(inner,'검색 설명',c.meta_description,'textarea'),slug=field(inner,'슬러그',c.slug);
  var academicLabel=el('label','학술정보 표시','blog-academic-check'),academic=el('input');academic.type='checkbox';academic.checked=c.is_academic===true;academicLabel.prepend(academic);inner.appendChild(academicLabel);
  [title,question,intro,seo,description,slug,academic].concat(blockInputs.flatMap(function(b){return [b.heading,b.text];})).forEach(function(input){input.addEventListener('input',function(){dirty=true;state.textContent='게시 버튼을 누르면 수정 내용도 함께 반영됩니다.';sync();});});
  inner.appendChild(el('h4','학술 출처'));
  c.sources.forEach(function(source){var wrap=el('div');wrap.appendChild(el('p',source.publisher+' · '+source.title));var link=el('a',source.url,'blog-source-url');link.href=window.blogTransfer.url(source.url)||'#';link.target='_blank';link.rel='noopener noreferrer';wrap.appendChild(link);inner.appendChild(wrap);});
  var state=el('p','','admin-status');inner.appendChild(state);var save=el('button','수정 저장','admin-button'),publish=el('button','홈페이지에 게시','admin-button admin-primary');[save,publish].forEach(function(b){b.type='button';inner.appendChild(b);});
  function sync(){save.disabled=working||!dirty;publish.disabled=working;summary.textContent=(title.value||c.title)+(current.destination_post_id?' · 게시됨':' · 미게시');}
  box.addEventListener('blog-working-changed',sync);
  async function saveChanges(db){var next=structuredClone(c);next.title=title.value.trim();next.primary_question=question.value.trim();next.answer_summary=intro.value.trim();next.seo_title=seo.value.trim();next.meta_description=description.value.trim();next.slug=slug.value.trim();next.is_academic=academic.checked;next.content_blocks=next.content_blocks.map(function(block,i){return Object.assign({},block,{heading:blockInputs[i].heading.value.trim(),text:blockInputs[i].text.value.trim()});});var result=await db.rpc('edit_blog_content',{p_id:current.id,p_expected_revision:current.revision,p_content:next});if(result.error)throw result.error;current=result.data;c=structuredClone(current.payload.content);dirty=false;}
  save.addEventListener('click',async function(){if(working)return;working=true;sync();try{var db=await client();await saveChanges(db);state.textContent='수정 내용을 저장했습니다. 홈페이지에 반영하려면 게시 버튼을 눌러 주세요.';}catch(error){problem(error);}finally{working=false;sync();}});
  publish.addEventListener('click',async function(){if(working)return;working=true;sync();try{var db=await client();if(dirty)await saveChanges(db);var result=await db.rpc('publish_blog_content',{p_id:current.id,p_expected_revision:current.revision});if(result.error)throw result.error;current.destination_post_id=result.data;window.dispatchEvent(new Event('blog-posts-changed'));state.textContent='홈페이지에 게시했습니다. ';var link=el('a','게시글 보기');link.href='/blog/'+encodeURIComponent(c.slug);link.target='_blank';link.rel='noopener noreferrer';state.appendChild(link);}catch(error){problem(error);}finally{working=false;sync();}});sync();
 }
 refresh.addEventListener('click',function(){if(working)return;list.replaceChildren();file.value='';message.textContent='목록을 비웠습니다. 게시된 글과 저장된 자료는 그대로 유지됩니다.';});message.textContent='가져온 글이 없습니다.';
}());
