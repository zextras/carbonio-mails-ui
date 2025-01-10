/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

type GetShareInfoResponse = {
	share: Partial<{
		ownerId: string;
		ownerEmail: string;
		ownerName: string;
		folderId: number;
		folderUuid: string;
		folderPath: string;
		view: string;
		rights: string;
		granteeType: string;
		granteeId: string;
		granteeName: string;
		granteeDisplayName: string;
		mid: string;
	}>;
};

export async function getShareInfoSoapApi(): Promise<GetShareInfoResponse> {
	const response = await soapFetch<unknown, GetShareInfoResponse>('GetShareInfo', {
		_jsns: 'urn:zimbraAccount',
		includeSelf: 0
	}).catch((error) => {
		console.warn('Failed to fetch share info', error);
		return { share: {} };
	});
	if (!response) {
		return { share: {} };
	}
	return response;
}
