/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createAsyncThunk } from '@reduxjs/toolkit';

export const searchInBackupAPI = createAsyncThunk<
	{ status: number; messages?: Array<any> },
	{
		startDate: string;
		endDate: string;
		keyword?: string;
	}
>(
	'searchInBackup',
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	async (startDate, endDate, keyword) => {
		fetch(`/zx/backup/v1/search?start=${startDate}&end=${endDate}&keyword=${keyword}`, {
			method: 'POST',
			credentials: 'same-origin'
		}).then((res) => res);
	}
);
