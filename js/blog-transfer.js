(function (root) {
 'use strict';
 function canonical(value) { if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']'; if (value && typeof value === 'object') return '{' + Object.keys(value).sort().filter(function(k){return value[k]!==undefined;}).map(function(k){return JSON.stringify(k)+':'+canonical(value[k]);}).join(',') + '}'; return JSON.stringify(value); }
 async function digest(value) { var bytes=new TextEncoder().encode(canonical(value));var result=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(result),function(byte){return byte.toString(16).padStart(2,'0');}).join(''); }
 function url(value) { try {var parsed=new URL(value);return parsed.protocol==='https:'&&!parsed.username&&!parsed.password?parsed.href:null;}catch(error){return null;} }
 async function validate(value) {
  if(!value||value.schema_version!=='2.0'||typeof value.mock!=='boolean'||!/^[a-zA-Z0-9-]{1,80}$/.test(value.source_post_id)||!Number.isInteger(value.revision)||value.revision<1||!value.content||typeof value.content!=='object')throw new Error('홈페이지 전달 JSON v2 파일을 선택해 주세요.');
  var c=value.content;
  if(typeof c.title!=='string'||!c.title.trim()||!Array.isArray(c.content_blocks)||!c.content_blocks.length||!Array.isArray(c.sources)||!c.sources.length)throw new Error('제목·본문·학술 출처가 필요합니다.');
  if(c.content_blocks.some(function(b){return !b.id||typeof b.text!=='string'||typeof b.heading!=='string'||!Array.isArray(b.source_ids)||!b.source_ids.length||b.source_ids.some(function(id){return !c.sources.some(function(s){return s.id===id;});});}))throw new Error('본문과 출처 연결을 확인해 주세요.');
  if(c.sources.some(function(s){return !s.id||!s.title||!s.publisher||!url(s.url);}))throw new Error('원문 출처를 확인해 주세요.');
  var hash=await digest(c);
  if(hash!==value.content_hash||value.request_id!==value.source_post_id+':'+value.revision+':'+hash)throw new Error('파일 내용과 해시가 다릅니다. 프로그램에서 다시 내보내 주세요.');
  return value;
 }
 function html(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 var api={canonical:canonical,digest:digest,validate:validate,url:url,html:html};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.blogTransfer=api;
}(typeof window!=='undefined'?window:globalThis));
