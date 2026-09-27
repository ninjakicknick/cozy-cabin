import xml.etree.ElementTree as E, re, json, pathlib, subprocess, hashlib, sys
project=pathlib.Path(__file__).resolve().parents[1]
source=pathlib.Path(sys.argv[1])
out=project/'assets/books';out.mkdir(exist_ok=True)
rows=[('willows','The Wind in the Willows','Kenneth Grahame','kenneth-grahame_the-wind-in-the-willows','#3e5142'),('garden','The Secret Garden','Frances Hodgson Burnett','frances-hodgson-burnett_the-secret-garden','#667047'),('anne','Anne of Green Gables','L. M. Montgomery','l-m-montgomery_anne-of-green-gables','#73503d'),('little-women','Little Women','Louisa May Alcott','louisa-may-alcott_little-women','#703d3f'),('oz','The Wonderful Wizard of Oz','L. Frank Baum','l-frank-baum_the-wonderful-wizard-of-oz','#64623e'),('alice',"Alice’s Adventures in Wonderland",'Lewis Carroll','lewis-carroll_alices-adventures-in-wonderland','#475d65'),('holmes','The Adventures of Sherlock Holmes','Arthur Conan Doyle','arthur-conan-doyle_the-adventures-of-sherlock-holmes','#584432'),('time-machine','The Time Machine','H. G. Wells','h-g-wells_the-time-machine','#534c62'),('dracula','Dracula','Bram Stoker','bram-stoker_dracula','#572e31'),('frankenstein','Frankenstein','Mary Shelley','mary-shelley_frankenstein','#414d40'),('sleepy-hollow','The Legend of Sleepy Hollow','Washington Irving','washington-irving_the-sketch-book-of-geoffrey-crayon-gent','#805d37'),('poe','Tales by the Fire','Edgar Allan Poe','edgar-allan-poe_short-fiction','#3f4354')]
ns={'x':'http://www.w3.org/1999/xhtml','o':'http://www.idpf.org/2007/opf'}
poe=['the-fall-of-the-house-of-usher','the-telltale-heart','the-black-cat','the-masque-of-the-red-death','the-cask-of-amontillado','the-pit-and-the-pendulum','the-gold-bug','a-descent-into-the-maelstrom']
def tag(el):return el.tag.split('}')[-1]
def words(el):
 if 'noteref' in el.get('{http://www.idpf.org/2007/ops}type',''):return '['+''.join(el.itertext()).strip()+']'
 s=el.text or ''
 for c in el:
  s+=('\n' if tag(c)=='br' else words(c))+(c.tail or '')
 return s
catalog=[];sources=[]
for id,title,author,repo,color in rows:
 root=source/repo
 opf=E.parse(root/'src/epub/content.opf'); manifest={i.get('id'):i.get('href') for i in opf.findall('.//o:manifest/o:item',ns)}
 files=[manifest[i.get('idref')] for i in opf.findall('.//o:spine/o:itemref',ns)]
 if id=='poe':files=['text/'+p+'.xhtml' for p in poe]
 if id=='sleepy-hollow':files=['text/the-legend-of-sleepy-hollow.xhtml']
 files=[f for f in files if pathlib.Path(f).stem not in ['titlepage','halftitlepage','imprint','colophon','uncopyright','loi']]
 blocks=[]
 def walk(el):
  t=tag(el)
  if t in ('figure','img'):return
  if t in ('p','h1','h2','h3','h4','hgroup','li','tr'):
   txt=words(el);txt='\n'.join(re.sub(r'\s+',' ',line).strip() for line in txt.split('\n') if line.strip())
   # Source indentation is not a verse line; only explicit br tags create linebreaks.
   if not any(tag(e)=='br' for e in el.iter()):txt=re.sub(r'\s+',' ',txt)
   if t=='li' and el.get('id','').startswith('note-'):txt='['+el.get('id').split('-')[-1]+'] '+txt.replace('↩','').strip()
   if txt:blocks.append({'kind':'heading' if t.startswith('h') else 'text','text':txt})
   return
  for c in el:walk(c)
 refs=set()
 for f in files:
  body=E.parse(root/'src/epub'/f).find('x:body',ns)
  refs.update(a.get('href','').split('#')[-1] for a in body.iter() if 'noteref' in a.get('{http://www.idpf.org/2007/ops}type',''))
  walk(body)
 if id in ('poe','sleepy-hollow') and refs:
  note_file=root/'src/epub/text/endnotes.xhtml'
  if note_file.exists():
   blocks.append({'kind':'heading','text':'Notes'})
   for li in E.parse(note_file).findall('.//x:li',ns):
    if li.get('id') in refs:walk(li)
   files.append('text/endnotes.xhtml (referenced notes only)')
 text='';heads=[]
 for b in blocks:
  if b['kind']=='heading':heads.append([len(text),len(text)+len(b['text'])])
  text+=b['text']+'\n\n'
 data={'id':id,'title':title,'author':author,'text':text.rstrip(),'headings':heads}
 raw=json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n';(out/(id+'.json')).write_text(raw)
 catalog.append({'id':id,'title':title,'author':author,'color':color})
 commit=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()
 sources.append({'id':id,'repository':'https://github.com/standardebooks/'+repo,'commit':commit,'files':files,'words':len(text.split()),'sha256':hashlib.sha256(raw.encode()).hexdigest()})
 print(id,len(files),len(text.split()))
(out/'sources.json').write_text(json.dumps(sources,indent=2)+'\n')
(project/'library.js').write_text('export const shelf = '+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n\nexport function readBookmarks(raw) {\n  const result = {};\n  for (const {id} of shelf) {\n    const n = raw?.[id];\n    if (Number.isSafeInteger(n) && n >= -1 && n < 10000000) result[id] = n;\n  }\n  return result;\n}\n')
