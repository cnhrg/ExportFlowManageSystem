'use strict';
(function(root){
  let renderNumber=0;
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const table=(headers,rows)=>'<div class="database-table-wrap"><table><thead><tr>'+headers.map(value=>'<th scope="col">'+escape(value)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(value=>'<td>'+escape(value)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  function download(name,text,type){
    const url=URL.createObjectURL(new Blob([text],{type})),anchor=document.createElement('a');
    anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function mount(host,source,name,title,options={}){
    const renderId=++renderNumber;
    host.innerHTML='<div class="database-diagram-toolbar"><strong>'+escape(title)+'</strong><div><button type="button" data-diagram-action="out" aria-label="缩小图示">−</button><output>—</output><button type="button" data-diagram-action="in" aria-label="放大图示">＋</button><button type="button" data-diagram-action="fit">适配全图</button><button type="button" data-diagram-action="read">阅读比例</button><button type="button" data-diagram-action="svg" disabled>下载 SVG</button><button type="button" data-diagram-action="source">下载 Mermaid</button></div></div><p class="database-diagram-status" role="status">正在绘制图示…</p><div class="database-diagram-viewport" tabindex="0" role="region" aria-label="'+escape(title)+'，可滚动查看"><div class="database-diagram-canvas"></div></div><details class="database-source"><summary>查看图示源码</summary><pre></pre></details>';
    host.querySelector('pre').textContent=source;
    const viewport=host.querySelector('.database-diagram-viewport'),canvas=host.querySelector('.database-diagram-canvas'),status=host.querySelector('[role="status"]');
    if(options.entities){
      const label=document.createElement('label');label.className='database-entity-picker';
      label.innerHTML='定位实体 <select aria-label="定位ER实体"><option value="">选择实体查看</option>'+options.entities.map(item=>'<option value="'+escape(item.id)+'">'+escape(item.name)+' · '+escape(item.id)+'</option>').join('')+'</select>';
      host.querySelector('.database-diagram-toolbar').append(label);
      label.querySelector('select').addEventListener('change',event=>{if(svg){resize(.85);locate(event.target.value);}});
    }
    let svg=null,scale=1,fullSvg='';
    function resize(value){
      if(!svg)return;
      scale=Math.max(.03,Math.min(2,value));
      svg.style.width=Math.round(svg.viewBox.baseVal.width*scale)+'px';svg.style.height=Math.round(svg.viewBox.baseVal.height*scale)+'px';
      host.querySelector('output').textContent=Math.round(scale*100)+'%';
    }
    function fit(){
      if(!svg)return;
      resize(Math.min(1,(viewport.clientWidth-40)/svg.viewBox.baseVal.width,(viewport.clientHeight-40)/svg.viewBox.baseVal.height));
      viewport.scrollTo(0,0);
    }
    function locate(id){
      if(!svg||!id)return;
      const entity=[...svg.querySelectorAll('g[id]')].find(element=>element.id.startsWith('entity-'+id+'-'));
      if(!entity)return;
      svg.querySelectorAll('.database-entity-focus').forEach(element=>element.classList.remove('database-entity-focus'));
      entity.classList.add('database-entity-focus');
      const box=entity.getBoundingClientRect(),frame=viewport.getBoundingClientRect();
      viewport.scrollLeft+=box.left-frame.left+(box.width>viewport.clientWidth-40?-20:box.width/2-viewport.clientWidth/2);
      viewport.scrollTop+=box.top-frame.top+(box.height>viewport.clientHeight-40?-20:box.height/2-viewport.clientHeight/2);
      host.querySelector('.database-entity-picker select').value=id;
    }
    host.onclick=event=>{
      const action=event.target.closest('[data-diagram-action]')?.dataset.diagramAction;
      if(action==='in')resize(scale*1.25);
      if(action==='out')resize(scale/1.25);
      if(action==='fit')fit();
      if(action==='read'){resize(1);locate(host.querySelector('.database-entity-picker select')?.value);}
      if(action==='svg'&&fullSvg)download(name+'.svg',fullSvg,'image/svg+xml');
      if(action==='source')download(name+'.mmd',source,'text/plain;charset=utf-8');
    };
    const staging=document.createElement('div');staging.className='database-diagram-staging';document.body.append(staging);
    try{
      if(!root.EXPORT_MERMAID?.render)throw new Error('本地图形资源未加载，请保留完整assets目录');
      const result=await root.EXPORT_MERMAID.render('design-svg-'+renderId,source,staging);
      if(!canvas.isConnected)return;
      const parsed=new DOMParser().parseFromString(result.svg,'image/svg+xml');
      if(parsed.querySelector('parsererror')||parsed.documentElement.localName!=='svg')throw new Error('图示格式错误');
      parsed.querySelectorAll('script,iframe,a').forEach(element=>element.remove());
      for(const foreign of parsed.querySelectorAll('foreignObject')){
        const label=parsed.createElementNS('http://www.w3.org/2000/svg','text');
        label.textContent=foreign.textContent.trim();
        label.setAttribute('x',String(Number(foreign.getAttribute('x')||0)+Number(foreign.getAttribute('width')||0)/2));
        label.setAttribute('y',String(Number(foreign.getAttribute('y')||0)+Number(foreign.getAttribute('height')||0)/2));
        label.setAttribute('text-anchor','middle');label.setAttribute('dominant-baseline','central');
        label.setAttribute('font-size','14');label.setAttribute('fill','#385a7c');
        foreign.replaceWith(label);
      }
      for(const element of parsed.querySelectorAll('*'))for(const attr of [...element.attributes])if(/^on/i.test(attr.name)||/^(href|xlink:href)$/i.test(attr.name))element.removeAttribute(attr.name);
      parsed.querySelectorAll('.edgeLabel text,.edgeLabel tspan').forEach(element=>element.style.setProperty('fill','#385a7c','important'));
      svg=document.importNode(parsed.documentElement,true);svg.style.maxWidth='none';svg.setAttribute('role','img');svg.setAttribute('aria-label',title);
      fullSvg=new XMLSerializer().serializeToString(svg);canvas.replaceChildren(svg);fit();
      if(options.initialScale!==undefined)resize(options.initialScale);
      if(options.focus){resize(.85);locate(options.focus);}
      host.querySelector('[data-diagram-action="svg"]').disabled=false;
      status.textContent=options.entities?'默认定位领域核心实体；选择“定位实体”阅读其他表，或点击“适配全图”查看完整关系。图内可横向及纵向滚动。':'全图用于看关系；点击“阅读比例”查看字段与连线，可横向及纵向滚动。';
    }catch(error){
      if(canvas.isConnected){status.textContent='图示绘制失败：'+error.message+'。可展开源码或下载后查看。';status.setAttribute('role','alert');}
    }finally{staging.remove();}
  }
  function bindTabs(element,select){
    element.addEventListener('click',event=>{
      const target=event.target.closest('[role="tab"]');if(!target)return;
      const id=target.dataset.tab;select(id);[...element.querySelectorAll('[role="tab"]')].find(button=>button.dataset.tab===id)?.focus();
    });
    element.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const buttons=[...element.querySelectorAll('[role="tab"]')],index=buttons.indexOf(document.activeElement);
      const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:buttons.length-1))%buttons.length;
      select(buttons[next].dataset.tab);element.querySelectorAll('[role="tab"]')[next].focus();
    });
  }
  root.EXPORT_DESIGN_DIAGRAMS={escape,table,mount,bindTabs};
})(globalThis);
