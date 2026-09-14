"""Audit-only independent computations; never writes teaching sources or their tests."""
from pathlib import Path
from collections import deque
from itertools import combinations
from concurrent.futures import ThreadPoolExecutor
import subprocess, json, time, re, hashlib

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
BIN = OUT / 'bin'
BIN.mkdir(exist_ok=True)

def tree(text):
    tok = text.split()
    if not tok or tok[0] in ('null', '#'): return None
    root = [int(tok[0]), None, None]
    q = deque([root]); i = 1
    while q and i < len(tok):
        u = q.popleft()
        for side in (1, 2):
            if i < len(tok) and tok[i] not in ('null', '#'):
                u[side] = [int(tok[i]), None, None]; q.append(u[side])
            i += 1
    return root

def walk(r):
    if r:
        yield r
        yield from walk(r[1]); yield from walk(r[2])

def levels(r):
    rows=[]; q=[(r,0)] if r else []
    while q:
        rows.append(q); q=[(u[s],2*i+s) for u,i in q for s in (1,2) if u[s]]
    return rows

def eq(a,b):
    return a == b

def paths(r,p=()):
    if not r:return
    p=p+(r[0],)
    if not r[1] and not r[2]:yield p
    else:
        yield from paths(r[1],p);yield from paths(r[2],p)

def binary_graph(r):
    ns=list(walk(r)); ids={id(u):i for i,u in enumerate(ns)}; adj=[[] for u in ns]
    for i,u in enumerate(ns):
        for v in u[1:]:
            if v is not None:
                j=ids[id(v)];adj[i].append(j);adj[j].append(i)
    return ns,adj

def graph(tokens, pos=0, weighted=True):
    n=int(tokens[pos]);pos+=1;adj=[[] for _ in range(n)];edges=[]
    for _ in range(n-1):
        u,v=map(int,tokens[pos:pos+2]);pos+=2;w=int(tokens[pos]) if weighted else 1
        if weighted:pos+=1
        u-=1;v-=1;adj[u].append((v,w));adj[v].append((u,w));edges.append((u,v,w))
    return adj,edges,pos

def distances(adj,src,blocked=None):
    ds={src:0};q=[src]
    for u in q:
        for v,w in adj[u]:
            if v not in ds and (u,v)!=blocked and (v,u)!=blocked:
                ds[v]=ds[u]+w;q.append(v)
    return ds

