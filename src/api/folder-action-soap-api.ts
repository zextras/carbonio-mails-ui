/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Folder } from '@zextras/carbonio-ui-commons';
import { DataProps } from '@zextras/carbonio-ui-commons';
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { isEmpty, isNil, omitBy } from 'lodash';

import { FolderActionResponse } from 'types/soap/soap';

export type FolderActionProps = {
	folder: Folder | DataProps | Omit<Folder, 'parent'>;
	color?: number;
	zid?: string;
	op: string;
	name?: string;
	l?: string;
	recursive?: boolean;
	retentionPolicy?: unknown;
	type?: string;
};

export async function folderActionSoapApi({
	folder,
	color,
	zid,
	op,
	name,
	l,
	recursive,
	retentionPolicy,
	type
}: FolderActionProps): Promise<FolderActionResponse> {
	const result = !isEmpty(retentionPolicy)
		? await legacySoapFetch('Batch', {
				FolderActionRequest: [
					{
						action: {
							id: folder.id,
							op,
							l,
							recursive,
							name,
							color
						},
						_jsns: 'urn:zimbraMail'
					},
					{
						action: {
							id: folder.id,
							op: 'retentionpolicy',
							retentionPolicy
						},
						_jsns: 'urn:zimbraMail'
					}
				],
				_jsns: 'urn:zimbra'
			})
		: await legacySoapFetch('FolderAction', {
				action: omitBy(
					{
						id: folder.id,
						op,
						l,
						recursive,
						name,
						color,
						zid,
						...(type && { type })
					},
					isNil
				),
				_jsns: 'urn:zimbraMail'
			});
	return result as FolderActionResponse;
}
