/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';

type removeAttachmentsPayload = {
	id: string;
	attachments: string[];
};

export const deleteAllAttachments = createAsyncThunk(
	'mails/deleteAttachments',
	async ({ id, attachments }: removeAttachmentsPayload) => {
		const res = await soapFetch('RemoveAttachments', {
			_jsns: 'urn:zimbraMail',
			m: {
				id,
				part: attachments.join(',')
			}
		});
		return { res, attachments };
	}
);