def oracle(k,text):
    lines=text.splitlines();t=text.split()
    if k in (16,18):
        adj,edges,_=graph(t);n=len(adj)
        if k==16:return '\n'.join(str(sum(distances(adj,u).values())) for u in range(n))
        if n==1:return '0.00\nNODE 1'
        best=None
        # Independent edge-by-edge minimax: no diameter endpoints / parent-path reconstruction.
        for u,v,w in edges:
            a=max(distances(adj,u,(u,v)).values());b=max(distances(adj,v,(u,v)).values())
            x=max(0,min(w,(b+w-a)/2));radius=max(a+x,b+w-x)
            if x==0: loc=f'NODE {u+1}'
            elif x==w:loc=f'NODE {v+1}'
            elif u<v:loc=f'EDGE {u+1} {v+1} {x:.2f}'
            else:loc=f'EDGE {v+1} {u+1} {w-x:.2f}'
            if best is None or radius<best[0]:best=(radius,loc)
        return f'{best[0]:.2f}\n{best[1]}'
    if k==17:
        a=list(map(int,t));n,cap=a[:2];pa=[-1]*n
        for i in range(n-1):u,v=a[2+2*i:4+2*i];pa[v-1]=u-1
        val=a[2+2*(n-1):];best=None
        # Exact enumeration, independent of tree-knapsack update order.
        for c in combinations(range(n),cap):
            s=set(c)
            if any(pa[v]!=-1 and pa[v] not in s for v in c):continue
            score=sum(val[v] for v in c);best=score if best is None else max(best,score)
        return 'IMPOSSIBLE' if best is None else str(best)
    if k==20:
        a,_,pos=graph(t,weighted=False);b,_,_=graph(t,pos,weighted=False)
        if len(a)!=len(b):return 'NON-ISOMORPHIC'
        def shape(adj,u,p):return tuple(sorted(shape(adj,v,u) for v,w in adj[u] if v!=p))
        target=shape(a,0,-1)
        return 'ISOMORPHIC' if any(shape(b,v,-1)==target for v in range(len(b))) else 'NON-ISOMORPHIC'
    if k in (6,7):
        a=list(map(int,t));n=a[0];x=a[1:n+1];y=a[n+1:]
        def build(first,mid,post=False):
            if not first:return None
            v=first[-1] if post else first[0];i=mid.index(v)
            return [v,build(first[:i] if post else first[1:i+1],mid[:i],post),build(first[i:-1] if post else first[i+1:],mid[i+1:],post)]
        r=build(x,y) if k==6 else build(y,x,True)
        def post(r):return post(r[1])+post(r[2])+[r[0]] if r else []
        seq=post(r) if k==6 else [u[0] for u in walk(r)]
        return ('POSTORDER:' if k==6 else 'PREORDER:')+' '+' '.join(map(str,seq))+'\nLEVELORDER: '+' '.join(str(u[0]) for row in levels(r) for u,i in row)
    r=tree(lines[0] if lines else ''); rows=levels(r);nodes=list(walk(r))
    if k==1:return str(not nodes or max(i for row in rows for u,i in row)==len(nodes)-1).lower()
    if k==2:return str(max((row[-1][1]-row[0][1]+1 for row in rows),default=0))
    if k==3:return ' '.join(str(u[0]) for u in nodes)
    if k==4:return 'LEVEL_ORDER:\n'+'\n'.join(' '.join(str(u[0]) for u,i in row) for row in rows)+'\nZIGZAG_ORDER:\n'+'\n'.join(' '.join(str(u[0]) for u,i in (row if j%2==0 else row[::-1])) for j,row in enumerate(rows))
    if k==5:return ' '.join(str(row[-1][0][0]) for row in rows)
    if k==8:return ' '.join(str(u[0]) for u in nodes) if nodes else '<empty>'
    if k==9:
        def mirror(u):return [u[0],mirror(u[2]),mirror(u[1])] if u else None
        return str(eq(r,mirror(r))).lower()
    if k==10:
        sub=tree(lines[1]);return str(any(eq(u,sub) for u in nodes)).lower()
    if k==11:return str(sum(int(''.join(map(str,p))) for p in paths(r)))
    if k==12:
        target=int(lines[1]);ps=[p for p in paths(r) if sum(p)==target]
        return '\n'.join(' '.join(map(str,p)) for p in ps) if ps else 'NONE'
    if k==14:
        p,q=map(int,lines[1].split())
        def route(u,val):
            if not u:return None
            if u[0]==val:return [u[0]]
            for child in u[1:]:
                result=route(child,val)
                if result:return [u[0]]+result
        a,b=route(r,p),route(r,q);ans=None
        for x,y in zip(a,b):
            if x!=y:break
            ans=x
        return str(ans)
    if k in (13,15):
        ns,adj=binary_graph(r);best=0 if k==13 else -10**30
        for src in range(len(ns)):
            q=[(src,-1,0 if k==13 else ns[src][0])]
            for u,p,value in q:
                best=max(best,value)
                q.extend((v,u,value+(1 if k==13 else ns[v][0])) for v in adj[u] if v!=p)
        return str(best)
    if k==19:
        best=0
        for u in nodes:
            for side in (1,2):
                v=u;d=0
                while v[side]:v=v[side];d+=1;side=3-side
                best=max(best,d)
        return str(best)
    raise ValueError(k)

def runone(d):
    k=int(d.name[5:7]);exe=BIN/f'E{k:02}.exe';start=time.time()
    cp=subprocess.run(['g++','-std=c++17','-O2',str(d/'solution/main.cpp'),'-o',str(exe)],capture_output=True,text=True)
    result={'key':f'E{k:02}','source':str(d.relative_to(ROOT)).replace('\\','/'),'compiled':cp.returncode==0,'compiler_error':cp.stderr,'cases':[]}
    if cp.returncode:return result
    for c in json.loads((d/'tests/cases.json').read_text(encoding='utf-8')):
        inp=(d/c['input']).read_text();expected=(d/c['expected']).read_text();ref=oracle(k,inp)
        proc=subprocess.run([str(exe)],input=inp,capture_output=True,text=True,timeout=3)
        result['cases'].append({'id':c['id'],'input_source':c['input'],'input_sha256':hashlib.sha256(inp.encode()).hexdigest(),'input_tokens':len(inp.split()),'expected':expected.strip(),'independent':ref.strip(),'solution':proc.stdout.strip(),'exit':proc.returncode,'solution_matches_expected':proc.returncode==0 and proc.stdout.split()==expected.split(),'independent_matches_expected':ref.split()==expected.split()})
    result['seconds']=round(time.time()-start,2)
    print(result['key'],'compiled; official',sum(c['solution_matches_expected'] for c in result['cases']),'/20; independent',sum(c['independent_matches_expected'] for c in result['cases']),'/20',flush=True)
    return result

if __name__=='__main__':
    labs=sorted((ROOT/'labs/chapter-04/exercise').iterdir())
    with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(runone,labs))
    (OUT/'test-verification.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Saved all 400 case results',flush=True)
