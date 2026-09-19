import numpy as np, wave
sr=22050
length=100
out=np.zeros(sr*length,dtype=np.float64)
rng=np.random.default_rng(71)
# An original sparse felt-key / music-box miniature, with room between phrases.
chords=[[50,57,60,65],[46,53,57,62],[43,50,57,62],[45,52,59,64]]
for bar in range(16):
    chord=chords[bar%4]
    start=bar*6
    for step,note in enumerate([chord[0],chord[2]+12,chord[3]+12,chord[1]+12]):
        at=start+[0,1.45,3.1,4.6][step]+rng.uniform(-.035,.035)
        n=int(sr*5); t=np.arange(n)/sr; f=440*2**((note-69)/12)
        envelope=(1-np.exp(-t*38))*np.exp(-t/(1.4 if step else 3.4))
        tone=(np.sin(2*np.pi*f*t)+.20*np.sin(2*np.pi*f*2.002*t)+.06*np.sin(2*np.pi*f*3*t))*envelope
        pos=max(0,int(at*sr)); count=min(n,len(out)-pos)
        out[pos:pos+count]+=tone[:count]*(.13 if step else .11)
# Soft room reflections, no added hiss to compete with the fire.
for delay,level in [(.17,.13),(.39,.08),(.73,.045)]:
    d=int(sr*delay);out[d:]+=out[:-d]*level
out*=np.minimum(1,np.arange(len(out))/sr/2)*np.minimum(1,np.arange(len(out))[::-1]/sr/4)
with wave.open('/tmp/cabin-record-b.wav','w') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(out,-.9,.9)*32767).astype('<i2').tobytes())
