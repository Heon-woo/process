import os
from pathlib import Path
from tempfile import TemporaryDirectory


TEST_DATA = TemporaryDirectory(prefix="pass_test_")
TEST_DATA_DIR = Path(TEST_DATA.name)
os.environ["PASS_DB_PATH"] = str(TEST_DATA_DIR / "test_pass.db")
os.environ["PASS_UPLOAD_DIR"] = str(TEST_DATA_DIR / "uploads")
