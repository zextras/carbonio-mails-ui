/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';

import type { SaveDraftParameters, SaveDraftRequest, SaveDraftResponse } from '../../types';
import { createSoapDraftRequestFromEditor } from '../zustand/editor/editor-transformations';

export const saveDraftV3 = ({ editor, signal }: SaveDraftParameters): Promise<SaveDraftResponse> =>
	soapFetch<SaveDraftRequest, SaveDraftResponse>(
		'SaveDraft',
		{
			_jsns: 'urn:zimbraMail',
			m: createSoapDraftRequestFromEditor(editor)
		},
		undefined,
		signal
	);

export const saveDraftAsyncThunk = createAsyncThunk<{ resp: SaveDraftResponse }, SaveDraftResponse>(
	'saveDraft',
	(resp) => ({
		resp
	})
);
