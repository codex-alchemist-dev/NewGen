import json, math, numpy as np
import trace as ep2
ep2.HW=40.0
x=np.array([28.3874, -0.0003, -0.0178, -0.0235, 26.9101, -0.0112, 0.0001, 0.0104, 1.7997, 0.0001, 0.0017, 0.0057, 36.3569, -0.0068, -0.0003, 0.0062, 58.2082, -0.0002, -0.0044, 0.0663])
sys=ep2.build(x)
for f in (40,45,50,55,60):
    print('g0 f',f, ep2.blur(sys,0,f))
for g in (0,10,20,30,40,45,50,55):
    print('rot',g, ep2.blur(sys,g,g))
def bundle(g,f,n=5):
    out=[]
    for o,d in ep2.rays(g,f,n):
        r=ep2.trace(sys,o,d)
        if r is None: return None
        out.append([[round(float(p[0]),2),round(float(p[1]),2)] for p in r])
    return out
data={'surfaces':[], 'fields':{}, 'gazes':{}}
for p,_ in sys:
    pts=[]
    for xx in np.linspace(-40,40,41):
        s=ep2.sag(p,xx); pts.append([round(float(xx),2),round(float(s),2)])
    data['surfaces'].append(pts)
for f in range(-50,51,5):
    b=bundle(0,f)
    if b: data['fields'][f]=b
for g in range(-50,51,5):
    b=bundle(g,g); bl=ep2.blur(sys,g,g)
    if b: data['gazes'][g]={'rays':b,'blur':round(float(bl[0]),3)}
json.dump(data,open('gazecone.json','w'))
print(len(data['fields']),len(data['gazes']))
