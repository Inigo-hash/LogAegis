/** Explicitly fictional prototype records from the October 30 LogAegis v3 document. */
export const demo = Object.freeze({
  devices:Array.from({length:6},(_,i)=>({device_id:`LAB-PC-00${i+1}`, lab:i<3?'Computer Lab A':'Computer Lab B', online:i!==5, risk:i===2?'High':'Low',last_sequence:[1442,1182,1008,1153,997,617][i],last_seen:i===5?'2h ago':'Just now'})),
  events:[
    ['09:44','LAB-PC-003','Executable download flagged','download','High','Downloaded setup.exe requires review'],
    ['09:40','LAB-PC-001','Process started','process','Low','Application launch recorded'],
    ['09:36','LAB-PC-004','Network activity','network','Medium','Connection metadata recorded'],
    ['09:23','LAB-PC-003','Static scan completed','scan','High','Indicators warrant manual inspection'],
    ['09:18','LAB-PC-006','Endpoint check-in missed','agent','Medium','Device not responding'],
    ['09:12','LAB-PC-002','File activity observed','file','Low','Permitted directory activity'],
  ].map(([time,device_id,event_type,category,risk,description],i)=>({event_id:`DEMO-${i+1}`,observed_at:`2026-10-30T${time}:00+08:00`,device_id,event_type,category,risk,description,source:'demo'})),
  scans:[
    {id:'DEMO-S1',device_id:'LAB-PC-003',filename:'setup.exe',result:'Suspicious',details:{reason:'High entropy + unusual imports',risk:'High'}},
    {id:'DEMO-S2',device_id:'LAB-PC-001',filename:'editor.exe',result:'No rules triggered',details:{reason:'No indicators matched'}},
    {id:'DEMO-S3',device_id:'LAB-PC-004',filename:'update.exe',result:'Suspicious',details:{reason:'Unusual PE section names',risk:'Medium'}},
    {id:'DEMO-S4',device_id:'LAB-PC-002',filename:'viewer.exe',result:'No rules triggered',details:{reason:'No indicators matched'}}
  ],
  integrity:[
    {device_id:'LAB-PC-001',last_sequence:1442,status:'Verified'},
    {device_id:'LAB-PC-002',last_sequence:1182,status:'Verified'},
    {device_id:'LAB-PC-003',last_sequence:1008,status:'Mismatch'},
    {device_id:'LAB-PC-004',last_sequence:1153,status:'Verified'},
    {device_id:'LAB-PC-005',last_sequence:997,status:'Verified'},
    {device_id:'LAB-PC-006',last_sequence:617,status:'Pending'}
  ],
  audit:[],
  summary:{devices:6,events:6399,scans:4},
  activityPoints:[23,40,61,43,71,90,68,109,87,65],
  demoVerificationRate:'98.7%'
});
export function riskForEvent(e){
  const possible=e?.risk ?? e?.payload?.risk ?? e?.payload?.risk_level;
  return ['high','medium','low'].includes(String(possible).toLowerCase()) ? String(possible).toLowerCase() : 'unassessed';
}
export function scanRisk(s){
  const value=String(s?.details?.risk||s?.details?.risk_level||'').toLowerCase();
  if(['high','medium','low'].includes(value)) return value;
  return /suspicious|flagged/i.test(String(s?.result||''))?'review':'unassessed';
}
export function csvEscape(value){
  let s=String(value??'');
  if (/^[\s]*[=+@\-\t\r]/.test(s)) s="'"+s; // CSV formula-injection guard
  return '"'+s.replaceAll('"','""')+'"';
}
export function csv(rows,columns){
  return [columns.map(c=>csvEscape(c.label)).join(','),...rows.map(r=>columns.map(c=>csvEscape(r[c.key])).join(','))].join('\r\n');
}
export function totals(events){
  const out={};for(const e of events)out[String(e.category||'other').toLowerCase()]=(out[String(e.category||'other').toLowerCase()]||0)+1;
  return out;
}
