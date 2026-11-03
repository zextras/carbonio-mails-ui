/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { CreateMountpointError } from 'api/errors/create-mountpoint-error';
import { ISoapFolderObj } from 'types/soap/soap';

type MountpointSpecType = {
	l?: string;
	name: string;
	zid?: string;
	rid?: string;
	view?: string;
	color?: number;
	rgb?: string;
	url?: string;
	fie?: boolean;
	reminder?: boolean;
	owner?: string;
	path?: string;
	f?: string;
};

export type CreateMountPointRequest = {
	_jsns: 'urn:zimbraMail';
	link: MountpointSpecType;
};

export type SoapMountpoint = ISoapFolderObj & {
	f?: string;
	zid: string;
	rid: number;
	ruuid: string;
	owner: string;
	oname: string;
	reminder: boolean;
	rest?: string;
	perm?: string;
};

export type CreateMountpointResponse = {
	link: Array<SoapMountpoint>;
	_jsns: 'urn:zimbraMail';
};

export type MountSharedFolderParams = {
	zid: string;
	view: string;
	rid: string;
	folderName: string;
	rgb: string;
	accounts: Array<{ name: string }>;
};

export const mountSharedFolderSoapApi = async (
	params: MountSharedFolderParams
): Promise<SoapMountpoint> => {
	const request: CreateMountPointRequest = {
		_jsns: 'urn:zimbraMail' as const,
		link: {
			l: FOLDERS.USER_ROOT,
			name: params.folderName,
			zid: params.zid,
			rid: params.rid,
			view: params.view,
			rgb: params.rgb,
			f: '#'
		}
	};

	const response = await legacySoapFetch<
		CreateMountPointRequest,
		CreateMountpointResponse & ErrorSoapBodyResponse
	>('CreateMountpoint', request, params.accounts[0].name);

	if (response.Fault) {
		throw new CreateMountpointError(response.Fault);
	}

	return response.link[0];
};
