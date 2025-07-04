/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

import type { SaveDraftParameters, SaveDraftRequest, SaveDraftResponse } from 'types/index.d';

export const saveDraftSoapApi = ({
	soapDraftMessageObj,
	signal
}: SaveDraftParameters): Promise<SaveDraftResponse> =>
	soapFetch<SaveDraftRequest, SaveDraftResponse>(
		'SaveDraft',
		{
			_jsns: 'urn:zimbraMail',
			m: soapDraftMessageObj
		},
		undefined,
		signal
	);
