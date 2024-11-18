/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { ErrorSoapBodyResponse, soapFetch } from '@zextras/carbonio-shell-ui';

import { CreateMountPointRequest, CreateMountpointResponse, MountpointSpecType } from '../../types';

export type CreateMountpointDataType = {
	zid: string;
	view: string;
	rid: string;
	folderName: string;
	color: number;
	accounts: Array<{ name: string }>;
};

export const mountSharedFolder = createAsyncThunk(
	'mails/mountSharedFolder',
	async (data: CreateMountpointDataType) => {
		const request = {
			_jsns: 'urn:zimbraMail' as const,
			link: {
				l: 1,
				name: data.folderName,
				zid: data.zid,
				rid: data.rid,
				view: data.view,
				color: data.color,
				f: '#'
			} as MountpointSpecType
		};
		const response = await soapFetch<
			CreateMountPointRequest,
			CreateMountpointResponse & ErrorSoapBodyResponse
		>('CreateMountpoint', request, data.accounts[0].name);

		if (response.Fault) {
			throw new Error(response.Fault.Detail.Error.Code);
		}

		return { response };
	}
);
