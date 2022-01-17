/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';

export const getOutgoingFilters = createAsyncThunk(
	'filters/get_filters',
	async (): Promise<any> => {
		const { filterRules } = await soapFetch('GetOutgoingFilterRules', {
			_jsns: 'urn:zimbraMail'
		});
		return { filterRules };
	}
);
