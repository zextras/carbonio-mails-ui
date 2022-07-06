/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import {
	MailsEditor,
	SaveDraftNewParameters,
	saveDraftNewResult,
	SaveDraftRequest,
	SaveDraftResponse
} from '../../types';
import { generateRequest } from '../editor-slice-utils';

export const saveDraft = createAsyncThunk<saveDraftNewResult, SaveDraftNewParameters>(
	'saveDraft',
	async ({ data }) => {
		const resp = (await soapFetch<SaveDraftRequest, SaveDraftResponse>('SaveDraft', {
			_jsns: 'urn:zimbraMail',
			m: generateRequest(data)
		})) as SaveDraftResponse;

		return { resp };
	}
);
