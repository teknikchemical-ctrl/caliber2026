import {mean,variance} from './classify.js';
export const METHODS=['ses','croston','sba','tsb','family_pooled_sba','driver_based','zero_demand_insurance'];
export function ses(y,alpha=.2){let f=y[0]||0;for(let i=1;i<y.length;i++)f=alpha*y[i]+(1-alpha)*f;return f;}
export function croston(y,alpha=.2){const first=y.findIndex(x=>x>0);if(first<0)return 0;let z=y[first],p=first+1,last=first;for(let t=first+1;t<y.length;t++)if(y[t]>0){z+=alpha*(y[t]-z);p+=alpha*(t-last-p);last=t}return z/p;}
export const sba=(y,a=.2)=>(1-a/2)*croston(y,a);
export function tsb(y,alpha=.2,beta=.2){const first=y.findIndex(x=>x>0);if(first<0)return 0;let z=y[first],p=1/(first+1);for(let t=first+1;t<y.length;t++){p+=beta*((y[t]>0?1:0)-p);if(y[t]>0)z+=alpha*(y[t]-z)}return p*z;}
export function family_pooled_sba(y,family,alpha=.2,w=.5,members=1){return(1-w)*sba(y,alpha)+w*sba(family,alpha)*((y.reduce((a,b)=>a+b,0)+1)/(family.reduce((a,b)=>a+b,0)+Math.max(1,members)));}
export const driver_based=(y,alpha=.2,fraction=.5)=>sba(y,alpha)*fraction;
export const zero_demand_insurance=()=>0;
export function forecastMean(method,y,params={},family=[] ,members=1,driverBase=.5){const a=params.alpha??.2;if(!METHODS.includes(method))throw new Error('Unsupported forecast method');return method==='driver_based'?driver_based(y,a,driverBase):method==='family_pooled_sba'?family_pooled_sba(y,family,a,params.pool_weight??.5,members):method==='tsb'?tsb(y,a,params.beta??.2):({ses,croston,sba,driver_based,zero_demand_insurance}[method])(y,a);}
export function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296};}
export function quantileSorted(b,q){if(!b.length)return 0;const i=(b.length-1)*q,j=Math.floor(i);return b[j]+(b[Math.min(j+1,b.length-1)]-b[j])*(i-j);}
export function quantile(a,q){if(!a.length)return 0;let lo=Infinity,hi=-Infinity;for(const x of a){if(x<lo)lo=x;if(x>hi)hi=x}if(lo===hi)return lo;return quantileSorted(Float64Array.from(a).sort(),q);}
// Monthly nonzero sizes and occurrence bootstrapped independently. Model mean rescales the size distribution.
export function bootstrap(y,expected,months,{seed=1,draws=512,leadSamples=null,monthlyRates=null}={}){const random=rng(seed),nz=y.filter(x=>x>0);if(expected<0||!Number.isFinite(expected)||months<0||!Number.isFinite(months))throw new Error('Invalid bootstrap input');if((expected===0&&!monthlyRates?.some(x=>x>0))||months===0)return Array(draws).fill(0);const sizes=nz.length?nz:[1];const sizeMean=mean(sizes),out=[];
 for(let b=0;b<draws;b++){const duration=leadSamples?.length?leadSamples[Math.floor(random()*leadSamples.length)]/30:months;let d=0;for(let t=0;t<Math.ceil(duration);t++){const fraction=Math.min(1,duration-t);const rate=monthlyRates?monthlyRates[Math.min(t,monthlyRates.length-1)]:expected,prob=Math.min(1,rate/sizeMean),adjust=prob>0?rate/(prob*sizeMean):0;if(random()<prob*fraction)d+=sizes[Math.floor(random()*sizes.length)]*adjust}out.push(d)}return out;}
// one sort for the three percentiles (performance; same values as three calls to quantile)
export const distribution=a=>{let lo=Infinity,hi=-Infinity;for(const x of a){if(x<lo)lo=x;if(x>hi)hi=x}if(a.length&&lo===hi)return {mean:lo,sd:0,p10:lo,p50:lo,p90:lo};const b=Float64Array.from(a).sort();return {mean:mean(a),sd:Math.sqrt(variance(a)),p10:quantileSorted(b,.1),p50:quantileSorted(b,.5),p90:quantileSorted(b,.9)}};
