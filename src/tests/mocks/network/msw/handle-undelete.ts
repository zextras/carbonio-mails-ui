/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HttpResponse, HttpResponseResolver } from 'msw';

import { CarbonioMailboxRestGenericRequest } from '../../../../carbonio-ui-commons/test/mocks/network/msw/handlers';

export const handleUndeleteAPIRequest: HttpResponseResolver<
	never,
	CarbonioMailboxRestGenericRequest
> = async ({ request }) => {
	if (!request) {
		return HttpResponse.json(
			{},
			{
				status: 500,
				statusText: 'Empty request'
			}
		);
	}
	return HttpResponse.json({});
};
