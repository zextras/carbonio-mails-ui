/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { JSNS } from '@zextras/carbonio-shell-ui';

import { createAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { GetSignaturesRequest, GetSignaturesResponse } from '../../../../store/actions/signatures';
import { SignItemType } from '../../../../types';

export const handleGetSignaturesRequest = (signatures: Array<SignItemType>): void => {
	createAPIInterceptor<GetSignaturesRequest, GetSignaturesResponse>('GetSignatures', {
		signature: signatures,
		_jsns: JSNS.ACCOUNT
	});
};
