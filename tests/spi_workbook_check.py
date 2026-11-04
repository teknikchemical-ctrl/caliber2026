#!/usr/bin/env python3.13
"""Reconciles spi/db/spi.sqlite with the CALIBER Inventory Calculation Workbook (spi/data/reference), an independent calculation of the same six files.
Usage: python3.13 tests/spi_workbook_check.py   Exit code 1 on any mismatch in the compared fields."""
import sys, openpyxl, sqlite3, pandas as pd
ROOT = __file__.rsplit("/tests/", 1)[0]
wb = openpyxl.load_workbook(ROOT + "/spi/data/reference/CALIBER_Inventory_Calculation_Workbook.xlsx", read_only=True, data_only=True)
rows = list(wb["All Materials"].iter_rows(values_only=True)); W = pd.DataFrame(rows[1:], columns=rows[0]); W["Material ID"] = W["Material ID"].astype(int)
c = sqlite3.connect(ROOT + "/spi/db/spi.sqlite")
D = pd.read_sql("select material_no, stock, min_qty, max_qty, n_issues, total_qty, months_active, adi, cv2, demand_class, n_funcloc from part_profile", c)
M = W.merge(D, left_on="Material ID", right_on="material_no", how="outer", indicator=True); bad = 0
def ok(cond, msg):
    global bad; print("ok  " if cond else "FAIL", msg); bad += 0 if cond else 1
ok((M._merge == "both").all() and len(M) == 7481, "same 7,481 material ids in the workbook and the database")
M = M[M._merge == "both"]
for a, b, n in [("On Hand", "stock", "on hand"), ("Current Min", "min_qty", "Min"), ("Current Max", "max_qty", "Max"), ("Issue Events", "n_issues", "issue events"), ("Total Issued", "total_qty", "total issued"), ("Positive Months", "months_active", "active months"), ("BoM Locations", "n_funcloc", "BoM locations")]:
    x = pd.to_numeric(M[a], errors="coerce"); y = pd.to_numeric(M[b], errors="coerce"); ok(((x - y).abs() < 1e-6).all(), f"{n} equal for all materials")
x = pd.to_numeric(M["ADI"], errors="coerce"); y = M["adi"]; both = x.notna() & y.notna(); ok((abs(x - y)[both] < 0.0011).all(), "ADI equal (workbook rounds to 3 decimals)")
x = pd.to_numeric(M["CV² (positive sizes)"], errors="coerce"); y = M["cv2"]; both = x.notna() & y.notna(); ok((abs(x - y)[both] < 0.0011).all(), "CV2 equal (sample variance, workbook rounds to 3 decimals)")
mp = {"Smooth": "smooth", "Erratic": "erratic", "Intermittent": "intermittent", "Lumpy": "lumpy", "No observed demand": "no_demand", "Insufficient positive observations": "single_event"}
ok((M["Demand Class"].map(mp) == M["demand_class"]).all(), "demand class equal for all materials")
print("\nAll reconciliation checks passed" if not bad else f"\n{bad} check(s) failed"); sys.exit(1 if bad else 0)
