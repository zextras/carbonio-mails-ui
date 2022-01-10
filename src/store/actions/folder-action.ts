/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/zapp-shell';
import { identity, isNil, omitBy, pickBy } from 'lodash';

export const folderAction = createAsyncThunk(
	'contacts/folderAction',
	async ({ folder, color, zid, op, name, l, recursive, retentionPolicy }: any) => {
		const result = retentionPolicy
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
