/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { SaveDraftRequest, SaveDraftResponse } from 'types/soap/save-draft';
import { SaveDraftParameters } from 'types/soap/soap';

export const saveDraftSoapApi = ({
	soapDraftMessageObj,
	signal
}: SaveDraftParameters): Promise<SaveDraftResponse> =>
	legacySoapFetch<SaveDraftRequest, SaveDraftResponse>(
		'SaveDraft',
		{
			_jsns: 'urn:zimbraMail',
			m: soapDraftMessageObj
		},
		undefined,
		signal
	);
