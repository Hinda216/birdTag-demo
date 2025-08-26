export const DEMO = import.meta.env.VITE_DEMO_MODE === '1';

const b64 = (obj:any)=>btoa(JSON.stringify(obj));
export const makeDummyJWT = (payload:Record<string,any>) =>
  `${b64({alg:'none',typ:'JWT'})}.${b64(payload)}.x`;

export function bootstrapDemoSession(){
  if(!DEMO) return;
  if(!sessionStorage.getItem('idToken')){
    const now = Math.floor(Date.now()/1000);
    const id = makeDummyJWT({
      email:'demo@student.monash.edu', given_name:'Demo', family_name:'User',
      sub:'demo-user-123', iat:now, exp:now+3600
    });
    sessionStorage.setItem('idToken', id);
    sessionStorage.setItem('accessToken', id);
    sessionStorage.setItem('refreshToken', 'demo-refresh');
  }
}

export const demoStore = {
  get<T>(k:string, fallback:T){ try{ return JSON.parse(localStorage.getItem(k)||'') as T; }catch{ return fallback; } },
  set(k:string, v:any){ localStorage.setItem(k, JSON.stringify(v)); }
};
