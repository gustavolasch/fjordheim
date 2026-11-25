import json,struct,numpy as np,os
from PIL import Image
K=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','src','assets','kaykit-adventurers')
CT={5120:np.int8,5121:np.uint8,5122:np.int16,5123:np.uint16,5125:np.uint32,5126:np.float32}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def load(path):
  if path.endswith('.glb'):
    b=open(path,'rb').read(); n=struct.unpack('<I',b[12:16])[0]; j=json.loads(b[20:20+n]); o=20+n; bl=struct.unpack('<I',b[o:o+4])[0]; bufs=[b[o+8:o+8+bl]]
  else:
    j=json.load(open(path)); bufs=[open(os.path.join(os.path.dirname(path),bf['uri']),'rb').read() for bf in j['buffers']]
  def acc(i):
    a=j['accessors'][i]; bv=j['bufferViews'][a['bufferView']]; buf=bufs[bv.get('buffer',0)]
    off=bv.get('byteOffset',0)+a.get('byteOffset',0); dt=CT[a['componentType']]; nc=NC[a['type']]
    stride=bv.get('byteStride',0); isz=np.dtype(dt).itemsize*nc
    if stride and stride!=isz:
      raw=np.frombuffer(buf,np.uint8,a['count']*stride,off).reshape(a['count'],stride)[:,:isz].copy()
      return raw.view(dt).reshape(a['count'],nc).astype(np.float64)
    return np.frombuffer(buf,dt,a['count']*nc,off).reshape(a['count'],nc).astype(np.float64)
  return j,acc
def q2m(q):
  x,y,z,w=q; return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def local(n):
  M=np.eye(4)
  if 'matrix' in n: return np.array(n['matrix']).reshape(4,4).T
  R=q2m(n.get('rotation',[0,0,0,1])); S=np.diag(n.get('scale',[1,1,1])); M[:3,:3]=R@S; M[:3,3]=n.get('translation',[0,0,0]); return M
def worlds(j):
  W={}; par={}
  for i,n in enumerate(j['nodes']):
    for c in n.get('children',[]): par[c]=i
  def w(i):
    if i in W: return W[i]
    m=local(j['nodes'][i]); W[i]=(w(par[i])@m) if i in par else m; return W[i]
  for i in range(len(j['nodes'])): w(i)
  return W
def meshtris(j,acc,mi,M,tex,skinned,tag=None):
  out=[]
  for p in j['meshes'][mi]['primitives']:
    P=acc(p['attributes']['POSITION']); UV=acc(p['attributes']['TEXCOORD_0']) if 'TEXCOORD_0' in p['attributes'] else None
    I=acc(p['indices']).astype(int).reshape(-1,3)
    if not skinned: P=(M[:3,:3]@P.T).T+M[:3,3]
    for t in I:
      v=P[t]; 
      if UV is not None and tex is not None:
        u=UV[t].mean(0); col=np.array(tex.getpixel((int(u[0]%1*(tex.width-1)),int(u[1]%1*(tex.height-1)))))[:3]
      else: col=np.array([180,180,180])
      out.append((v,col,u if UV is not None else None,tag))
  return out
def render(tris,yaw,size=700,bg=(28,30,36),cam=None,alpha=False):
  img=np.zeros((size,size,3)); img[:]=bg; zb=np.full((size,size),-1e9)
  cy,sy=np.cos(yaw),np.sin(yaw); R=np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]])
  tilt=np.radians(-8); Rt=np.array([[1,0,0],[0,np.cos(tilt),-np.sin(tilt)],[0,np.sin(tilt),np.cos(tilt)]]); R=Rt@R
  allv=np.concatenate([t[0] for t in tris]); 
  c,sc=cam
  L=np.array([0.4,0.7,0.6]); L/=np.linalg.norm(L)
  for v,col,_,_ in tris:
    w=(R@v.T).T; nrm=np.cross(w[1]-w[0],w[2]-w[0]); nn=np.linalg.norm(nrm)
    if nn==0: continue
    nrm/=nn
    if nrm[2]<0: nrm=-nrm
    sh=0.55+0.5*max(0,nrm@L); cc=np.clip(col*sh,0,255)
    xs=(w[:,0]-c[0])*sc+size/2; ys=size/2-(w[:,1]-c[1])*sc; zs=w[:,2]
    x0,x1=int(max(0,np.floor(xs.min()))),int(min(size-1,np.ceil(xs.max()))); y0,y1=int(max(0,np.floor(ys.min()))),int(min(size-1,np.ceil(ys.max())))
    if x1<x0 or y1<y0: continue
    X,Y=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
    d=(ys[1]-ys[2])*(xs[0]-xs[2])+(xs[2]-xs[1])*(ys[0]-ys[2])
    if abs(d)<1e-9: continue
    a=((ys[1]-ys[2])*(X-xs[2])+(xs[2]-xs[1])*(Y-ys[2]))/d; b=((ys[2]-ys[0])*(X-xs[2])+(xs[0]-xs[2])*(Y-ys[2]))/d; g=1-a-b
    m=(a>=-1e-6)&(b>=-1e-6)&(g>=-1e-6)
    if not m.any(): continue
    z=a*zs[0]+b*zs[1]+g*zs[2]
    sub=zb[y0:y1+1,x0:x1+1]; upd=m&(z>sub)
    sub[upd]=z[upd]; img[y0:y1+1,x0:x1+1][upd]=cc
  if alpha:
    a=((zb>-1e9)*255).astype(np.uint8); return Image.fromarray(np.dstack([img.astype(np.uint8),a]),'RGBA')
  return Image.fromarray(img.astype(np.uint8))
