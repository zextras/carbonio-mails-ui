/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AsyncThunkAction } from '@reduxjs/toolkit';
import { reduce } from 'lodash';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { retrieveAttachmentsType } from '../../../../store/editor-slice-utils';
import { MailAttachmentParts, MailsEditor } from '../../../../types';

type AddAttachmentsPayloadType = {
	resp: {
		m: Array<any>;
		_jsns: 'urn:zimbraMail';
	};
};

type UploadAttachmentsCbType = (files: any) => AsyncThunkAction<any, any, any>;

export const addAttachments = async (
	saveDraftCb: (arg: Partial<MailsEditor>) => { payload: AddAttachmentsPayloadType },
	uploadAttachmentsCb: UploadAttachmentsCbType,
	compositionData: Partial<MailsEditor>,
	files: FileList
): Promise<MailAttachmentParts[] | undefined> => {
	const { payload } = await saveDraftCb(compositionData);
	const upload = await uploadAttachmentsCb(files);

	const aid = reduce(
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		upload?.payload,
		(acc: Array<string>, v: { aid: string }): Array<string> => [...acc, v.aid],
		[]
	).join(',');
	const message = normalizeMailMessageFromSoap(payload.resp.m[0]);
	const mp = retrieveAttachmentsType(message, 'attachment');
	const res = await saveDraftCb({
		...compositionData,
		id: payload.resp.m[0].id,
		attach: { aid, mp }
	});

	return retrieveAttachmentsType(
		normalizeMailMessageFromSoap(res?.payload?.resp?.m?.[0]),
		'attachment'
	);
};
