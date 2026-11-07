/** Backend adapter for the existing LogAegis FastAPI /api/v1/admin contract.
 * Access tokens are kept only in memory, never localStorage, a URL, or a cookie.
 */
export class ApiError extends Error {
  constructor(message, status=0) { super(message); this.name='ApiError'; this.status=status; }
}
export function normalizeBase(input='') {
  const base=String(input||'').trim();
  if (!base) return '';
  const url=new URL(base, globalThis.location?.origin || 'https://localhost');
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid backend URL');
  if (url.username || url.password || url.search || url.hash) throw new Error('Backend URL must not contain credentials or parameters');
  if (url.protocol==='http:' && !['localhost','127.0.0.1','::1','[::1]'].includes(url.hostname)) {
    throw new Error('Use HTTPS for a non-local backend');
  }
  return url.href.replace(/\/$/, '');
}
export function createApi(base='', tokenGetter=()=>null) {
  const origin=normalizeBase(base);
  const request=async(path, {method='GET',body,signal,authenticate=true}={})=>{
    const token=tokenGetter();
    if(authenticate && !token) throw new ApiError('Sign in to access live laboratory records',401);
    const headers={'Accept':'application/json'};
    if(body!==undefined) headers['Content-Type']='application/json';
    if(authenticate) headers['Authorization']=`Bearer ${token}`;
    let res;
    try { res=await fetch(`${origin}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal,cache:'no-store',credentials:'omit'}); }
    catch(err){ if(err?.name==='AbortError') throw err; throw new ApiError('Cannot reach the backend. Check its address, TLS, and CORS configuration.'); }
    let data={};
    try { data=await res.json(); } catch { /* Backend may return HTML or empty error. */ }
    if(!res.ok) throw new ApiError(typeof data.detail==='string'?data.detail:`Request failed (${res.status})`,res.status);
    return data;
  };
  return {
    request,
    login:(username,password)=>request('/api/v1/admin/login',{method:'POST',body:{username,password},authenticate:false}),
    me:()=>request('/api/v1/admin/me'),
    devices:()=>request('/api/v1/admin/devices'),
    events:(limit=200)=>request(`/api/v1/admin/events?limit=${Math.max(1,Math.min(200,limit))}`),
    scans:()=>request('/api/v1/admin/scans'),
    integrity:()=>request('/api/v1/admin/integrity'),
    summary:()=>request('/api/v1/admin/reports/summary'),
    audit:()=>request('/api/v1/admin/audit?limit=200'),
    verify:(id)=>request(`/api/v1/admin/integrity/verify/${encodeURIComponent(id)}`),
    revoke:(id)=>request(`/api/v1/admin/devices/${encodeURIComponent(id)}/revoke`,{method:'POST'})
  };
}
