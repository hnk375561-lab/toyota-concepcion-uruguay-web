from pathlib import Path
p = Path(__file__).resolve().parents[1] / "index.html"
s = p.read_text(encoding="utf-8")
s = s.replace('return o.value===a;}),validB=Array.prototype.some.call(cb.options,function(o){return o.value===b;});', 'return o.value===a&&!o.disabled;}),validB=Array.prototype.some.call(cb.options,function(o){return o.value===b&&!o.disabled;});')
s = s.replace('if(h){var target=document.getElementById(h);if(target)setTimeout(function(){window.__toyotaScrollToElement(target);},0);}}', 'if(h.indexOf("gama?")===0){var gama=document.getElementById("gama");if(gama)setTimeout(function(){window.__toyotaScrollToElement(gama);},0);return;}if(h){var target=document.getElementById(h);if(target)setTimeout(function(){window.__toyotaScrollToElement(target);},0);}}')
p.write_text(s, encoding="utf-8")
print("hash route updated")
