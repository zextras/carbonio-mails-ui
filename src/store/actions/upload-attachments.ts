/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { map } from 'lodash';
import { convertToDecimal } from '../../commons/utilities';

export const uploadAttachments = createAsyncThunk<any, any>(
	'uploadAttachments',
	async (files: any) =>
		Promise.all(
			map(files.files, (file) =>
				fetch('/service/upload?fmt=extended,raw', {
					headers: {
						'Cache-Control': 'no-cache',
						'X-Requested-With': 'XMLHttpRequest',
						'Content-Type': `${file.type || 'application/octet-stream'};`,
						'Content-Disposition': `attachment; filename="${convertToDecimal(file.name)}"`
					},
					method: 'POST',
					body: file
				})
					.then((res) => res.text())
					// eslint-disable-next-line no-eval
					.then((txt) => eval(`[${txt}]`))
					.then((val) => ({ aid: val[2][0].aid }))
			)
		)
);
