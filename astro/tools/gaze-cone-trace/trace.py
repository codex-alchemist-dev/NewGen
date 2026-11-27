import math, numpy as np
from scipy.optimize import minimize
TRACK=80.0; P_EYE=10.0; PUP=2.0; L=1750.0; NG=1.80; ND=1.50; TD=7.0; HW=40.0  # max lens half width
def sag(p,x):  # p=(apex,c,a4,a6)
    c=p[1]; q=1-c*c*x*x
    if q<=0: return None
    return p[0]+c*x*x/(1+math.sqrt(q))+p[2]*x**4*1e-6+p[3]*x**6*1e-9
def dsag(p,x):
    c=p[1]; q=1-c*c*x*x
    return c*x/math.sqrt(q)+4*p[2]*x**3*1e-6+6*p[3]*x**5*1e-9
def intersect(o,d,p):
    # solve o_y+t d_y = sag(o_x+t d_x)
    t=(p[0]-o[1])/d[1] if abs(d[1])>1e-6 else 10
    for _ in range(30):
        x=o[0]+t*d[0]; s=sag(p,x)
        if s is None: return None
        f=o[1]+t*d[1]-s; df=d[1]-dsag(p,x)*d[0]
        if abs(df)<1e-9: return None
        dt=f/df; t-=dt
        if abs(dt)<1e-8: break
    x=o[0]+t*d[0]
    if t<0 or abs(x)>HW*1.6: return None
    return np.array([x,sag(p,x)])
def refract(d,n,n1,n2):
    if d@n>0: n=-n
    c=-(d@n); r=n1/n2; k=1-r*r*(1-c*c)
    if k<0: return None
    return r*d+(r*c-math.sqrt(k))*n
def build(x):
    s1=(x[0],x[1],x[2],x[3]); s2=(x[0]+x[4],x[5],x[6],x[7])
    s3=(s2[0]+x[8],x[9],x[10],x[11]); s4=(s3[0]+x[12],x[13],x[14],x[15])
    d1=(s4[0]+x[16],x[17],x[18],x[19])
    return [(s1,NG),(s2,1.0),(s3,NG),(s4,1.0),(d1,None)]   # object = phosphor surface (curved field)
def trace(sys,o,d):
    n=1.0; pts=[o]
    for p,n2 in sys:
        q=intersect(o,d,p)
        if q is None: return None
        pts.append(q)
        if n2 is None: return pts
        x=q[0]; nn=np.array([-dsag(p,x),1.0]); nn/=np.linalg.norm(nn)
        dn=refract(d,nn,n,n2)
        if dn is None: return None
        o=q; d=dn; n=n2
def rays(g,f,nray=7):
    g=math.radians(g); f=math.radians(f)
    pc=np.array([math.sin(g),math.cos(g)])*P_EYE; perp=np.array([math.cos(g),-math.sin(g)])
    V=pc+np.array([math.sin(f),math.cos(f)])*L; out=[]
    for k in range(nray):
        s=(k/(nray-1))*2-1 if nray>1 else 0
        o=pc+perp*s*PUP*math.cos(0); d=V-o; d=d/np.linalg.norm(d); out.append((o,d))
    return out
def blur(sys,g,f):
    xs=[]
    for o,d in rays(g,f):
        r=trace(sys,o,d)
        if r is None: return None
        xs.append(r[-1])
    xs=np.array(xs)
    c0=trace(sys,*rays(g,f,1)[0]); c1=trace(sys,*rays(g,f+0.1,1)[0])
    if c0 is None or c1 is None: return None
    sc=np.linalg.norm(c1[-1]-c0[-1])/0.1  # mm per degree
    spread=np.max(np.linalg.norm(xs-xs.mean(0),axis=1))*2
    return spread/sc*60, sc
CASES=[(0,0,1),(25,25,1),(50,50,1),(-50,-50,1),(0,30,0.3),(0,50,0.1)]
def merit(x):
    if x[0]<24 or x[4]<1.5 or x[8]<0.5 or x[12]<1.5 or x[16]<1: return 1e7
    sys=build(x)
    for xx in np.linspace(0,HW,10):
        ys=[sag(p,xx) for p,_ in sys]
        if any(v is None for v in ys): return 1e7
        if any(ys[i+1]-ys[i]<0.8 for i in range(len(ys)-1)): return 1e7
        if ys[-1]>TRACK: return 1e7
    m=0
    for g,f,w in CASES:
        b=blur(sys,g,f)
        if b is None: m+=w*1e5; continue
        m+=w*b[0]**2
    return m
if __name__=='__main__':
    best=None
    rng=np.random.default_rng(1)
    starts=[np.array([26,0.0,0,0, 12,-0.012,0,0, 1,0.0,0,0, 12,-0.012,0,0, 12,-0.01,0,0],dtype=float)]
    for i in range(5):
        s=starts[0].copy(); s[[1,5,9,13,17]]+=rng.normal(0,0.002,5); s[[4,12]]+=rng.normal(0,3,2); s[16]+=rng.normal(0,5); starts.append(s)
    for s in starts:
        r=minimize(merit,s,method='Nelder-Mead',options={'maxfev':5000,'adaptive':True})
        r=minimize(merit,r.x,method='Nelder-Mead',options={'maxfev':5000,'adaptive':True})
        print('start merit',round(r.fun,1),flush=True)
        if best is None or r.fun<best.fun: best=r
    x=best.x; sys=build(x); np.save('/tmp/claude-0/opt/x2.npy',x)
    print('x',np.round(x,4).tolist())
    for g,f in ((0,0),(25,25),(50,50),(0,40),(0,60),(0,70),(0,80)):
        b=blur(sys,g,f); print('gaze',g,'field',f, None if b is None else (round(b[0],2),'arcmin', round(b[1],3),'mm/deg'))
    # power: paraxial focal via small ray
    o=np.array([0.5,P_EYE]); d=np.array([0,1.0]); r=trace(sys,o,d)
    print('apexes',[round(p[0],2) for p,_ in sys])
