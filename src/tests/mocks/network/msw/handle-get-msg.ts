/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HttpResponse, HttpResponseResolver } from 'msw';

import { CarbonioMailboxRestGenericRequest } from '../../../../carbonio-ui-commons/test/mocks/network/msw/handlers';

export const handleGetMsgRequest: HttpResponseResolver<
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
	const { id } = (await request.json()).Body.GetMsgRequest.m;
	const { getMsgResult } = await import(`./cases/getMsg/getMsg-${id}`);
	return HttpResponse.json(getMsgResult);
};
