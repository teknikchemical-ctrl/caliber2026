# Data findings 2 (re-review of all six files, 2026-11-04). Every number comes from `spi/db/spi.sqlite`.

## Demand (consumption file, 17 months, 17,518 issues, 1,930 parts ever issued)
| Class | Parts | Issued value IDR bn (Estimate, priced) | Share |
|---|---|---|---|
| Erratic | 116 | 162.3 | 62.8% |
| Single event | 1,220 | 30.5 | 11.8% |
| Intermittent | 336 | 28.9 | 11.2% |
| Lumpy | 231 | 26.5 | 10.3% |
| Smooth | 27 | 10.1 | 3.9% |
Total issued value, priced parts: IDR 258.3 bn (1,015 of 1,930 parts have a price). Reading: **116 erratic parts carry 63% of the value**, so forecasting effort belongs there; the 1,220 single-event parts cannot be forecast and need a policy (insurance or minimal stock), not a model. ABC/XYZ: 913 of the 1,930 have no ABC (no price), almost all are XYZ class Z (irregular).
- Monthly issued quantity: 61 k (2025-05) rising to 259 k (2026-01), then 32 k to 85 k after. Campaign months 2025-12 and 2026-01 ran 2.8 times the normal month.

## What does and does not drive demand (be honest on the page)
- Planned maintenance (reconstructed from cycle start and length) against monthly consumption: correlation 0.13 to 0.23 with the first month, **-0.04 to -0.35 without the opening-backlog month**. At portfolio level the plan does not predict monthly consumption.
- Notification count against monthly orders: -0.33 without the backlog month. Notifications do not predict portfolio consumption either.
- **Only the shutdown campaign shows up** (Dec and Jan, 2.8 times). Use it as the one measured driver, by item type.
- Only **15.9%** of issues link to a notification (2,791 of 17,518). 84% of consumption has no failure or work order link in the data. The page must say this.
- Part level: parts at locations with notifications average 1,373 units issued against 257 for others. This is a population and activity effect (selection), usable as a part-level driver, not proof of causation.
- Planned items that map to at least one spare part: 5,872 of 10,153 (58%); 5.2 parts per location on average. Turnaround readiness can only cover those.

## Failure frequency (notifications as proxy; no failure codes, no cost, no downtime in the data)
- 5,795 notifications; types N1 (3,871), N3 (1,788), N2 (135, all Emergency), N6 (1). Meaning of types is not given.
- 27 locations have 3 or more high or emergency notifications (repeat failures).
- Notifications per 100 locations: SYSTEM 1,194, KC compressors 239, CL 187, BF furnaces 170, HE 110, PP pumps 86. (Opening-backlog month included.)

## Procurement and lead time (PR date to PO delivery, a proxy)
- Median lead by criticality: S 83 d, A 97 d, B 95 d, C 91 d; p90 about 355 d for every class. Lead time variability: standard deviation about 31% of the mean (1,044 parts).
- By purchase request type: PR01 177 d, PR05 130 d, PR10 119 d, PR04 79 d, PR06 63 d, PR03 59 d. Only 1,221 parts have a lead time; the rest use the default.
- Purchase amount is a unit price; PO spend does not reconcile with issued value (IDR 3.1 tn against 258 bn): do not claim savings from it.

## Stock position
IDR 616.6 bn priced stock, 546.4 bn above Max (415.1 bn set Max, 131.3 bn Non Stock items); top 10 parts 72% of excess; 2,502 insurance spares worth 379.9 bn stay; 53 S and A parts at zero stock with demand in 2 or more months.

## Consequences for the build
1. F1 leads with value concentration (116 erratic parts, 63%) and the single-event finding, not with a generic method list.
2. Maintenance tab shows the plan and the campaign effect and states plainly that portfolio consumption does not follow the planned-task count; readiness covers the 58% of tasks that map to parts.
3. Failure frequency is notification frequency by class; no MTBF.
4. Cost views use labelled assumptions for downtime and emergency premium; the data has neither.
