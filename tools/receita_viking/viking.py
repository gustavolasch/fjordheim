from render import *
j,acc=load(K+'/Characters/gltf/Barbarian.glb'); W=worlds(j)
tex=Image.open(K+'/Textures/barbarian_texture.png').convert('RGB')
SKIN=[(240,192,156),(216,168,132),(240,180,144),(240,168,132)]
def near(c,lst,t=26): return any(np.abs(np.array(c)-np.array(x)).sum()<t for x in lst)
TUNIC=np.array([118,46,40]); SLEEVE=np.array([105,40,36]); BEARD=np.array([168,92,46])
def build(beard=BEARD,tunic=TUNIC,weapons=True):
  tris=[]
  for i,n in enumerate(j['nodes']):
    if 'mesh' not in n or n['name']=='Barbarian_BearHat': continue
    for v,col,uv,tag in meshtris(j,acc,n['mesh'],W[i],tex,True,n['name']):
      c=tuple((col//12*12).tolist()); cen=v.mean(0)
      if tag=='Barbarian_Body' and near(c,SKIN): col=tunic
      elif tag.startswith('Barbarian_Arm') and near(c,SKIN) and abs(cen[0])<0.62: col=tunic*0.9
      elif tag=='Barbarian_Head' and (near(c,[(156,144,144),(156,144,132),(156,156,144),(144,144,132)],30)) and cen[1]<1.62: col=beard
      elif tag=='Barbarian_Head' and near(c,[(156,144,144),(156,144,132),(156,156,144),(144,144,132)],30): col=beard*0.85
      if tag=='Barbarian_Head' and near(c,SKIN) and cen[2]<-0.12 and cen[1]>1.45: col=beard*0.9
      tris.append((v,np.array(col,float),uv,tag))
  # helmet: ellipsoid cap
  C=np.array([0,1.80,0.03]); rx,ry,rz=0.585,0.50,0.585
  METAL=np.array([150,156,162]); DARK=np.array([95,100,108]); LEATHER=np.array([110,70,45])
  nu,nv=20,8
  def P(a,b): return C+np.array([rx*np.cos(b)*np.sin(a),ry*np.sin(b),rz*np.cos(b)*np.cos(a)])
  for iu in range(nu):
    for iv in range(nv):
      a0,a1=2*np.pi*iu/nu,2*np.pi*(iu+1)/nu; b0,b1=np.pi/2*iv/nv,np.pi/2*(iv+1)/nv
      q=[P(a0,b0),P(a1,b0),P(a1,b1),P(a0,b1)]
      col=METAL if (iu%5)!=0 else DARK
      tris.append((np.array([q[0],q[1],q[2]]),col,None,'h')); tris.append((np.array([q[0],q[2],q[3]]),col,None,'h'))
  # rim band
  for iu in range(nu):
    a0,a1=2*np.pi*iu/nu,2*np.pi*(iu+1)/nu
    def R(a,y,s): return np.array([C[0]+rx*s*np.sin(a),y,C[2]+rz*s*np.cos(a)])
    q=[R(a0,C[1]-0.06,1.04),R(a1,C[1]-0.06,1.04),R(a1,C[1]+0.07,1.04),R(a0,C[1]+0.07,1.04)]
    tris.append((np.array([q[0],q[1],q[2]]),DARK,None,'h')); tris.append((np.array([q[0],q[2],q[3]]),DARK,None,'h'))
  # crest ridge
  for iv in range(nv):
    b0,b1=np.pi/2*iv/nv,np.pi/2*(iv+1)/nv
    for a in [0,np.pi]:
      p0,p1=P(a,b0),P(a,b1); off=np.array([0.035,0,0]); up0=(p0-C)*0.04; up1=(p1-C)*0.04
      q=[p0-off+up0,p0+off+up0,p1+off+up1,p1-off+up1]
      tris.append((np.array([q[0],q[1],q[2]]),DARK,None,'h')); tris.append((np.array([q[0],q[2],q[3]]),DARK,None,'h'))
  # nose guard (box)
  def box(lo,hi,col):
    x0,y0,z0=lo; x1,y1,z1=hi
    V=np.array([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]])
    F=[(0,1,2,3),(4,5,6,7),(0,1,5,4),(2,3,7,6),(1,2,6,5),(0,3,7,4)]
    for f in F:
      tris.append((V[[f[0],f[1],f[2]]],col,None,'h')); tris.append((V[[f[0],f[2],f[3]]],col,None,'h'))
  box((-0.045,1.47,0.60),(0.045,1.80,0.66),DARK)
  # weapons
  for item,slot in ([] if not weapons else [('axe_1handed',6),('shield_round_barbarian',0)]):
    ji,ai=load(K+f'/Assets/gltf/{item}.gltf'); Wi=worlds(ji)
    for k,n in enumerate(ji['nodes']):
      if 'mesh' in n: tris+=meshtris(ji,ai,n['mesh'],W[slot]@Wi[k],tex,False,item)
  return tris
if __name__=='__main__':
  tris=build()
  allv=np.concatenate([t[0] for t in tris]); c=(allv.max(0)+allv.min(0))/2; c[1]=1.2
  sc=700/2.75
  ims=[render(tris,y,cam=(c,sc)) for y in [0,np.radians(35),np.radians(180)]]
  o=Image.open('orig_front.png')
  for k,im in enumerate(ims): im.save(f'v{k}.png')
