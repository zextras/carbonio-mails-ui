/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { Folder, soapFetch } from '@zextras/carbonio-shell-ui';
import { isEmpty, isNil, omitBy } from 'lodash';
import type { FolderType } from '../../types';
import type { DataProps } from '../../carbonio-ui-commons/types/sidebar';

type FolderActionProps = {
	folder: FolderType | DataProps | Omit<Folder, 'parent'>;
	color?: number;
	zid?: string;
	op: string;
	name?: string;
	l?: string;
	recursive?: boolean;
	retentionPolicy?: unknown;
};

export const folderAction = createAsyncThunk(
	'contacts/folderAction',
	async ({ folder, color, zid, op, name, l, recursive, retentionPolicy }: FolderActionProps) => {
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
							zid
						},
						isNil
					),
					_jsns: 'urn:zimbraMail'
			  });
		return result;
	}
);
