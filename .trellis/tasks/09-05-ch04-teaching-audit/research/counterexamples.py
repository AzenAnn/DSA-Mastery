from verify import ROOT, OUT, BIN, oracle
import subprocess, json, re

def execute(k, name, inp, expected, timeout=3):
    p=OUT/'counterexamples';p.mkdir(exist_ok=True)
    (p/(name+'.in')).write_text(inp,encoding='utf-8')
    try:
        r=subprocess.run([str(BIN/f'E{k:02}.exe')],input=inp,text=True,capture_output=True,timeout=timeout)
        return {'name':name,'lab':f'E{k:02}','expected':expected,'exit':r.returncode,'actual':r.stdout[:200],'stderr':r.stderr[:250],'input_file':str((p/(name+'.in')).relative_to(ROOT)).replace('\\','/')}
    except subprocess.TimeoutExpired:return {'name':name,'lab':f'E{k:02}','expected':expected,'timeout_seconds':timeout}

def extremes(d):
    return '1 1 1 '+'1 null null 1 '*(d-1)+'\n'

rs=[]
rs.append(execute(1,'E01-hash-null','1 # 2\n','false'))
rs.append(execute(2,'E02-width-2pow64',extremes(64),str(2**64)))
rs.append(execute(11,'E11-ten-digits','9 '+'9 null '*9+'\n','9999999999'))
rs.append(execute(10,'E10-trailing-space','1 2 3 \n2\n','true'))
rs.append(execute(12,'E12-trailing-space','1 2 3 \n3\n','1 2'))
rs.append(execute(14,'E14-trailing-space','1 2 3 \n2 3\n','1'))
rs.append(execute(18,'E18-asymmetric-edge','3\n1 2 3\n2 3 1\n','2.00\nEDGE 1 2 2.00'))
n=100000
weighted=str(n)+'\n'+''.join(f'{i} {i+1} 1\n' for i in range(1,n))
rs.append(execute(16,'E16-chain-100000',weighted,'n个距离和；端点4999950000'))
rs.append(execute(19,'E19-chain-100000','1 '+'1 null '*(n-1)+'\n','1'))
chain=str(n)+'\n'+''.join(f'{i} {i+1}\n' for i in range(1,n))
rs.append(execute(20,'E20-chain-100000',chain+chain,'ISOMORPHIC'))
for k in range(16,21):
    md=next((ROOT/'labs/chapter-04/exercise').glob(f'E-04-{k:02}*/README.md')).read_text(encoding='utf-8')
    code=re.findall(r'```cpp[^\n]*\n(.*?)\n```',md,re.S)[-1]
    p=OUT/f'E{k:02}-readme-code.cpp';p.write_text(code,encoding='utf-8')
    cp=subprocess.run(['g++','-std=c++17','-fsyntax-only',str(p)],capture_output=True,text=True)
    rs.append({'name':f'E{k:02}-web-code-compile','exit':cp.returncode,'compiler_error':cp.stderr[:900]})
(OUT/'counterexample-results.json').write_text(json.dumps(rs,ensure_ascii=False,indent=2),encoding='utf-8')
for r in rs:print(r)
