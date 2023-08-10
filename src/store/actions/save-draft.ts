/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AccountSettingsPrefs, soapFetch } from '@zextras/carbonio-shell-ui';

import type {
	MailsEditor,
	SaveDraftNewParameters,
	SaveDraftNewResult,
	SaveDraftParameters,
	SaveDraftRequest,
	SaveDraftResponse
} from '../../types';
import { generateRequest } from '../editor-slice-utils';
import { createSoapDraftRequestFromEditor } from '../zustand/editor/editor-transformations';

type SaveDraftProps = {
	data: MailsEditor;
	prefs?: Partial<AccountSettingsPrefs> | undefined;
	signal?: AbortSignal;
};

export const saveDraft = createAsyncThunk<SaveDraftNewResult, SaveDraftNewParameters>(
	'saveDraft',
	async ({ data, prefs, signal }: SaveDraftProps) => {
		const resp = (await soapFetch<SaveDraftRequest, SaveDraftResponse>(
			'SaveDraft',
			{
				_jsns: 'urn:zimbraMail',
				m: generateRequest(data, prefs)
			},
			undefined,
			// FIXME remove the ts-ignore when SHELL-133 will be merged
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			signal
		)) as SaveDraftResponse;

		return { resp };
	}
);

export const saveDraftV3 = ({
	editor,
	signal,
	attach
}: SaveDraftParameters): Promise<SaveDraftResponse> =>
	soapFetch<SaveDraftRequest, SaveDraftResponse>(
		'SaveDraft',
		{
			_jsns: 'urn:zimbraMail',
			m: createSoapDraftRequestFromEditor(editor, attach)
		},
		undefined,
		signal
	);
