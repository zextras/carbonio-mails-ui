/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { JSNS } from '@zextras/carbonio-shell-ui';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { GetSignaturesRequest, GetSignaturesSoapResponse } from 'api/get-signatures-soap-api';
import { SignItemType } from 'types/settings';

export const handleGetSignaturesRequest = (signatures: Array<SignItemType>): void => {
	createSoapAPIInterceptor<GetSignaturesRequest, GetSignaturesSoapResponse>('GetSignatures', {
		signature: signatures,
		_jsns: JSNS.account
	});
};
