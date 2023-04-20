/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import type {
	MailsEditor,
	PrefsType,
	SaveDraftNewParameters,
	saveDraftNewResult,
	SaveDraftRequest,
	SaveDraftResponse
} from '../../types';
import { generateRequest } from '../editor-slice-utils';

type SaveDraftProps = {
	data: MailsEditor;
	prefs?: Partial<PrefsType> | undefined;
	signal?: AbortSignal;
};

export const saveDraft = createAsyncThunk<saveDraftNewResult, SaveDraftNewParameters>(
	'saveDraft',
	async ({ data, prefs, signal }: SaveDraftProps) => {
		const resp = (await soapFetch<SaveDraftRequest, SaveDraftResponse>(
			'SaveDraft',
			{
				_jsns: 'urn:zimbraMail',
				m: generateRequest(data, prefs)
			},
			null,
			// disabling eslint until the a new shell version is imported
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			signal
		)) as SaveDraftResponse;

		return { resp };
	}
);
