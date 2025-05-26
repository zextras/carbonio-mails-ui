/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HttpResponse, HttpResponseResolver } from 'msw';

import { CarbonioMailboxRestGenericRequest } from '@zextras/carbonio-ui-commons';

export const handleGetConvRequest: HttpResponseResolver<
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
	const { id } = (await request.json()).Body.GetConvRequest.c;
	const { getConvResult } = await import(`./cases/getConv/getConv-${id}`);
	return HttpResponse.json(getConvResult);
};
