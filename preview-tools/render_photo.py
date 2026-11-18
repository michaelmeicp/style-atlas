#!/usr/bin/env python3
"""Bake original offline camera/lighting simulations for Style Atlas. No input media."""
from __future__ import annotations
from concurrent.futures import ProcessPoolExecutor
import argparse, colorsys, hashlib, json, math, os, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
V = lambda *a: np.array(a, dtype=np.float32)
ZERO = V(0,0,0)
INF = np.float32(1e6)
def norm(a): return a / np.maximum(np.linalg.norm(a, axis=-1, keepdims=True),1e-8)
def dot(a,b): return np.sum(a*b, axis=-1)
def mix(a,b,t): return a*(1-t)+b*t
def h(v): return int(hashlib.blake2s(str(v).encode(),digest_size=4).hexdigest(),16)
def rgb(s): return (V(*[int(s[i:i+2],16)/255 for i in (1,3,5)])**1.8)
def c(a,b,d): return V(a,b,d)
def el(pos,dim,col,mat='matte'): return ('ellipsoid',V(*pos),V(*dim),col,mat)
def box(pos,dim,col,mat='matte'): return ('box',V(*pos),V(*dim),col,mat)
def cylinder(pos,dim,col,mat='matte'): return ('cylinder',V(*pos),V(*dim),col,mat)
def interp_pal(palette):
    if isinstance(palette,list) and len(palette)>=4:
        try: return [rgb(x) for x in palette[:4]]
        except (TypeError,ValueError,IndexError): pass
    return [V(.055,.10,.12),V(.36,.31,.24),V(.80,.70,.55),V(.68,.38,.22)]

