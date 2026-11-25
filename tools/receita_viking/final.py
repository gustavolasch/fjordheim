from pose import *
from PIL import ImageDraw, ImageFont
try: F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',26); Fs=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
except: F=Fs=None
S=480
variants=[('Ruivo · túnica vermelha',(168,92,46),(118,46,40)),('Loiro · túnica azul',(200,160,80),(60,80,110)),('Castanho · túnica verde',(95,62,40),(95,105,70))]
sheet=Image.new('RGB',(S*3,S*3+70),(28,30,36)); d=ImageDraw.Draw(sheet)
d.text((20,20),'Fjordheim — prévia do viking (base KayKit Barbarian)',font=F,fill=(243,233,210))
for r,(name,b,tu) in enumerate(variants):
  tris=V.build(beard=np.array(b),tunic=np.array(tu))
  c=np.array([0,1.2,0.0])
  for k,y in enumerate([np.radians(-20),np.radians(-60),np.radians(160)]):
    sheet.paste(render(tris,y,size=S,cam=(c,S/2.75)),(k*S,70+r*S))
  d.text((20,70+r*S+14),name,font=Fs,fill=(220,210,190))
sheet.save('previa_viking.png')
