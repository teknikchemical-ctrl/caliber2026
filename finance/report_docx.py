"""Word version of the report: adapts the manual's Word builder. Run after report_build.py (needs build/cover.pdf)."""
import os, sys, re, types
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, "..", "manual"))
import engine
engine.IMG = os.path.join(HERE, "img"); engine.BLD = os.path.join(HERE, "build")
src = open(os.path.join(HERE, "..", "manual", "docx_build.py")).read()
src = src.replace("import build as B", "import report_shim as B")
a = src.index("    # document control"); b = src.index("    # TOC (heading not in TOC)")
src = src[:a] + src[b:]
src = src.replace("Asset Knowledge Platform | User Manual\\tPage ", "Business Impact and Financial Modelling Report | Asset Knowledge Platform\\tPage ")
src = src.replace('n.font.size = Pt(10)', 'n.font.size = Pt(9.5)').replace('n.paragraph_format.space_after = Pt(6)', 'n.paragraph_format.space_after = Pt(4)').replace('min(max(maxh * 0.68, 105), 125)', 'min(max(maxh * 0.62, 90), 105)')
src = src.replace('    br = d.add_paragraph(); br.add_run().add_break(WD_BREAK.PAGE)\n', '')
# drop the back cover
a = src.index("    # ---------- back cover"); b = src.index("    d.core_properties.title")
src = src[:a] + src[b:]
src = src.replace('{B.TITLE} {B.SUB}', '{B.TITLE}')
src = src.replace('hp.paragraph_format.page_break_before = newpart', 'hp.paragraph_format.page_break_before = True')
src = src.replace('os.path.join(HERE, "..", "deck", "manual", "Asset_Knowledge_Platform_User_Manual.docx")', 'os.path.join(HERE, "Business_Impact_and_Financial_Modelling_Report.docx")')
src = src.replace("HERE = os.path.dirname(__file__)", "HERE = os.path.dirname(os.path.abspath(__file__))")
src = re.sub(r'if __name__ == "__main__":.*', '', src, flags=re.S)
mod = types.ModuleType("rdocx"); mod.__file__ = os.path.join(HERE, "rdocx.py"); mod.__dict__["HERE"] = HERE
exec(compile(src, "docx_build_adapted", "exec"), mod.__dict__)
mod.HERE = HERE
if __name__ == "__main__":
    out, doc = mod.build_docx()
    pdf = mod.lo_pdf(out); pages, n = mod.find_pages(pdf, doc); print("pass1", n, "pages; headings found", len(pages), "of", len(doc.toc))
    out, doc = mod.build_docx(pages, out)
    pdf = mod.lo_pdf(out); pages2, n = mod.find_pages(pdf, doc)
    if pages2 != pages: out, doc = mod.build_docx(pages2, out)
    print("DOCX", out, n, "pages in LibreOffice")