def study(scene, seed, pal, subject=""):
    # Structured, original synthetic photographs: each subject is real geometry.
    r=np.random.default_rng(seed); dk,mid,hi,ac=pal
    jungle=V(.05,.19,.09); stone=V(.46,.39,.32); ceramic=mix(V(.18,.235,.23),mid,.26)
    zm=1.; look=np.array([0,.60,0],np.float32); daylight=False
    if scene in ('city','street'):
        daylight=True; zm=.73; look=V(0,.75,-.45); scene_obj=[]
        for side in (-1,1):
            for i in range(4):
                z=1.4-2.3*i; yy=float(r.uniform(.9,2.1)); xx=side*(1.28+float(r.uniform(0,.45)))
                tint=mix(stone,[mid,hi,dk,ac][i],.52)
                scene_obj.extend([box((xx,yy/2,z),(.69,yy/2,1.0),tint,'building'),box((xx,yy+.026,z),(.73,.052,1.04),dk,'matte')])
        if 'cart-pushing' in subject or 'elevated bridge' in subject:
            # A recognizable overpass and hand-cart rather than a generic street.
            scene_obj.extend([box((0,1.73,-1.03),(1.89,.14,.47),c(.23,.205,.18),'stone'),
                box((0,1.93,-.67),(1.88,.074,.042),dk,'metal'),
                box((0,1.93,-1.39),(1.88,.074,.042),dk,'metal')])
            for x in (-1.38,1.38):
                scene_obj.extend([box((x,.78,-.99),(.16,.80,.18),stone,'stone'),box((x,1.74,-.64),(.055,.225,.06),dk,'metal')])
            scene_obj.extend([box((-.24,.026,-.30),(.064,.013,1.08),mix(mid,hi,.66),'metal'),
                el((-.49,.48,.07),(.105,.39,.10),dk,'linen'),el((-.49,.88,.13),(.105,.109,.10),ac,'matte'),
                el((-.392,.51,.126),(.11,.046,.043),dk,'linen'),
                box((-.17,.26,.25),(.226,.12,.24),mix(ac,stone,.39),'wood'),
                el((-.33,.115,.25),(.034,.105,.105),dk,'matte'),el((.019,.115,.25),(.034,.105,.105),dk,'matte')])
        else:
            scene_obj.extend([box((0,.035,-1),(.25,.025,5),c(.42,.38,.28),'lane'),el((-.48,.48,.3),(.11,.46,.11),dk,'silk'),el((-.48,.99,.29),(.114,.115,.10),ac,'matte')])
        return scene_obj,daylight,zm,look
    if scene in ('coast','landscape','wildlife'):
        daylight=True; zm=.66; look=V(0,.69,-.35)
        objs=[]
        for i in range(8):
            x=-5+i*1.6; z=-4.5-float(r.random())*5.; rad=float(r.uniform(.42,1.05)); ht=float(r.uniform(.52,1.9))
            color=mix(jungle,[mid,dk,stone][i%3],.5)
            objs.append(el((x,.02,z),(1.54*rad,ht,.96+rad),color,'rock'))
        if scene=='coast':
            objs.extend([el((-.74,.03,.27),(1.25,.29,1.0),stone,'rock'),cylinder((-.75,.67,.24),(.20,.51,.20),hi,'building'),cylinder((-.75,1.23,.24),(.238,.105,.238),ac,'silk'),cylinder((-.75,1.40,.24),(.22,.07,.22),dk,'metal'),el((.72,.04,-.25),(.45,.20,.40),dk,'rock')])
        elif scene=='wildlife':
            objs.extend([el((0,.42,0),(.60,.28,.31),ac,'bird'),el((.36,.66,0),(.25,.31,.19),ac,'bird'),el((.46,.88,0),(.20,.18,.19),hi,'bird'),el((.62,.85,0),(.21,.061,.071),dk,'matte'),el((.48,.927,.157),(.034,.034,.034),dk,'silk'),el((.48,.927,-.157),(.034,.034,.034),dk,'silk'),box((-.15,.19,.02),(.03,.18,.024),dk),box((.12,.18,-.02),(.03,.17,.023),dk)])
        else:
            objs.extend([el((-.94,-.07,.6),(1.8,.55,1.5),ac,'rock'),el((1.7,.08,-.4),(1.6,.87,1.06),mid,'rock'),el((.53,.14,1.03),(.44,.22,.36),dk,'rock')])
        return objs,daylight,zm,look
    if scene in ('architecture','interior'):
        look=V(0,.81,0); zm=.81
        return [box((0,.86,-1.0),(1.60,.861,.08),mix(hi,stone,.39),'wood'),box((-1.15,.71,-.23),(.38,.71,.47),mid,'stone'),box((1.04,.41,.12),(.42,.41,.37),dk,'wood'),box((1.04,.84,.12),(.47,.05,.42),ac,'silk'),cylinder((-.28,.19,.27),(.38,.19,.38),stone,'stone'),el((-.28,.64,.26),(.30,.34,.30),ceramic,'silk'),cylinder((-.28,.9,.26),(.14,.23,.14),ceramic,'silk'),el((-.28,1.15,.26),(.14,.030,.14),dk,'matte'),box((.36,1.43,-.87),(.64,.335,.014),hi,'matte'),box((.36,1.43,-.852),(.58,.285,.012),mix(dk,mid,.41),'building')],False,zm,look
    if scene=='portrait':
        # Physical sculptural model (no identity, no borrowed textures).
        look=V(.02,.82,0); zm=.97
        skin=mix(V(.73,.47,.31),hi,.25); hair=mix(V(.048,.019,.014),dk,.3)
        portrait=[el((0,.29,0),(.65,.31,.29),dk,'linen'),el((0,.47,.01),(.43,.35,.25),dk,'linen'),cylinder((0,.72,.02),(.15,.28,.139),skin,'silk'),el((0,1.02,.02),(.309,.384,.265),skin,'skin'),el((0,1.19,-.03),(.322,.27,.28),hair,'hair'),el((-.288,1.00,.03),(.07,.10,.08),skin,'silk'),el((.288,1.00,.03),(.07,.10,.08),skin,'silk'),el((0,1.006,.275),(.048,.13,.055),skin,'silk'),el((-.109,1.08,.258),(.062,.018,.016),hair,'silk'),el((.109,1.08,.258),(.062,.018,.016),hair,'silk'),el((0,.92,.27),(.071,.013,.012),mix(skin,ac,.57),'silk')]
        if 'tailor sorting cloth' in subject:
            portrait.extend([box((.14,.44,.66),(.73,.073,.33),mix(stone,mid,.23),'wood'),
                box((-.44,.22,.74),(.056,.22,.055),stone,'wood'),box((.68,.22,.74),(.056,.22,.055),stone,'wood'),
                box((.23,.52,.72),(.28,.029,.22),ac,'linen'),box((.275,.555,.72),(.26,.021,.19),mix(ac,hi,.35),'linen'),
                box((.36,.586,.75),(.18,.02,.15),mix(ac,mid,.31),'linen'),
                el((-.29,.59,.65),(.22,.055,.055),skin,'silk'),el((.53,.61,.60),(.21,.054,.062),skin,'silk')])
        return portrait,False,zm,look
    if scene in ('bloom','botanic'):
        look=V(.00,.76,.06); z=.86
        objs=[el((0,.28,.05),(.28,.28,.25),ceramic,'silk'),cylinder((0,.49,.05),(.14,.22,.14),ceramic,'silk'),el((0,.71,.05),(.14,.022,.14),dk)]
        for i,(x,y,zz) in enumerate([(-.51,1.22,.11),(.22,1.50,-.04),(.57,1.18,.12),(-.17,1.04,.36)]):
            objs.append(el((x*.54,.91,zz),(.025+abs(x)*.14,.31,.042),jungle,'linen'))
            for k in range(7):
                ang=2*np.pi*k/7+i; petal=mix(hi,ac,.7 if i%2==0 else .37)
                objs.append(el((x+.118*np.cos(ang),y+.101*np.sin(ang),zz+.014*np.cos(3*ang)),(.127,.087,.084),petal,'petal'))
            objs.append(el((x,y,zz+.069),(.067,.058,.072),mid,'rock'))
        return objs,False,z,look
    if scene=='food':
        look=V(0,.28,0); zm=.89
        objs=[cylinder((0,.09,0),(.83,.09,.67),dk,'silk'),cylinder((0,.171,0),(.72,.035,.58),hi,'silk')]
        for i in range(9):
            ang=2*np.pi*i/9; x=.42*np.cos(ang); z=.35*np.sin(ang)
            color=mix(V(.67,.225,.05),[mid,ac,hi][i%3],.56)
            objs.append(el((x,.214+float(r.random())*.021,z),(.146,.080,.114),color,'fruit'))
        objs.extend([el((0,.26,0),(.23,.105,.21),jungle,'fruit'),cylinder((.78,.21,-.49),(.26,.21,.26),dk,'silk'),el((.78,.42,-.49),(.224,.012,.22),ac,'silk'),box((-.91,.037,.03),(.098,.033,.62),stone,'metal')])
        return objs,False,zm,look
    if scene=='abstract':
        look=V(0,.62,0); zm=.88
        return [cylinder((-.43,.16,.22),(.47,.16,.47),mid,'silk'),el((-.46,.67,.20),(.346,.36,.326),ac,'silk'),el((.29,.30,.36),(.258,.28,.26),hi,'metal'),box((.52,.43,-.37),(.29,.44,.33),dk,'linen'),box((.50,.95,-.38),(.33,.10,.36),hi,'stone')],False,zm,look
    look=V(0,.62,0)
    # Same still life per bench: ceramic vase, two fruits, cloth/book and plinth.
    return [box((0,.057,0),(.79,.057,.52),stone,'linen'),
        el((-.17,.43,.0),(.333,.342,.309),ceramic,'silk'),
        el((-.17,.67,0),(.259,.239,.239),ceramic,'silk'),
        cylinder((-.17,.92,0),(.129,.25,.124),ceramic,'silk'),
        cylinder((-.17,1.148,0),(.154,.035,.148),ceramic,'silk'),
        el((-.17,1.182,0),(.116,.012,.109),dk,'matte'),
        el((.468,.257,.13),(.178,.16,.16),mix(V(.55,.22,.045),ac,.36),'fruit'),
        el((.265,.196,.40),(.155,.093,.139),mix(V(.48,.21,.032),ac,.42),'fruit'),
        box((-.449,.136,.51),(.31,.047,.18),mix(hi,mid,.47),'linen'),
        box((.44,.137,-.37),(.28,.024,.16),dk,'stone')],False,zm,look

