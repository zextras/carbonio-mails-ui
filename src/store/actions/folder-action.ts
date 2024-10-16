/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { isEmpty, isNil, omitBy } from 'lodash';

import type { Folder } from '../../carbonio-ui-commons/types/folder';
import { DataProps } from '../../carbonio-ui-commons/types/sidebar';
import { FolderActionResponse } from '../../types';

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

export async function folderAction({
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
		? await soapFetch('Batch', {
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
		: await soapFetch('FolderAction', {
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
