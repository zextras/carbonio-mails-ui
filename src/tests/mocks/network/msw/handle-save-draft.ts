/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ResponseComposition, RestContext, RestRequest } from 'msw';

import {
	RestGenericRequest,
	RestGenericResponse
} from '../../../../carbonio-ui-commons/test/mocks/network/msw/handlers';

export const handleSaveDraftRequest = async (
	req: RestRequest<RestGenericRequest>,
	res: ResponseComposition<RestGenericResponse>,
	ctx: RestContext
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/explicit-function-return-type
) => {
	if (!req) {
		return res(ctx.status(500, 'Empty request'));
	}
	const { id } = (await req.json<RestGenericRequest>()).Body.SaveDraftRequest.m;
	const { saveDraftResult } = await import(`./cases/saveDraft/saveDraft-${id}`);
	return res(ctx.json(saveDraftResult));
};