def intersections(ro, rd, obj, detailed=False):
    kind, at, scale, col, mat=obj; o=ro-at
    if kind=='ellipsoid':
        so=o/scale; sd=rd/scale
        a=dot(sd,sd); b=dot(so,sd); c0=dot(so,so)-1
        dis=b*b-a*c0
        t=np.where(dis>=0,(-b-np.sqrt(np.maximum(dis,0)))/np.maximum(a,1e-9),INF)
        t=np.where(t>.0004,t,INF)
        if not detailed:return t
        p=o+rd*np.minimum(t,100)[...,None]; n=norm(p/(scale**2))
    elif kind=='box':
        d=np.where(np.abs(rd)<1e-7,np.copysign(1e-7,rd),rd)
        t0=(-scale-o)/d; t1=(scale-o)/d
        lo=np.max(np.minimum(t0,t1),axis=-1); hi=np.min(np.maximum(t0,t1),axis=-1)
        t=np.where((hi>=lo)&(lo>.0004),lo,INF)
        if not detailed:return t
        p=o+rd*np.minimum(t,100)[...,None]; face=np.argmax(np.abs(p/scale),axis=-1)
        n=np.eye(3,dtype=np.float32)[face]*np.take_along_axis(np.sign(p),face[...,None],axis=-1)
    else:
        d0=rd[...,::2]/scale[::2]; o0=o[...,::2]/scale[::2]
        a=dot(d0,d0); b=dot(d0,o0); c0=dot(o0,o0)-1; dis=b*b-a*c0
        t0=np.where(dis>=0,(-b-np.sqrt(np.maximum(dis,0)))/np.maximum(a,1e-9),INF)
        y=o[...,1]+rd[...,1]*np.minimum(t0,100)
        t0=np.where((np.abs(y)<=scale[1])&(t0>.0004),t0,INF)
        cap=np.where(rd[...,1]<0,scale[1],-scale[1]); d1=np.where(np.abs(rd[...,1])<1e-7,1e-7,rd[...,1])
        t1=(cap-o[...,1])/d1; p1=o[...,::2]+rd[...,::2]*t1[...,None]
        t1=np.where((dot(p1/scale[::2],p1/scale[::2])<=1)&(t1>.0004),t1,INF)
        t=np.minimum(t0,t1)
        if not detailed:return t
        p=o+rd*np.minimum(t,100)[...,None]; n=p/(scale**2);n[...,1]=0;n=norm(n)
        n=np.where((t1<t0)[...,None],V(0,1,0)*np.sign(cap)[...,None],n)
    return t,n

