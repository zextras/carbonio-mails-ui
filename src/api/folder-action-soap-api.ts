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
	rgb?: string;
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
	rgb,
	zid,
	op,
	name,
	l,
	recursive,
	retentionPolicy,
	type
}: FolderActionProps): Promise<FolderActionResponse> {
	const mainAction = omitBy(
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
	);
	// The server ignores `rgb` on any operation but `color`, so a custom color is always sent as a
	// separate `color` action next to the main one.
	const additionalActions = [
		...(rgb ? [{ id: folder.id, op: 'color', rgb }] : []),
		...(!isEmpty(retentionPolicy)
			? [{ id: folder.id, op: 'retentionpolicy', retentionPolicy }]
			: [])
	];

	const result = additionalActions.length
		? await legacySoapFetch('Batch', {
				FolderActionRequest: [mainAction, ...additionalActions].map((action) => ({
					action,
					_jsns: 'urn:zimbraMail'
				})),
				_jsns: 'urn:zimbra'
			})
		: await legacySoapFetch('FolderAction', {
				action: mainAction,
				_jsns: 'urn:zimbraMail'
			});
	return result as FolderActionResponse;
}
