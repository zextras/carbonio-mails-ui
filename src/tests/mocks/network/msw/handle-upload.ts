/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MockedResponse, ResponseComposition, RestContext, RestRequest } from 'msw';
import {
	RestGenericRequest,
	RestGenericResponse
} from '../../../../carbonio-ui-commons/test/mocks/network/msw/handlers';

export const handleUploadRequest = async (
	req: RestRequest<RestGenericRequest>,
	res: ResponseComposition<RestGenericResponse>,
	ctx: RestContext
): Promise<MockedResponse<RestGenericResponse>> => {
	if (!req) {
		return res(ctx.status(500, 'Empty request'));
	}
	const msg = new RestGenericResponse(`200,'null',[{"aid":"83ea000c-cc50-4a12-a87b-1fb75b89bd2a:bbac1bf1-5bc0-44b9-a241-40e55d137bd5","ct":"image/png","filename":"designer.png","s":167157}]`;

	return res(ctx.text(msg));
};