def noise(p): 
    s=np.sin(p[...,0]*128.189+p[...,1]*147.37+p[...,2]*174.53)*754.42
    return s-np.floor(s)

LIGHT={
 'dawn':(V(-.65,.61,.30),V(1.24,.84,.51),.21,.82,.105),
 'dusk':(V(.55,.45,-.39),V(1.20,.63,.40),.11,.52,.069),
 'diffused':(V(-.30,.79,.61),V(.98,.96,.91),.66,.53,.31),
 'window':(V(-.84,.57,.17),V(1.05,.96,.80),.27,.80,.17),
 'studio':(V(-.57,.75,.41),V(1.05,1.02,.97),.38,.83,.23),
 'side':(V(-.95,.33,.19),V(1.16,.97,.82),.24,.94,.08),
 'back':(V(.40,.62,-.86),V(1.21,1.01,.77),.21,.96,.108),
 'harsh':(V(-.65,.75,.22),V(1.12,1.055,.95),.15,1.07,.011),
 'glow':(V(.58,.84,-.32),V(1.23,.82,.55),.45,.52,.255),
 'night':(V(-.90,.52,-.35),V(.38,.63,1.25),.15,.66,.081),
 'overcast':(V(.0,.95,.28),V(.85,.99,1.15),.7,.37,.28),
 'spot':(V(.54,.88,.26),V(1.10,.99,.91),.10,1.1,.038),
 'rim':(V(.36,.56,-.92),V(1.19,.96,.72),.15,1.06,.09),
}

def choose_camera(composition,distanceScale,look,seed, benchmark):
    rng=np.random.default_rng(seed)
    choices={'thirds':(.2,3.6,1.55,.32,-.01),'symmetry':(0.,3.9,1.52,0,0),'diagonal':(.37,3.65,1.47,.07,.14),
    'negative':(-.12,4.4,1.64,.56,.01),'overhead':(.16,2.2,4.28,0,0),'closeup':(.26,2.7,1.42,.04,0),
    'layers':(.16,4.6,1.46,.12,0),'leading':(.31,4.30,1.34,.06,.045),'low':(.10,3.83,.69,0,0),
    'wide':(.15,5.25,1.55,0,0),'frame':(.16,3.77,1.4,.07,0),'pan':(.19,4.16,1.4,-.32,0),'center':(0.,3.9,1.49,0.,0.)}
    ang,d,cy,offset,roll=choices.get(composition,(0.,3.8,1.49,0.,0.))
    if not benchmark:
        f=float(rng.uniform(-.086,.086))
        if composition not in ('symmetry','center'): ang+=f
        cy+=float(rng.uniform(-.08,.08))
    cam=V(math.sin(ang)*d,cy,math.cos(ang)*d)
    center=look+V(offset,0,0)
    return cam,center,roll,0.86/distanceScale

