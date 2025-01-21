/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

import { createSoapDraftRequestFromEditor } from '../store/editor/editor-transformations';
import type { SaveDraftParameters, SaveDraftRequest, SaveDraftResponse } from '../types';

export const saveDraftSoapApi = ({
	editor,
	signal
}: SaveDraftParameters): Promise<SaveDraftResponse> =>
	soapFetch<SaveDraftRequest, SaveDraftResponse>(
		'SaveDraft',
		{
			_jsns: 'urn:zimbraMail',
			m: createSoapDraftRequestFromEditor(editor)
		},
		undefined,
		signal
	);
