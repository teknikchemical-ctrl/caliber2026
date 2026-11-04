#!/usr/bin/env bash
# Rebuilds everything derived from the six raw files: database, fixture, equipment sets and the case pack (owner: Claude A). Needs python3.13 with pandas and openpyxl.
set -euo pipefail; cd "$(dirname "$0")/../.."
python3.13 spi/etl/build_db.py && python3.13 spi/etl/make_case.py | grep -v '^warn' && python3.13 spi/etl/make_eval.py | head -1 && python3.13 spi/etl/make_fixture.py && node tests/spi_data.js full | tail -1
python3 spi/etl/polish_db.py
python3.13 spi/ml/train.py
python3.13 spi/ml/train_more.py
node tools/spi_review_bake.mjs
