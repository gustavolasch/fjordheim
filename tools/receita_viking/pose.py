from render import *
import viking as V
j,acc,W=V.j,V.acc,V.W
names=[n['name'] for n in j['nodes']]
par={}
for i,n in enumerate(j['nodes']):
  for c in n.get('children',[]): par[c]=i
def sub(i):
  out=[i]
  for c in j['nodes'][i].get('children',[]): out+=sub(c)
  return out
def Rz(a):
  c,s=np.cos(a),np.sin(a); M=np.eye(4); M[:2,:2]=[[c,-s],[s,c]]; return M
def Rx(a):
  c,s=np.cos(a),np.sin(a); M=np.eye(4); M[1:3,1:3]=[[c,-s],[s,c]]; return M
def T(p): M=np.eye(4); M[:3,3]=p; return M
Wp={k:v.copy() for k,v in W.items()}
def rot(jn,R):
  i=names.index(jn); piv=W[i][:3,3]; G=T(piv)@R@T(-piv)
  for k in sub(i): Wp[k]=G@Wp[k]
rot('upperarm.l',Rz(-np.radians(68))); rot('upperarm.r',Rz(np.radians(68)))
# bend right forearm forward a bit, left forearm to hold shield in front
i=names.index('lowerarm.r'); piv=Wp[i][:3,3]; G=T(piv)@Rx(-np.radians(55))@T(-piv)
for k in sub(i): Wp[k]=G@Wp[k]
i=names.index('lowerarm.l'); piv=Wp[i][:3,3]; G=T(piv)@Rx(-np.radians(70))@T(-piv)
for k in sub(i): Wp[k]=G@Wp[k]
sk=j['skins'][0]; IB=acc(sk['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1)
SM=np.array([Wp[jn]@IB[k] for k,jn in enumerate(sk['joints'])])
orig_meshtris=V.meshtris
def posed_meshtris(jj,aa,mi,M,tex,skinned,tag=None):
  if not skinned or jj is not j: return orig_meshtris(jj,aa,mi,M,tex,skinned,tag)
  out=[]
  for p in jj['meshes'][mi]['primitives']:
    P=aa(p['attributes']['POSITION']); J=aa(p['attributes']['JOINTS_0']).astype(int); Wt=aa(p['attributes']['WEIGHTS_0'])
    Ph=np.c_[P,np.ones(len(P))]
    Q=np.zeros((len(P),3))
    for k in range(4): Q+=Wt[:,k:k+1]*np.einsum('nij,nj->ni',SM[J[:,k]],Ph)[:,:3]
    UV=aa(p['attributes']['TEXCOORD_0']); I=aa(p['indices']).astype(int).reshape(-1,3)
    for t in I:
      u=UV[t].mean(0); col=np.array(tex.getpixel((int(u[0]%1*(tex.width-1)),int(u[1]%1*(tex.height-1)))))[:3]
      out.append((Q[t],col,u,tag))
  return out
V.meshtris=posed_meshtris
V.W=Wp
# helmet & nose were built in bind space at head; head joint not moved -> fine
