/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetch, SoapResponse } from '@zextras/carbonio-shell-ui';
import type { RedirectMessageActionRequest, MessageSpecification } from '../../types';

export const redirectMessageAction = ({
	id,
	e
}: MessageSpecification): Promise<SoapResponse<string>> =>
	soapFetch<RedirectMessageActionRequest, SoapResponse<string>>('BounceMsg', {
		_jsns: 'urn:zimbraMail',
		m: {
			id,
			e
		}
	});
