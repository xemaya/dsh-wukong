"""从概念稿 HTML 提取封面 data URI 到 art-production/p0（一次性工具）。"""
import base64, pathlib, re, sys

src = pathlib.Path('/Users/huanghaibin/Downloads/dsh-wukong-black-myth-cover-final.html')
out_dir = pathlib.Path(__file__).resolve().parent.parent / 'art-production/p0'
m = re.search(r'data:(image/[a-z+]+);base64,([A-Za-z0-9+/=]+)', src.read_text())
if m is None:
    sys.exit('no data URI found in concept HTML')
ext = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp'}[m.group(1)]
path = out_dir / f'cover-tianming.{ext}'
path.write_bytes(base64.b64decode(m.group(2)))
print(path, path.stat().st_size)
