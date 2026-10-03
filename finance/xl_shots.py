"""Excel screenshots for the report: LibreOffice renders the workbook, pages are cropped to the figures used in the report."""
import os, subprocess, sys
from pypdf import PdfReader
from PIL import Image, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__)); TMP = "/tmp/claude-0/t/xl2"; os.makedirs(TMP, exist_ok=True)
XLSX = os.path.join(HERE, "Business_Impact_Financial_Model.xlsx"); IMG = os.path.join(HERE, "img")
def main():
    for f in os.listdir(TMP): os.remove(os.path.join(TMP, f))
    subprocess.run(["soffice", "-env:UserInstallation=file:///tmp/claude-0/t/lo_profile3", "--headless", "--convert-to", "pdf", "--outdir", TMP, XLSX], check=True, capture_output=True, timeout=300)
    pdf = os.path.join(TMP, "Business_Impact_Financial_Model.pdf"); r = PdfReader(pdf)
    keys = {"summary": "Summary of results", "inputs": "All drivers with pessimistic", "casemetrics": "Every figure is a formula on Case_Data", "downtime": "Replaces the earlier flat assumption", "levers": "Annual value of one unit at 100%", "costs": "One-off cost shared by all units, one-off cost for each unit",
            "cf3": "Cash flow and returns: 3 units", "comp": "Alternatives and positioning", "risks": "Risk register with financial impact", "recon": "Reconciliation to the earlier", "sens": "Sensitivity analysis (3 units", "mc": "Monte Carlo simulation", "market": "Market analysis: Indonesian"}
    pages = {}
    for i, p in enumerate(r.pages):
        t = p.extract_text() or ""
        for k, s in keys.items():
            if k not in pages and s in t: pages[k] = i + 1
    print(pages)
    for k, p in pages.items():
        subprocess.run(["pdftoppm", "-png", "-r", "230", "-f", str(p), "-l", str(p), "-singlefile", pdf, os.path.join(TMP, "x_" + k)], check=True)
        im = Image.open(os.path.join(TMP, "x_" + k + ".png")).convert("RGB"); bbox = ImageChops.difference(im, Image.new("RGB", im.size, (255, 255, 255))).getbbox()
        im = im.crop((max(0, bbox[0] - 10), max(0, bbox[1] - 10), bbox[2] + 10, bbox[3] + 10)); im.save(os.path.join(IMG, "xf_" + k + ".png"))
CROPS = {"summary": (0, 0, 0.53, 0.34), "inputs": (0, 0, 0.62, 0.42), "casemetrics": (0, 0, 0.71, 0.40), "downtime": (0, 0, 0.76, 0.445), "levers": (0, 0, 1, 1), "costs": (0, 0, 1, 0.83),
         "cf3": (0, 0, 1, 0.97), "comp": (0, 0, 1, 0.64), "risks": (0, 0, 0.505, 1), "recon": (0, 0, 1, 1)}
def crops():
    for k, b in CROPS.items():
        im = Image.open(os.path.join(IMG, "xf_" + k + ".png")); W, H = im.size
        im.crop((int(b[0] * W), int(b[1] * H), int(b[2] * W), int(b[3] * H))).save(os.path.join(IMG, "s_" + k + ".png"))
if __name__ == "__main__":
    if "--crop" not in sys.argv: main()
    crops()
