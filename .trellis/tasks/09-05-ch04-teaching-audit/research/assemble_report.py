from pathlib import Path
import json,re,hashlib
from collections import Counter
ROOT=Path(__file__).resolve().parents[4];TASK=Path(__file__).resolve().parent.parent
inv=json.loads((TASK/'research/blind-inventory.json').read_text(encoding='utf-8'))
def link(p,line=1,label=None):return f'[{label or Path(p).name}](<{(ROOT/p).as_posix()}:{line}>)'
aliases={f'A{i}':r['source'] for i,r in enumerate(inv['articles'])}
aliases.update({'INDEX':'.vitepress/content-index.ts','QUIZUI':'.vitepress/theme/components/QuizSet.vue','QUIZDATA':'.vitepress/quiz.data.ts','REVIEWDATA':'.vitepress/review.data.ts','COMPARE':'tools/lab/compare.mjs','STACK':'content/chapter-02-stack-queue/01-stack.md','STACKAPP':'content/chapter-02-stack-queue/03-applications.md'})
for kind,n,prefix in [('theory',8,'T'),('exercise',20,'E')]:
    for i in range(1,n+1):
        d=next((ROOT/'labs/chapter-04'/kind).glob(f'{prefix}-04-{i:02}*'))
        for name,rel in [('readme','README.md'),('quiz','quiz.json'),('student','student/main.cpp'),('solution','solution/main.cpp'),('manifest','lab.json')]:aliases[f'{prefix}{i:02}.{name}']=(d/rel).relative_to(ROOT).as_posix()
for i in [1,2]:aliases[f'X{i:02}.readme']=next((ROOT/'labs/chapter-05/theory').glob(f'T-05-{i:02}*/README.md')).relative_to(ROOT).as_posix()
for n,stem in [(6,'006-star-unequal'),(8,'008-three-edge-center'),(15,'015-spider-unequal-arms')]:aliases[f'E18.test{n:03}']=str(Path(aliases['E18.readme']).parent/'tests'/(stem+'.out')).replace('\\','/')
body=(TASK/'report-body.md').read_text(encoding='utf-8')
refs=[]
def expand(m):
    alias,line=m.group(1),int(m.group(2));p=aliases[alias];lines=(ROOT/p).read_text(encoding='utf-8').splitlines();assert 0<line<=len(lines),(alias,line)
    refs.append({'alias':alias,'path':p,'line':line,'actual':lines[line-1]})
    return link(p,line,f'{alias}:{line}')
body=re.sub(r'@([A-Za-z0-9.]+):(\d+)@',expand,body)
inventory='# 附录 A：完整文件与练习清单\n\n本章文章编号A0–A6与正文第2节一一对应；以下给出全部Lab的实际目录与计数。代码题的README、starter、solution、manifest和全部cases均已读取/核验。\n\n'
inventory+='|组别|实际入口（完整路径见链接）|选择|综合|状态|\n|---|---|---:|---:|---|\n'
for i in range(1,9):
    qs=[q for q in inv['choice'] if q['key'].startswith(f'T{i:02}-')];cs=[q for q in inv['composite'] if q['key'].startswith(f'T{i:02}-')];p=aliases[f'T{i:02}.readme']
    inventory+=f'|T{i:02}|{link(p,16,str(Path(p).parent).replace(chr(92),"/"))}|{len(qs)}|{len(cs)}|全读并逐题核对|\n'
inventory+='\n|代码题|实际入口|测试用例|最大实测现有节点数|现有用例输出核对|\n|---|---|---:|---:|---|\n'
facts=json.loads((TASK/'research/test-range-facts.json').read_text(encoding='utf-8'))
for i in range(1,21):
    p=aliases[f'E{i:02}.readme'];n=facts[i-1]['max_n'];result='standard20/20；独立17/20，3个期望错误' if i==18 else 'standard与独立计算均20/20'
    inventory+=f'|E{i:02}|{link(p,16,str(Path(p).parent).replace(chr(92),"/"))}|20|{n}|{result}|\n'
inventory+='\n|关联组|实际入口|选择|综合|\n|---|---|---:|---:|\n'
for i,ct in [(1,16),(2,9)]:
    p=aliases[f'X{i:02}.readme'];inventory+=f'|X{i:02}|{link(p,16,str(Path(p).parent).replace(chr(92),"/"))}|{ct}|{1 if i==1 else 0}|\n'
inventory+='\n配套材料：\n\n'
for name,label in [('coverage.csv','可筛选逐题覆盖表（211行CSV）'),('research/first-attempts.md','本章逐题先行尝试'),('research/associated-attempts.md','关联题尝试及答案暴露记录'),('research/article-reading.md','先读文章的能力记录'),('research/test-verification.json','400个现有用例逐一核算结果'),('research/counterexample-results.json','定向反例与网页代码编译结果'),('research/test-range-facts.json','现有测试规模与题面范围冲突'),('research/coverage.json','结构化覆盖清单')]:
    inventory+='- '+link((TASK/name).relative_to(ROOT).as_posix(),1,label)+'\n'
body=body.replace('<!-- APPEND_INVENTORY -->',inventory).replace('<!-- APPEND_TABLES -->',(TASK/'coverage-tables.md').read_text(encoding='utf-8'))
(TASK/'report.md').write_text(body,encoding='utf-8')
(TASK/'research/evidence-lines.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2),encoding='utf-8')
files=[]
for folder in ['content/chapter-04-tree','labs/chapter-04']:
    for p in sorted((ROOT/folder).rglob('*')):
        if p.is_file():files.append({'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(TASK/'research/source-snapshot.json').write_text(json.dumps(files,ensure_ascii=False,indent=2),encoding='utf-8')
print('Report bytes',len(body.encode()),'lines',len(body.splitlines()),'evidence anchors',len(refs),'source files',len(files))
print('Unexpanded markers',re.findall(r'@[A-Za-z0-9.]+:\d+@',body))
