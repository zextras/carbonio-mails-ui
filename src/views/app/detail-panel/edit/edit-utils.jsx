/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reduce } from 'lodash';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { retrieveAttachmentsType } from '../../../../store/editor-slice-utils';

export const addAttachments = async (saveDraftCb, uploadAttachmentsCb, compositionData, files) => {
	const { payload } = await saveDraftCb(compositionData);
	const upload = await uploadAttachmentsCb(files);
	const aid = reduce(upload.payload, (acc, v) => [...acc, v.aid], []).join(',');
	const message = normalizeMailMessageFromSoap(payload.resp.m[0]);
	const mp = retrieveAttachmentsType(message, 'attachment');
	const res = await saveDraftCb({
		...compositionData,
		id: payload.resp.m[0].id,
		attach: { aid, mp }
	});
	return retrieveAttachmentsType(normalizeMailMessageFromSoap(res.payload.resp.m[0]), 'attachment');
};
