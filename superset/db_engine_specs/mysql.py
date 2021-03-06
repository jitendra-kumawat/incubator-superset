# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
# pylint: disable=C,R,W
from datetime import datetime
from typing import Any, Dict, Optional
from urllib import parse

from sqlalchemy.engine.interfaces import Dialect
from sqlalchemy.types import TypeEngine

from superset.db_engine_specs.base import BaseEngineSpec


class MySQLEngineSpec(BaseEngineSpec):
    engine = "mysql"
    max_column_name_length = 64

    _time_grain_functions = {
        None: "{col}",
        "PT1S": "DATE_ADD(DATE({col}), "
        "INTERVAL (HOUR({col})*60*60 + MINUTE({col})*60"
        " + SECOND({col})) SECOND)",
        "PT1M": "DATE_ADD(DATE({col}), "
        "INTERVAL (HOUR({col})*60 + MINUTE({col})) MINUTE)",
        "PT1H": "DATE_ADD(DATE({col}), " "INTERVAL HOUR({col}) HOUR)",
        "P1D": "DATE({col})",
        "P1W": "DATE(DATE_SUB({col}, " "INTERVAL DAYOFWEEK({col}) - 1 DAY))",
        "P1M": "DATE(DATE_SUB({col}, " "INTERVAL DAYOFMONTH({col}) - 1 DAY))",
        "P0.25Y": "MAKEDATE(YEAR({col}), 1) "
        "+ INTERVAL QUARTER({col}) QUARTER - INTERVAL 1 QUARTER",
        "P1Y": "DATE(DATE_SUB({col}, " "INTERVAL DAYOFYEAR({col}) - 1 DAY))",
        "1969-12-29T00:00:00Z/P1W": "DATE(DATE_SUB({col}, "
        "INTERVAL DAYOFWEEK(DATE_SUB({col}, "
        "INTERVAL 1 DAY)) - 1 DAY))",
    }

    type_code_map: Dict[int, str] = {}  # loaded from get_datatype only if needed

    @classmethod
    def convert_dttm(cls, target_type: str, dttm: datetime) -> str:
        if target_type.upper() in ("DATETIME", "DATE"):
            return "STR_TO_DATE('{}', '%Y-%m-%d %H:%i:%s')".format(
                dttm.strftime("%Y-%m-%d %H:%M:%S")
            )
        return "'{}'".format(dttm.strftime("%Y-%m-%d %H:%M:%S"))

    @classmethod
    def adjust_database_uri(cls, uri, selected_schema=None):
        if selected_schema:
            uri.database = parse.quote(selected_schema, safe="")
        return uri

    @classmethod
    def get_datatype(cls, type_code: Any) -> Optional[str]:
        if not cls.type_code_map:
            # only import and store if needed at least once
            import MySQLdb  # pylint: disable=import-error

            ft = MySQLdb.constants.FIELD_TYPE
            cls.type_code_map = {
                getattr(ft, k): k for k in dir(ft) if not k.startswith("_")
            }
        datatype = type_code
        if isinstance(type_code, int):
            datatype = cls.type_code_map.get(type_code)
        if datatype and isinstance(datatype, str) and len(datatype):
            return datatype
        return None

    @classmethod
    def epoch_to_dttm(cls) -> str:
        return "from_unixtime({col})"

    @classmethod
    def _extract_error_message(cls, e):
        """Extract error message for queries"""
        message = str(e)
        try:
            if isinstance(e.args, tuple) and len(e.args) > 1:
                message = e.args[1]
        except Exception:
            pass
        return message

    @classmethod
    def column_datatype_to_string(
        cls, sqla_column_type: TypeEngine, dialect: Dialect
    ) -> str:
        datatype = super().column_datatype_to_string(sqla_column_type, dialect)
        # MySQL dialect started returning long overflowing datatype
        # as in 'VARCHAR(255) COLLATE UTF8MB4_GENERAL_CI'
        # and we don't need the verbose collation type
        str_cutoff = " COLLATE "
        if str_cutoff in datatype:
            datatype = datatype.split(str_cutoff)[0]
        return datatype
