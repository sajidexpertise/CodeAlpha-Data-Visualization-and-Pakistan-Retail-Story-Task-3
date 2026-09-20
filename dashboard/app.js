(() => {
  "use strict";
  const data = (window.RETAIL_DATA || []).map(d => ({...d, year:+d.date.slice(0,4), month:+d.date.slice(5,7), revenue_pkr:+d.revenue_pkr, cost_pkr:+d.cost_pkr, profit_pkr:+d.profit_pkr}));
  const $ = id => document.getElementById(id);
  const colors = ["#087cf0","#04ad83","#f7b916","#ff5c65","#7b4de2","#25b9d7","#94a3b8"];
  const charts = {};
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const money = n => `PKR ${(n/1e6).toFixed(1)}M`;
  const pct = n => `${n.toFixed(1)}%`;
  const sum = (arr,key) => arr.reduce((a,d)=>a+d[key],0);
  const group = (rows,key,value="revenue_pkr") => rows.reduce((o,d)=>(o[d[key]]=(o[d[key]]||0)+d[value],o),{});
  const unique = (rows,key) => new Set(rows.map(d=>d[key])).size;

  function fillSelect(id, values){ const s=$(id); values.forEach(v=>s.add(new Option(v,v))); }
  fillSelect("regionFilter", [...new Set(data.map(d=>d.region))].sort());
  fillSelect("categoryFilter", [...new Set(data.map(d=>d.category))].sort());
  fillSelect("channelFilter", [...new Set(data.map(d=>d.channel))].sort());

  function filtered(){
    const year=$("yearFilter").value, region=$("regionFilter").value, category=$("categoryFilter").value, channel=$("channelFilter").value;
    return data.filter(d => (year==="all"||d.year===+year) && (region==="all"||d.region===region) && (category==="all"||d.category===category) && (channel==="all"||d.channel===channel));
  }
  function comparison(rows){
    const selected=$("yearFilter").value; if(selected==="all") return null;
    const previous=String(+selected-1), region=$("regionFilter").value, category=$("categoryFilter").value, channel=$("channelFilter").value;
    return data.filter(d=>d.year===+previous&&(region==="all"||d.region===region)&&(category==="all"||d.category===category)&&(channel==="all"||d.channel===channel));
  }
  function delta(current,prior){ if(!prior) return "Selected data"; return `${current>=prior?"▲":"▼"} ${Math.abs((current-prior)/(prior||1)*100).toFixed(1)}% vs previous year`; }
  const chartDefaults={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.dataset.label||c.label}: PKR ${Number(c.raw).toFixed(2)}M`}}},scales:{x:{grid:{color:"#e6eef8"},ticks:{color:"#526b92"}},y:{grid:{color:"#e6eef8"},ticks:{color:"#526b92"}}}};
  function replaceChart(name, canvas, config){ if(charts[name]) charts[name].destroy(); charts[name]=new Chart($(canvas),config); }

  function render(){
    const rows=filtered(), prior=comparison(rows), revenue=sum(rows,"revenue_pkr"), profit=sum(rows,"profit_pkr"), cost=sum(rows,"cost_pkr"), orders=rows.length, customers=unique(rows,"customer_id"), margin=revenue?profit/revenue*100:0;
    $("revenueKpi").textContent=money(revenue); $("ordersKpi").textContent=orders.toLocaleString(); $("customersKpi").textContent=customers.toLocaleString(); $("marginKpi").textContent=pct(margin); $("profitKpi").textContent=`${money(profit)} gross profit`;
    if(prior){$("revenueDelta").textContent=delta(revenue,sum(prior,"revenue_pkr"));$("ordersDelta").textContent=delta(orders,prior.length)} else {$("revenueDelta").textContent="Across selected years";$("ordersDelta").textContent="Across selected years"}

    const monthly=Array(12).fill(0); rows.forEach(d=>monthly[d.month-1]+=d.revenue_pkr/1e6);
    replaceChart("monthly","monthlyChart",{type:"line",data:{labels:months,datasets:[{label:"Revenue",data:monthly,borderColor:colors[0],backgroundColor:"rgba(8,124,240,.18)",fill:true,tension:.32,pointRadius:4,pointBackgroundColor:colors[0],borderWidth:3}]},options:chartDefaults});
    const first=monthly.find(v=>v>0)||0,last=[...monthly].reverse().find(v=>v>0)||0; $("growthBadge").textContent=first?`${last>=first?"▲":"▼"} ${Math.abs((last-first)/first*100).toFixed(0)}% first to last month`:"No data";

    const categories=Object.entries(group(rows,"category")).sort((a,b)=>b[1]-a[1]);
    $("categoryMosaic").innerHTML=categories.map(([name,val],i)=>`<div class="category-tile" style="background:linear-gradient(135deg,${colors[i%colors.length]},${colors[(i+1)%colors.length]})"><span>${name}</span><strong>${revenue?pct(val/revenue*100):"0%"}</strong><small>${money(val)}</small></div>`).join("")||"<p>No data for this filter.</p>";

    const digital=rows.filter(d=>d.channel==="Online"||d.channel==="Mobile App"), digitalRev=sum(digital,"revenue_pkr"), digitalPct=revenue?digitalRev/revenue*100:0;
    replaceChart("digital","digitalChart",{type:"doughnut",data:{labels:["Digital","Offline"],datasets:[{data:[digitalPct,100-digitalPct],backgroundColor:[colors[1],"#dfe9f5"],borderWidth:0,circumference:180,rotation:270}]},options:{responsive:true,maintainAspectRatio:false,cutout:"72%",plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${c.raw.toFixed(1)}%`}}}}});
    $("digitalShare").textContent=pct(digitalPct); $("digitalSales").textContent=money(digitalRev); $("offlineSales").textContent=money(revenue-digitalRev);

    const regions=Object.entries(group(rows,"region")).sort((a,b)=>b[1]-a[1]);
    replaceChart("region","regionChart",{type:"bar",data:{labels:regions.map(x=>x[0]),datasets:[{label:"Revenue",data:regions.map(x=>x[1]/1e6),backgroundColor:regions.map((_,i)=>colors[i%colors.length]),borderRadius:10}]},options:{...chartDefaults,scales:{...chartDefaults.scales,y:{...chartDefaults.scales.y,beginAtZero:true,title:{display:true,text:"PKR millions"}}}}});

    const channels=Object.entries(group(rows,"channel")).sort((a,b)=>b[1]-a[1]);
    $("journeyFlow").innerHTML=`<div class="flow-column">${channels.map(([n,v],i)=>`<div class="flow-node" style="background:${colors[i]}">${n}<strong>${revenue?pct(v/revenue*100):"0%"}</strong></div>`).join("")}</div><div class="flow-arrow">→</div><div class="flow-column">${categories.slice(0,5).map(([n,v],i)=>`<div class="flow-node" style="background:${colors[(i+1)%colors.length]}">${n}<strong>${revenue?pct(v/revenue*100):"0%"}</strong></div>`).join("")}</div>`;

    const leadCat=categories[0]||["No category",0], leadRegion=regions[0]||["No region",0], returnRate=orders?rows.filter(d=>d.returned===true||d.returned==="True").length/orders*100:0;
    const signals=[
      ["Revenue Pulse",`${money(revenue)} across ${orders.toLocaleString()} orders in the current view.`],
      ["Category Leader",`${leadCat[0]} contributes ${revenue?pct(leadCat[1]/revenue*100):"0%"} of revenue.`],
      ["Digital Momentum",`${pct(digitalPct)} of revenue comes from online and mobile-app channels.`],
      ["Regional Opportunity",`${leadRegion[0]} leads with ${money(leadRegion[1])}; return rate is ${pct(returnRate)}.`]
    ];
    $("insightCards").innerHTML=signals.map((s,i)=>`<div class="insight-card" style="background:linear-gradient(145deg,${colors[i]},${colors[(i+1)%colors.length]})"><strong>0${i+1} · ${s[0]}</strong><p>${s[1]}</p></div>`).join("");
  }

  ["yearFilter","regionFilter","categoryFilter","channelFilter"].forEach(id=>$(id).addEventListener("change",render));
  $("resetFilters").addEventListener("click",()=>{["regionFilter","categoryFilter","channelFilter"].forEach(id=>$(id).value="all");$("yearFilter").value="2024";render()});
  $("downloadCsv").addEventListener("click",()=>{const rows=filtered();if(!rows.length)return;const keys=Object.keys(rows[0]).filter(k=>!['year','month'].includes(k));const esc=v=>`"${String(v).replaceAll('"','""')}"`;const csv=[keys.join(','),...rows.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='prism_filtered_retail_data.csv';a.click();URL.revokeObjectURL(a.href)});
  if(!data.length){document.body.innerHTML="<p style='padding:40px'>Dashboard data is missing. Run build_dashboard.py.</p>";return} render();
})();
