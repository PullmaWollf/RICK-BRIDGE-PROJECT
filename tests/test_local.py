import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest

SCRIPT=Path(__file__).resolve().parents[1]/'local'/'bridge.py'
spec=importlib.util.spec_from_file_location('bridge',SCRIPT)
b=importlib.util.module_from_spec(spec); spec.loader.exec_module(b)

class BridgeTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        b.ROOT=Path(self.temp.name)/'inbox'
        self.src=Path(self.temp.name)/'hello.txt'; self.src.write_text('hello RICK',encoding='utf8')
    def test_share_copy_and_revoke(self):
        m=b.share(self.src); self.src.unlink()
        self.assertIn('hello RICK',b.read(m['id'])['content'][0]['text'])
        self.assertEqual(len(b.listed()),1); b.revoke(m['id']); self.assertEqual(b.listed(),[])
    def test_expired(self):
        m=b.share(self.src); m['expires_at']=time.time()-1
        (b.folder(m['id'])/'meta.json').write_text(json.dumps(m))
        self.assertEqual(b.listed(),[]); self.assertRaises(ValueError,b.read,m['id']); self.assertEqual(b.cleanup(),1)
    def test_paths(self):
        for bad in ('../hello.txt','/etc/passwd','invalid'):
            self.assertRaises(ValueError,b.read,bad)
    def test_ttl(self):
        for bad in (0,86401): self.assertRaises(ValueError,b.share,self.src,bad)
    def test_mcp(self):
        m=b.share(self.src)
        calls=[{'id':1,'method':'initialize','params':{'protocolVersion':'2025-06-18'}},{'method':'notifications/initialized'},{'id':2,'method':'tools/list'},{'id':3,'method':'tools/call','params':{'name':'read_shared_file','arguments':{'file_id':m['id']}}}]
        raw=''.join(json.dumps({'jsonrpc':'2.0',**x})+'\n' for x in calls)
        p=subprocess.run([sys.executable,str(SCRIPT),'serve'],input=raw,text=True,capture_output=True,check=True,env={**os.environ,'RICK_BRIDGE_HOME':str(b.ROOT)})
        out=[json.loads(x) for x in p.stdout.splitlines()]; self.assertEqual(len(out),3); self.assertEqual(len(out[1]['result']['tools']),3); self.assertIn('hello RICK',out[2]['result']['content'][0]['text'])
    def test_binary_fallback(self):
        self.src.rename(self.src.with_suffix('.pdf')); m=b.share(self.src.with_suffix('.pdf'))
        self.assertIn('not supported',b.read(m['id'])['content'][0]['text'])
if __name__=='__main__': unittest.main()