def photo(entry, benchmark=False,w=300,hgt=200):
    p=entry['preview']; uid=entry['id']; kind=p.get('familyId') or entry.get('familyId') or ''
    seed=h((uid,p.get('seed',0),p.get('subject',''))); r=np.random.default_rng(seed)
    palette=interp_pal(p.get('palette')); dk,mid,hi,ac=palette
    scene='stilllife' if benchmark else p.get('scene','stilllife')
    geom_seed=15307 if benchmark else h((scene,p.get('subject','')))
    objs,daylight,ds,look=study(scene,geom_seed,palette,'' if benchmark else p.get('subject',''))
    cam,target,roll,fov=choose_camera(p.get('composition'),ds,look,h((p.get('subject'),p.get('composition'))),benchmark)
    kindv=(str(kind)+' '+str(p.get('technique',''))).lower()
    depthStyle=any(x in kindv for x in ('bokeh','macro','shallow','tilt','portrait','telephoto','soft-focus','petzval'))
    if any(x in kindv for x in ('telephoto','compression','street-tele','portrait-85')): cam=target+(cam-target)*1.23; fov*=.86
    if 'macro' in kindv and p.get('composition')!='wide':cam=target+(cam-target)*.86
    if any(x in kindv for x in ('wide-angle','street-zone','panorama','fisheye')):fov*=1.17
    if 'flatlay' in kindv and p.get('composition')=='overhead':cam=V(cam[0]*.4,cam[1]*1.36,cam[2]*.58)
    if 'perspective' in kindv:fov*=1.08
    xx,yy=np.meshgrid(np.linspace(-w/hgt,w/hgt,w,dtype=np.float32),np.linspace(1,-1,hgt,dtype=np.float32))
    forward=norm(target-cam); xvec=norm(np.cross(forward,V(0,1,0))); yvec=norm(np.cross(xvec,forward))
    rx=xvec*math.cos(roll)+yvec*math.sin(roll);ry=yvec*math.cos(roll)-xvec*math.sin(roll)
    lens_x,lens_y=xx,yy
    if 'fisheye' in kindv:
        curl=.83+.17*(xx**2+yy**2);lens_x=xx*curl;lens_y=yy*curl
    if 'pinhole' in kindv: fov*=1.09
    rd=norm(forward+((lens_x[...,None]*rx+lens_y[...,None]*ry)*(fov*.45)))
    ro=cam
    div=np.where(rd[...,1]<-.0001,rd[...,1],-.0001)
    t_floor=-cam[1]/div; t_floor=np.where(rd[...,1]<-.0001,t_floor,INF)
    # Studio infinity wall, landscape haze towards horizon.
    t_wall=(-4.-cam[2])/np.minimum(rd[...,2],-.0001)
    t_wall=np.where(rd[...,2]<-.0001,t_wall,INF)
    if daylight:t_wall=np.ones_like(t_floor)*INF
    depth=np.minimum(t_floor,t_wall)
    floor=(t_floor<=t_wall)&(t_floor<INF)
    zones=np.where(floor,-1,-2)
    normal=np.where(floor[...,None],V(0,1,0),V(0,0,1))
    for j,o in enumerate(objs):
        t,n=intersections(ro,rd,o,True)
        mask=t<depth; zones=np.where(mask,j,zones); depth=np.minimum(t,depth)
        normal=np.where(mask[...,None],n,normal)
    pos=ro+rd*np.minimum(depth,100)[...,None]
    l,light,amb,brightness,soft=LIGHT.get(p.get('lighting'),LIGHT['studio'])
    l=norm(l)
    if any(x in kindv for x in ('low-key','noir','chiaroscuro')):amb*=.66;brightness*=1.10
    if any(x in kindv for x in ('high-key','flat','airy')):amb=max(.58,amb)
    if 'silhouette' in kindv:amb*=.58
    if 'gel' in kindv or 'neon' in kindv:light=light*V(1.01,.75,1.27)
    if 'softbox' in kindv:l,soft,amb=norm(V(-.68,.75,.48)),max(soft,.2),max(.34,amb)
    if 'rembrandt' in kindv:l,soft,amb=norm(V(-.74,.64,.48)),.076,min(.21,amb)
    if 'clamshell' in kindv:l,soft,amb=norm(V(-.07,.86,.66)),.29,max(.44,amb)
    if 'hard-gobo' in kindv:l,soft,amb=norm(V(-.52,.79,.45)),.01,min(.25,amb)
    if 'golden-land' in kindv:l,light,soft=norm(V(-.81,.35,.30)),V(1.31,.92,.59),.10
    if 'bluehour' in kindv:light=light*V(.69,.85,1.38)
    if 'night-practicals' in kindv:light=light*V(1.36,.87,.52);amb*=.67
    if 'food-side' in kindv:l=norm(V(-.79,.65,-.43))
    if 'glass' in kindv:l,soft,amb=norm(V(.66,.51,-.68)),.036,min(.16,amb)
    if 'flash' in kindv or 'freeze' in kindv:
        l=norm(V(-.19,.56,.86)); soft=min(soft,.055); brightness*=1.18
    if any(x in kindv for x in ('rim','backlit')):l=norm(V(.21,.57,-.91));brightness*=1.18
    if any(x in kindv for x in ('bounce','overcast','diffus')):amb=max(.42,amb)
    visibility=np.ones((hgt,w),np.float32)
    off=norm(np.cross(l,V(0,0,1)))
    shadow_rays=1 if soft<.035 else 3
    if any(x in kindv for x in ('silhouette','hard')):shadow_rays=1
    if shadow_rays==1: offs=[0.]
    else: offs=[-1.,0.,1.]
    if len(objs)>24:offs=[-.72,.72]
    hidden=np.zeros_like(depth)
    sp=pos+normal*.009
    for delta in offs:
        d=norm(l+soft*delta*off)
        covered=np.zeros_like(depth,dtype=bool)
        for o in objs:
            ts=intersections(sp,d,o)
            covered|=(ts<INF)
        hidden+=covered
    visibility-=hidden/len(offs)*.87
    signal=dot(normal,l); lam=np.maximum(signal,0)
    if 'hard-gobo' in kindv:
        guide=(pos[...,0]*.5+pos[...,1]*.85+pos[...,2]*.26)%1.02
        visibility*=np.where(guide>.73,.26,1)
    if 'projection' in kindv:
        guide=.28+.71*(.5+.5*np.sin(pos[...,0]*13+pos[...,1]*4)*np.sin(pos[...,1]*12+pos[...,0]*5))
        visibility*=guide
    diffuse=(amb+brightness*visibility*lam)[...,None]
    materialNoise=noise(pos*V(2,3,2.7))
    low=noise(pos*V(.071,.106,.086))
    if daylight:
        issea=scene=='coast'
        if issea: grd=mix(V(.045,.17,.19),mid,.27)
        elif scene in ('street','city'):grd=mix(V(.20,.19,.16),mid,.35)
        else:grd=mix(V(.15,.22,.12),mid,.40)
        sky0=mix(V(.50,.64,.71),hi,.30);sky1=mix(V(.19,.44,.56),ac,.2)
        if p.get('lighting') in ('night','dusk') or 'bluehour' in kindv:sky0*=.34;sky1*=.24
        elif p.get('lighting')=='dawn':sky0=mix(sky0,V(.70,.39,.22),.43)
        col=mix(sky0,sky1,np.clip(yy*.86+.18,0,1)[...,None])
        sun=np.power(np.maximum(dot(rd,l),0),500)
        col+=sun[...,None]*light
        wav=(np.sin(pos[...,0]*8+pos[...,2]*24+1.9*np.sin(pos[...,2]*5))*.12)
        gr=grd[None,None,:]*(.83+.13*low+.20*materialNoise+wav*(1 if issea else .27))[...,None]
        mist=np.clip((depth-3.0)*.046,0,.62)[...,None]
        c2=mix(gr*diffuse,sky0,mist)
        col=np.where((zones==-1)[...,None],c2,col)
    else:
        grd=mix(mid,V(.33,.31,.28),.69)
        wall=mix([dk,mid,hi][h(kind)%3],V(.31,.29,.25),.55)
        if any(x in kindv for x in ('high-key','airy','catalog','product-clean')):wall=mix(hi,V(.86,.84,.82),.6);grd=wall*.88
        if any(x in kindv for x in ('noir','low-key','black')):wall=mix(dk,V(.085,.077,.075),.8);grd=wall*1.3
        wall_shade=np.exp(-(.12*((pos[...,0]+.80*l[0])**2)+.20*((pos[...,1]-1.33)**2)))
        if 'product-clean' in kindv:wall_shade=np.ones_like(depth)*.68
        floorShade=np.minimum(.89+.16*np.sin(pos[...,0]*2+pos[...,2]*.29),1.04)
        surface=mix(grd*(.88+.14*low+.10*materialNoise)[...,None],grd*.5,np.clip((depth-4)*.10,0,.38)[...,None])
        col=np.where((zones==-1)[...,None],surface*diffuse*floorShade[...,None],wall*(.34+.57*wall_shade+.08*materialNoise)[...,None]*light**.39)
    reflective=norm(l-rd); spec_base=np.maximum(dot(normal,reflective),0)
    for j,o in enumerate(objs):
        m=zones==j
        if not m.any():continue
        _,at,scale,oc,mat=o
        op=pos[m]; ln=materialNoise[m]; coarse=low[m]
        texture=.86+.19*coarse+.10*ln; shine=.035; gloss=18
        if mat in ('silk','skin','petal'):
            shine={'silk':.19,'skin':.085,'petal':.10}[mat];gloss={'silk':34,'skin':18,'petal':16}[mat]
            texture=(.89+.16*coarse+.064*ln)*(1+.025*np.sin(op[...,1]*229))
        elif mat in ('metal',):
            shine=.42;gloss=61;texture=.79+.15*np.cos(op[...,0]*15+op[...,1]*2)+.08*coarse
        elif mat in ('wood','linen','hair'):
            freq={'wood':29,'linen':192,'hair':96}[mat];shine=.075;gloss=17
            texture=.81+.20*ln+.13*np.sin(op[...,0]*freq+op[...,1]*3+.38*np.sin(op[...,0]*23+op[...,2]*17))
        elif mat in ('fruit','rock','stone','bird'):
            texture=.76+.22*ln+.22*coarse;shine=.10;gloss=21
        elif mat=='building':
            u=op[...,0]-at[0]; v=op[...,1]
            if o[0]=='box':
                u=np.where(np.abs(normal[m,0])>.4,op[...,2]-at[2],u)
            windows=((u*5.1+.15)%1. < .59)&((v*3.65+.09)%1. < .44)&(v>.15)&(normal[m,1]<.52)
            mullion=((u*5.1+.15)%1.>.24)&((u*5.1+.15)%1.<.31)
            texture=np.where(windows&~mullion,.27+.15*ln,.81+.16*ln)
            shine=.044;gloss=21
        lighted=oc[None,:]*texture[...,None]*diffuse[m]*(mix(V(1,1,1),light,.73))[None,:]
        lighted+=(shine*visibility[m]*np.power(spec_base[m],gloss))[...,None]*light
        if daylight:
            lighted=mix(lighted,sky0,np.clip((depth[m]-4.4)*.051,0,.68)[...,None])
        col[m]=lighted
    exposure=1.
    if 'high-key' in kindv or 'product-clean' in kindv:exposure=1.34
    if 'mobile-candid' in kindv:exposure=1.07
    if 'silhouette' in kindv:exposure=.82
    if 'underexpos' in kindv:exposure=.80
    if 'overexpos' in kindv or 'double-exposure' in kindv:exposure*=1.22
    col*=exposure
    # Optics and stock/processing approximations; uniform truth label on gallery.
    centers=np.clip(-.18+yy*.23+xx*.11,-1,1)
    rr=(xx*xx*.40+yy*yy*.52)**.81
    vid=.33 if 'pinhole' in kindv else .17 if 'vignette' in kindv or 'vintage' in kindv else .10
    col*=np.maximum(.59,1-vid*rr)[...,None]
    col=np.clip(col,0,2.0); col=(col*(1+1.02*col))/(1+.70*col+1.21*col*col); col=np.clip(col,0,1)
    col=col**(1/2.06)
    lum=dot(col,V(.2126,.7152,.0722))[...,None]
    if any(x in kindv for x in ('monochrom','black-and-white','noir','b&w','grayscale','silver-gelatin','high-contrast-bw','infrared')):
        tint=V(.98,1,1.02) if 'infrared' not in kindv else V(1.05,.99,.95)
        col=lum*tint
    if 'cinematic' in kindv or 'teal' in kindv:
        col=mix(col, col*mix(V(.73,1.09,1.17),V(1.14,.99,.79),lum),.69)
    if 'color-negative' in kindv:col=mix(col,col*.81+.084,.57)
    if 'reversal' in kindv:col=np.clip(mix(lum,col,1.36)*1.16-.055,0,1)
    if 'bleach-bypass' in kindv:col=np.clip(mix(lum,col,.56)*1.27-.11,0,1)
    if 'editorial-color' in kindv:col=mix(col,lum*V(.93,.985,1.04),.29)
    if 'cross' in kindv:col=mix(col,col[...,::-1]*V(1.04,1.15,.85),.33)
    if any(x in kindv for x in ('instant','film','grain','analogue','analog','vintage')):
        col=np.clip(col*.93+.039,0,1)
        col+=r.normal(0,.018,col.shape[:2]).astype(np.float32)[...,None]
    else:col+=r.normal(0,.006,col.shape[:2]).astype(np.float32)[...,None]
    raw=Image.fromarray(np.uint8(np.clip(col,0,1)*255),'RGB')
    if depthStyle and 'focus-stack' not in kindv:
        focus=float(np.linalg.norm(target-cam))
        out=np.asarray(raw).astype('float32')
        blur=np.asarray(raw.filter(ImageFilter.GaussianBlur(4.1))).astype('float32')
        ratio=np.clip((np.abs(depth-focus)-.55)*.53,0,.84)
        if 'tilt' in kindv:ratio=np.maximum(ratio,np.clip((np.abs(yy-.1)-.30)*1.15,0,.88))
        raw=Image.fromarray(np.uint8(mix(out,blur,ratio[...,None])))
    if 'halation' in kindv:
        outs=np.asarray(raw).astype('float32')
        gleam=Image.fromarray(np.uint8(np.clip((lum[...,0]-.57)*200,0,255)))
        glow=(np.asarray(gleam.filter(ImageFilter.GaussianBlur(9))).astype('float32')*.7)[...,None]
        raw=Image.fromarray(np.uint8(np.clip(outs+glow*V(1,.4,.2),0,255)))
    if 'split-diopter' in kindv:
        sharp=np.asarray(raw).astype('float32')
        sme=np.asarray(raw.filter(ImageFilter.GaussianBlur(2.7))).astype('float32')
        blend=np.exp(-((xx-.08)*5)**2)*.63
        raw=Image.fromarray(np.uint8(mix(sharp,sme,blend[...,None])))
    if 'pinhole' in kindv:raw=raw.filter(ImageFilter.GaussianBlur(.50))
    if 'double-exposure' in kindv:
        ghost=raw.transpose(Image.Transpose.FLIP_LEFT_RIGHT).transform(raw.size,Image.Transform.AFFINE,(1,0,29,0,1,11),Image.Resampling.BILINEAR)
        raw=Image.blend(raw,ghost,.23)
    if 'panning' in kindv or 'long-exposure' in kindv or ('motion' in kindv and 'freeze' not in kindv) or 'intentional-blur' in kindv:
        smear=raw.copy()
        transformed=smear.transform(raw.size,Image.Transform.AFFINE,(1,0,8 if 'motion-pan' in kindv else 4,0,1,6 if 'intentional-blur' in kindv else 0),Image.Resampling.BILINEAR)
        raw=Image.blend(raw,transformed,.26)
    return raw

FEATURES={'photo-hard-gobo-02','photo-golden-land-05','photo-product-clean-02','photo-bluehour-04'}
def work(args):
    entry, folder, bench, width=args
    suffix='-b' if bench else '-detail' if width>=600 else ''
    fname=folder/(entry['id']+suffix+'.webp')
    photo(entry,bench,width,round(width*2/3)).save(fname,'WEBP',quality=79 if not bench else 82,method=3)
    return fname.stat().st_size

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--catalog',type=Path,default=ROOT/'data/photo.json')
    p.add_argument('--output',type=Path,default=ROOT/'assets/photo')
    p.add_argument('--limit',type=int)
    p.add_argument('--subject-contains',type=str,default='')
    p.add_argument('--workers',type=int,default=min(5,os.cpu_count() or 1))
    p.add_argument('--width',type=int,default=300)
    p.add_argument('--benchmark',action='store_true')
    p.add_argument('--benchmark-only',action='store_true')
    p.add_argument('--featured-only',action='store_true')
    a=p.parse_args()
    data=json.loads(a.catalog.read_text())
    es=[e for e in data['entries'] if a.subject_contains in e['preview'].get('subject','')][:a.limit]
    for e in es:
        if not e['id'] or any(not(ch.isascii() and (ch.isalnum() or ch in '-_')) for ch in e['id']):
            raise ValueError('Unsafe preview ID '+str(e['id']))
    a.output.mkdir(parents=True,exist_ok=True)
    jobs=[] if (a.benchmark_only or a.featured_only) else [(e,a.output,False,a.width) for e in es]
    if a.benchmark or a.benchmark_only:
        jobs.extend((e,a.output,True,min(a.width,256)) for e in es)
    if a.featured_only or a.limit is None and not a.benchmark_only:
        jobs.extend((e,a.output,False,768) for e in es if e['id'] in FEATURES)
    with ProcessPoolExecutor(max_workers=a.workers) as ex:
        total=0
        for i,n in enumerate(ex.map(work,jobs,chunksize=4),1):
            total+=n
            if i%120==0 or i==len(jobs):print(f'{i}/{len(jobs)} renders, {total/1024/1024:.1f} MiB',flush=True)
if __name__=='__main__':main()
